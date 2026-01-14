import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const db = await getDb();

        // Use aggregation to join related data
        const bookings = await db.collection('bookings').aggregate([
            {
                $lookup: {
                    from: 'stalls',
                    localField: 'stallId',
                    foreignField: '_id',
                    as: 'stall'
                }
            },
            { $unwind: { path: '$stall', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'payments',
                    localField: '_id',
                    foreignField: 'bookingId',
                    as: 'payment'
                }
            },
            { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },
            {
                $sort: { createdAt: -1 }
            }
        ]).toArray();

        // Remove sensitive information
        const sanitizedBookings = bookings.map(b => {
            if (b.user) {
                delete b.user.password;
            }
            return b;
        });

        return Response.json(createApiResponse(sanitizedBookings));
    } catch (error) {
        return handleApiError(error);
    }
}
