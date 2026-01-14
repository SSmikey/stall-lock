import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const db = await getDb();
        const now = new Date();

        // 1. Find all bookings that are RESERVED and have passed their expiresAt
        const expiredBookings = await db.collection('bookings').find({
            status: 'RESERVED',
            expiresAt: { $lt: now }
        }).toArray();

        if (expiredBookings.length === 0) {
            return Response.json(createApiResponse({ message: 'No expired bookings found', count: 0 }));
        }

        const bookingIds = expiredBookings.map(b => b._id);
        const stallIds = expiredBookings.map(b => b.stallId);

        // 2. Update bookings to EXPIRED
        await db.collection('bookings').updateMany(
            { _id: { $in: bookingIds } },
            {
                $set: {
                    status: 'EXPIRED',
                    updatedAt: now
                }
            }
        );

        // 3. Reset stalls to AVAILABLE
        await db.collection('stalls').updateMany(
            { _id: { $in: stallIds } },
            {
                $set: {
                    status: 'AVAILABLE',
                    updatedAt: now
                }
            }
        );

        return Response.json(createApiResponse({
            message: 'Cleanup successful',
            count: expiredBookings.length,
            expiredBookingIds: bookingIds
        }));
    } catch (error) {
        return handleApiError(error);
    }
}
