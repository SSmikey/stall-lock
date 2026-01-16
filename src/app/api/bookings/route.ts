import { getDb, cleanupExpiredBookings, autoReturnStalls } from '@/lib/db';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        await cleanupExpiredBookings();
        await autoReturnStalls();
        const body = await request.json();
        const { stallId, userId } = body;

        if (!stallId || !userId) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'stallId และ userId จำเป็นต้องระบุ'),
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('stalllock');
        const session = client.startSession();

        try {
            let result: any;

            await session.withTransaction(async () => {
                // 1. Check if stall exists and is available
                const stall = await db.collection('stalls').findOneAndUpdate(
                    {
                        _id: new ObjectId(stallId),
                        status: 'AVAILABLE',
                    },
                    {
                        $set: {
                            status: 'RESERVED',
                            updatedAt: new Date(),
                        },
                    },
                    {
                        session,
                        returnDocument: 'after',
                    }
                );

                if (!stall) {
                    throw {
                        code: ErrorCodes.STALL_NOT_AVAILABLE,
                        message: 'ล็อคนี้ไม่ว่าง',
                        status: 409,
                    };
                }

                // 2. Generate booking ID (inside transaction to prevent race condition)
                const bookingId = await generateBookingId(db, session);
                const now = new Date();
                const expiresAt = new Date(now.getTime() + 1800000); // 30 minutes (30 * 60 * 1000)

                // 3. Create booking
                const booking = await db.collection('bookings').insertOne(
                    {
                        bookingId,
                        stallId: new ObjectId(stallId),
                        userId: new ObjectId(userId),
                        status: 'RESERVED',
                        reservedAt: now,
                        expiresAt,
                        createdAt: now,
                        updatedAt: now,
                    },
                    { session }
                );

                result = {
                    bookingId,
                    _id: booking.insertedId,
                    stallId: new ObjectId(stallId),
                    userId: new ObjectId(userId),
                    status: 'RESERVED',
                    reservedAt: now,
                    expiresAt,
                    timeRemaining: 1800,
                };
            });

            return Response.json(createApiResponse(result), { status: 201 });
        } finally {
            await session.endSession();
        }
    } catch (error: any) {
        return handleApiError(error);
    }
}

export async function GET(request: NextRequest) {
    try {
        await cleanupExpiredBookings();
        await autoReturnStalls();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        const db = await getDb();
        const filter: any = {};

        if (userId) {
            filter.userId = new ObjectId(userId);
        }

        const bookings = await db
            .collection('bookings')
            .find(filter)
            .sort({ createdAt: -1 })
            .toArray();

        return Response.json(createApiResponse(bookings));
    } catch (error) {
        return handleApiError(error);
    }
}

async function generateBookingId(db: any, session: any): Promise<string> {
    const year = new Date().getFullYear();

    // Use atomic counter with findOneAndUpdate to prevent race condition
    const counter = await db.collection('counters').findOneAndUpdate(
        { _id: 'bookingId', year },
        { $inc: { seq: 1 } },
        {
            upsert: true,
            returnDocument: 'after',
            session
        }
    );

    const number = String(counter?.seq || 1).padStart(4, '0');
    return `BK-${year}-${number}`;
}
