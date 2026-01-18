import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';

// Active booking statuses that block deletion
const ACTIVE_BOOKING_STATUSES = ['RESERVED', 'AWAITING_PAYMENT', 'AWAITING_APPROVAL', 'CONFIRMED'];

// GET - Preview deletion (count affected stalls and bookings)
export async function GET(request: NextRequest) {
    try {
        const tokenUser = getUserFromRequest(request);
        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') as 'ALL' | 'ZONE' | 'SPECIFIC';
        const zone = searchParams.get('zone');
        const stallIdsParam = searchParams.get('stallIds');

        const db = await getDb();

        // Build filter based on mode
        let stallFilter: any = {};
        if (mode === 'ZONE' && zone) {
            stallFilter.zone = zone;
        } else if (mode === 'SPECIFIC' && stallIdsParam) {
            const stallIds = stallIdsParam.split(',').filter(id => ObjectId.isValid(id));
            if (stallIds.length > 0) {
                stallFilter._id = { $in: stallIds.map(id => new ObjectId(id)) };
            }
        }

        // Get all matching stalls
        const stalls = await db.collection('stalls').find(stallFilter).toArray();
        const stallObjectIds = stalls.map(s => s._id);

        if (stallObjectIds.length === 0) {
            return Response.json(createApiResponse({
                totalStalls: 0,
                stallsWithActiveBookings: 0,
                stallsAvailable: 0,
                affectedBookingsCount: 0,
                stalls: []
            }));
        }

        // Count bookings with active status for these stalls
        const activeBookingsCount = await db.collection('bookings').countDocuments({
            stallId: { $in: stallObjectIds },
            status: { $in: ACTIVE_BOOKING_STATUSES }
        });

        // Get stalls with active bookings
        const stallsWithActiveBookings = await db.collection('bookings').distinct('stallId', {
            stallId: { $in: stallObjectIds },
            status: { $in: ACTIVE_BOOKING_STATUSES }
        });

        const stallsWithActiveBookingsSet = new Set(stallsWithActiveBookings.map(id => id.toString()));

        return Response.json(createApiResponse({
            totalStalls: stalls.length,
            stallsWithActiveBookings: stallsWithActiveBookingsSet.size,
            stallsAvailable: stalls.length - stallsWithActiveBookingsSet.size,
            affectedBookingsCount: activeBookingsCount,
            stalls: stalls.map(s => ({
                _id: s._id.toString(),
                stallId: s.stallId,
                zone: s.zone,
                status: s.status,
                price: s.price,
                priceUnit: s.priceUnit,
                hasActiveBooking: stallsWithActiveBookingsSet.has(s._id.toString())
            }))
        }));
    } catch (error) {
        return handleApiError(error);
    }
}

// POST - Execute deletion
export async function POST(request: NextRequest) {
    try {
        const tokenUser = getUserFromRequest(request);
        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        const body = await request.json();
        const { mode, zone, stallIds, forceDelete } = body;

        // Validate mode
        if (!['ALL', 'ZONE', 'SPECIFIC'].includes(mode)) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'โหมดการลบไม่ถูกต้อง'),
                { status: 400 }
            );
        }

        // Validate zone for ZONE mode
        if (mode === 'ZONE' && !zone) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณาเลือกโซน'),
                { status: 400 }
            );
        }

        // Validate stallIds for SPECIFIC mode
        if (mode === 'SPECIFIC' && (!stallIds || !Array.isArray(stallIds) || stallIds.length === 0)) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณาเลือกแผงที่ต้องการลบ'),
                { status: 400 }
            );
        }

        const db = await getDb();

        // Build filter based on mode
        let stallFilter: any = {};
        if (mode === 'ZONE') {
            stallFilter.zone = zone;
        } else if (mode === 'SPECIFIC') {
            const validIds = stallIds.filter((id: string) => ObjectId.isValid(id));
            if (validIds.length === 0) {
                return Response.json(
                    createApiError(ErrorCodes.INVALID_INPUT, 'ไม่มี ID ที่ถูกต้อง'),
                    { status: 400 }
                );
            }
            stallFilter._id = { $in: validIds.map((id: string) => new ObjectId(id)) };
        }

        // Get matching stalls
        const stalls = await db.collection('stalls').find(stallFilter).toArray();

        if (stalls.length === 0) {
            return Response.json(
                createApiError(ErrorCodes.STALL_NOT_FOUND, 'ไม่พบแผงที่ตรงกับเงื่อนไข'),
                { status: 404 }
            );
        }

        const stallObjectIds = stalls.map(s => s._id);

        // Find stalls with active bookings
        const stallsWithActiveBookings = await db.collection('bookings').distinct('stallId', {
            stallId: { $in: stallObjectIds },
            status: { $in: ACTIVE_BOOKING_STATUSES }
        });
        const activeBookingStallSet = new Set(stallsWithActiveBookings.map(id => id.toString()));

        let stallsToDelete: ObjectId[] = [];
        let skippedStalls: string[] = [];
        let deletedBookingsCount = 0;
        let deletedPaymentsCount = 0;

        if (forceDelete) {
            // Force delete all, including those with active bookings
            stallsToDelete = stallObjectIds;

            // Get booking IDs before deleting
            const bookings = await db.collection('bookings').find({
                stallId: { $in: stallObjectIds }
            }).toArray();
            const bookingIds = bookings.map(b => b._id);

            // Delete all payments for these bookings
            if (bookingIds.length > 0) {
                const paymentDeleteResult = await db.collection('payments').deleteMany({
                    bookingId: { $in: bookingIds }
                });
                deletedPaymentsCount = paymentDeleteResult.deletedCount;
            }

            // Delete all bookings for these stalls
            const bookingDeleteResult = await db.collection('bookings').deleteMany({
                stallId: { $in: stallObjectIds }
            });
            deletedBookingsCount = bookingDeleteResult.deletedCount;
        } else {
            // Only delete stalls without active bookings
            for (const stall of stalls) {
                if (activeBookingStallSet.has(stall._id.toString())) {
                    skippedStalls.push(stall.stallId);
                } else {
                    stallsToDelete.push(stall._id);

                    // Delete inactive bookings and their payments for this stall
                    const inactiveBookings = await db.collection('bookings').find({
                        stallId: stall._id,
                        status: { $nin: ACTIVE_BOOKING_STATUSES }
                    }).toArray();

                    if (inactiveBookings.length > 0) {
                        const inactiveBookingIds = inactiveBookings.map(b => b._id);
                        await db.collection('payments').deleteMany({
                            bookingId: { $in: inactiveBookingIds }
                        });
                        await db.collection('bookings').deleteMany({
                            _id: { $in: inactiveBookingIds }
                        });
                    }
                }
            }
        }

        // Delete the stalls
        let deletedCount = 0;
        if (stallsToDelete.length > 0) {
            const result = await db.collection('stalls').deleteMany({
                _id: { $in: stallsToDelete }
            });
            deletedCount = result.deletedCount;
        }

        return Response.json(createApiResponse({
            message: `ลบแผงสำเร็จ ${deletedCount} แผง`,
            deletedCount,
            skippedCount: skippedStalls.length,
            skippedStalls: skippedStalls.length > 0 ? skippedStalls : undefined,
            deletedBookingsCount: forceDelete ? deletedBookingsCount : undefined,
            deletedPaymentsCount: forceDelete ? deletedPaymentsCount : undefined
        }));
    } catch (error) {
        return handleApiError(error);
    }
}
