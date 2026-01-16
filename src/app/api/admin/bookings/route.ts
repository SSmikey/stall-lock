import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    try {
        const db = await getDb();

        // Get all bookings first
        const bookingsRaw = await db.collection('bookings').find({}).sort({ createdAt: -1 }).toArray();

        // Get all related data
        const stallIds = bookingsRaw.map(b => b.stallId).filter(Boolean);
        const userIds = bookingsRaw.map(b => {
            if (!b.userId) return null;
            // Handle both string and ObjectId
            if (typeof b.userId === 'string') {
                try {
                    return new ObjectId(b.userId);
                } catch {
                    return null;
                }
            }
            return b.userId;
        }).filter(Boolean);

        const [stalls, users] = await Promise.all([
            db.collection('stalls').find({ _id: { $in: stallIds } }).toArray(),
            db.collection('users').find({ _id: { $in: userIds } }).toArray()
        ]);

        // Create lookup maps
        const stallMap = new Map(stalls.map(s => [s._id.toString(), s]));
        const userMap = new Map(users.map(u => [u._id.toString(), u]));

        // Join data manually
        const bookings = bookingsRaw.map(booking => {
            const stall = booking.stallId ? stallMap.get(booking.stallId.toString()) : null;

            let user = null;
            if (booking.userId) {
                const userIdStr = booking.userId.toString();
                user = userMap.get(userIdStr);
            }

            // Remove password from user
            if (user) {
                const { password, ...userWithoutPassword } = user;
                user = userWithoutPassword;
            }

            return {
                ...booking,
                stall: stall || null,
                user: user || null
            };
        });

        return Response.json(createApiResponse(bookings));
    } catch (error) {
        return handleApiError(error);
    }
}
