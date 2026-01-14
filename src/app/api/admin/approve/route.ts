import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const { bookingId, adminId } = await request.json();

        if (!bookingId) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณาระบุรหัสการจอง'),
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('stalllock');
        const session = client.startSession();

        try {
            await session.withTransaction(async () => {
                // 1. Get booking
                const booking = await db.collection('bookings').findOne(
                    { _id: new ObjectId(bookingId) },
                    { session }
                );

                if (!booking) {
                    throw { code: ErrorCodes.BOOKING_NOT_FOUND, status: 404 };
                }

                if (booking.status !== 'AWAITING_APPROVAL') {
                    throw {
                        code: ErrorCodes.INVALID_INPUT,
                        message: 'การจองนี้ไม่ได้อยู่ในสถานะรอตรวจสอบ',
                        status: 400
                    };
                }

                // 2. Update booking status
                await db.collection('bookings').updateOne(
                    { _id: new ObjectId(bookingId) },
                    {
                        $set: {
                            status: 'CONFIRMED',
                            approvedAt: new Date(),
                            approvedBy: adminId ? new ObjectId(adminId) : null,
                            updatedAt: new Date()
                        }
                    },
                    { session }
                );

                // 3. Update stall status
                await db.collection('stalls').updateOne(
                    { _id: booking.stallId },
                    {
                        $set: {
                            status: 'CONFIRMED',
                            updatedAt: new Date()
                        }
                    },
                    { session }
                );

                // 4. Update payment status
                await db.collection('payments').updateOne(
                    { bookingId: new ObjectId(bookingId) },
                    {
                        $set: {
                            status: 'APPROVED',
                            verifiedAt: new Date(),
                            verifiedBy: adminId ? new ObjectId(adminId) : null
                        }
                    },
                    { session }
                );
            });

            return Response.json(createApiResponse({ success: true, message: 'อนุมัติการจองเรียบร้อยแล้ว' }));
        } finally {
            await session.endSession();
        }
    } catch (error: any) {
        return handleApiError(error);
    }
}
