import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/auth';

// POST - Fix bookings with invalid userId
export async function POST(request: NextRequest) {
    try {
        requireAdmin(request);

        const db = await getDb();

        // Get all users
        const users = await db.collection('users').find({}).toArray();

        if (users.length === 0) {
            return Response.json(
                createApiResponse(null, {
                    code: 'NO_USERS',
                    message: 'ไม่มีผู้ใช้ในระบบ'
                }),
                { status: 400 }
            );
        }

        // Get valid user IDs
        const validUserIds = new Set(users.map(u => u._id.toString()));

        // Get all bookings
        const bookings = await db.collection('bookings').find({}).toArray();

        // Find bookings with invalid userId
        const invalidBookings = bookings.filter(b => {
            if (!b.userId) return true;
            return !validUserIds.has(b.userId.toString());
        });

        if (invalidBookings.length === 0) {
            return Response.json(createApiResponse({
                message: 'ไม่มี booking ที่ต้องแก้ไข',
                fixed: 0
            }));
        }

        // Find a non-admin user to assign, or use first user
        const defaultUser = users.find(u => u.role === 'USER') || users[0];

        // Update invalid bookings
        const result = await db.collection('bookings').updateMany(
            {
                _id: { $in: invalidBookings.map(b => b._id) }
            },
            {
                $set: {
                    userId: defaultUser._id,
                    updatedAt: new Date()
                }
            }
        );

        return Response.json(createApiResponse({
            message: `แก้ไข booking สำเร็จ`,
            fixed: result.modifiedCount,
            assignedTo: {
                userId: defaultUser._id.toString(),
                username: defaultUser.username
            }
        }));
    } catch (error) {
        return handleApiError(error);
    }
}

// GET - Check bookings status
export async function GET(request: NextRequest) {
    try {
        requireAdmin(request);

        const db = await getDb();

        // Get all users
        const users = await db.collection('users').find({}).toArray();
        const validUserIds = new Set(users.map(u => u._id.toString()));

        // Get all bookings
        const bookings = await db.collection('bookings').find({}).toArray();

        // Find bookings with invalid userId
        const invalidBookings = bookings.filter(b => {
            if (!b.userId) return true;
            return !validUserIds.has(b.userId.toString());
        });

        return Response.json(createApiResponse({
            totalBookings: bookings.length,
            invalidBookings: invalidBookings.length,
            validBookings: bookings.length - invalidBookings.length,
            users: users.map(u => ({
                _id: u._id.toString(),
                username: u.username,
                role: u.role
            }))
        }));
    } catch (error) {
        return handleApiError(error);
    }
}
