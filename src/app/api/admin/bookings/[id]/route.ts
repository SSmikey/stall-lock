import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';
import { ObjectId } from 'mongodb';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if user is admin
        const tokenUser = getUserFromRequest(request);
        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        if (!id) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'ไม่ระบุ ID'),
                { status: 400 }
            );
        }

        const db = await getDb();

        // 1. Get the booking to find the stallId
        const booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });

        if (!booking) {
            return Response.json(
                createApiError(ErrorCodes.BOOKING_NOT_FOUND, 'ไม่พบรหัสการจอง'),
                { status: 404 }
            );
        }

        // 2. Delete the booking
        await db.collection('bookings').deleteOne({ _id: new ObjectId(id) });

        // 3. Delete related payment if it exists
        await db.collection('payments').deleteOne({ bookingId: new ObjectId(id) });

        // 4. Update stall status back to AVAILABLE if it was reserved/booked by this booking
        // Only if there is no other active booking for this stall (extra safety)
        await db.collection('stalls').updateOne(
            { _id: booking.stallId },
            { $set: { status: 'AVAILABLE', updatedAt: new Date() } }
        );

        return Response.json(createApiResponse({ message: 'ลบรายการจองสำเร็จ' }));
    } catch (error) {
        return handleApiError(error);
    }
}
