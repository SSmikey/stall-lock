import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';
import { requireAdmin, hashPassword } from '@/lib/auth';

// GET - List all users
export async function GET(request: NextRequest) {
    try {
        requireAdmin(request);

        const db = await getDb();

        const users = await db.collection('users').aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'bookings'
                }
            },
            {
                $project: {
                    password: 0 // Remove password field
                }
            },
            {
                $addFields: {
                    bookingCount: { $size: '$bookings' }
                }
            },
            {
                $project: {
                    bookings: 0 // Remove bookings array, keep only count
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]).toArray();

        return Response.json(createApiResponse(users));
    } catch (error) {
        return handleApiError(error);
    }
}

// POST - Create new user
export async function POST(request: NextRequest) {
    try {
        requireAdmin(request);

        const db = await getDb();
        const body = await request.json();

        const { username, email, password, fullName, phone, role } = body;

        // Validate required fields
        if (!username || !email || !password || !fullName) {
            return Response.json(
                createApiResponse(null, {
                    code: 'VALIDATION_ERROR',
                    message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
                }),
                { status: 400 }
            );
        }

        // Check if username or email already exists
        const existingUser = await db.collection('users').findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return Response.json(
                createApiResponse(null, {
                    code: 'DUPLICATE_ERROR',
                    message: 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้วในระบบ'
                }),
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const newUser = {
            username,
            email,
            password: hashedPassword,
            fullName,
            phone: phone || '',
            role: role === 'ADMIN' ? 'ADMIN' : 'USER',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        return Response.json(
            createApiResponse({
                ...userWithoutPassword,
                _id: result.insertedId
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
