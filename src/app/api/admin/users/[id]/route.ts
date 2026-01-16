import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// GET - Get single user
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        requireAdmin(request);

        const { id } = await params;
        const db = await getDb();

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(id) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return Response.json(
                createApiResponse(null, {
                    code: 'NOT_FOUND',
                    message: 'ไม่พบผู้ใช้นี้'
                }),
                { status: 404 }
            );
        }

        // Get user's bookings
        const bookings = await db.collection('bookings').aggregate([
            { $match: { userId: new ObjectId(id) } },
            {
                $lookup: {
                    from: 'stalls',
                    localField: 'stallId',
                    foreignField: '_id',
                    as: 'stall'
                }
            },
            { $unwind: { path: '$stall', preserveNullAndEmptyArrays: true } },
            { $sort: { createdAt: -1 } }
        ]).toArray();

        return Response.json(createApiResponse({ ...user, bookings }));
    } catch (error) {
        return handleApiError(error);
    }
}

// PUT - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        requireAdmin(request);

        const { id } = await params;
        const db = await getDb();
        const body = await request.json();

        const { username, email, fullName, phone, role, password } = body;

        // Check if user exists
        const existingUser = await db.collection('users').findOne({
            _id: new ObjectId(id)
        });

        if (!existingUser) {
            return Response.json(
                createApiResponse(null, {
                    code: 'NOT_FOUND',
                    message: 'ไม่พบผู้ใช้นี้'
                }),
                { status: 404 }
            );
        }

        // Check for duplicate username/email (excluding current user)
        if (username || email) {
            const duplicate = await db.collection('users').findOne({
                _id: { $ne: new ObjectId(id) },
                $or: [
                    ...(username ? [{ username }] : []),
                    ...(email ? [{ email }] : [])
                ]
            });

            if (duplicate) {
                return Response.json(
                    createApiResponse(null, {
                        code: 'DUPLICATE_ERROR',
                        message: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้วในระบบ'
                    }),
                    { status: 400 }
                );
            }
        }

        // Build update object
        const updateData: any = {
            updatedAt: new Date()
        };

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (fullName) updateData.fullName = fullName;
        if (phone !== undefined) updateData.phone = phone;
        if (role === 'ADMIN' || role === 'USER') updateData.role = role;
        if (password) updateData.password = await hashPassword(password);

        await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        // Get updated user
        const updatedUser = await db.collection('users').findOne(
            { _id: new ObjectId(id) },
            { projection: { password: 0 } }
        );

        return Response.json(createApiResponse(updatedUser));
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        requireAdmin(request);

        const { id } = await params;
        const db = await getDb();

        // Check if user exists
        const user = await db.collection('users').findOne({
            _id: new ObjectId(id)
        });

        if (!user) {
            return Response.json(
                createApiResponse(null, {
                    code: 'NOT_FOUND',
                    message: 'ไม่พบผู้ใช้นี้'
                }),
                { status: 404 }
            );
        }

        // Check for active bookings
        const activeBookings = await db.collection('bookings').countDocuments({
            userId: new ObjectId(id),
            status: { $in: ['RESERVED', 'AWAITING_APPROVAL', 'CONFIRMED'] }
        });

        if (activeBookings > 0) {
            return Response.json(
                createApiResponse(null, {
                    code: 'HAS_ACTIVE_BOOKINGS',
                    message: `ไม่สามารถลบได้เนื่องจากผู้ใช้มีการจองที่ยังใช้งานอยู่ ${activeBookings} รายการ`
                }),
                { status: 400 }
            );
        }

        // Delete user
        await db.collection('users').deleteOne({ _id: new ObjectId(id) });

        return Response.json(createApiResponse({ deleted: true }));
    } catch (error) {
        return handleApiError(error);
    }
}
