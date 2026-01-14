import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, generateToken, getAuthCookieOptions } from '@/lib/auth';
import { RegisterSchema, validate } from '@/lib/validation';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const data = validate(RegisterSchema, body);

        const db = await getDb();

        // Check if phone already exists
        const existingPhone = await db.collection('users').findOne({
            phone: data.phone,
        });

        if (existingPhone) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว'),
                { status: 409 }
            );
        }

        // Create user (no password for USER - phone IS the authentication)
        const now = new Date();
        const result = await db.collection('users').insertOne({
            username: data.username,
            phone: data.phone,
            role: 'USER',
            createdAt: now,
            updatedAt: now,
        });

        const userId = result.insertedId.toString();

        // Generate JWT token
        const token = generateToken({
            userId,
            email: data.phone,
            role: 'USER',
        });

        // Create response with cookie
        const response = Response.json(
            createApiResponse({
                message: 'สมัครสมาชิกสำเร็จ',
                user: {
                    id: userId,
                    username: data.username,
                    phone: data.phone,
                    role: 'USER',
                },
            }),
            { status: 201 }
        );

        // Set auth cookie
        response.headers.set(
            'Set-Cookie',
            `token=${token}; ${Object.entries(getAuthCookieOptions())
                .map(([key, value]) => `${key}=${value}`)
                .join('; ')}`
        );

        return response;
    } catch (error) {
        return handleApiError(error);
    }
}
