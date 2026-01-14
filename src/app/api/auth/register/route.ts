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

        // Check if username already exists
        const existingUsername = await db.collection('users').findOne({
            username: data.username,
        });

        if (existingUsername) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว'),
                { status: 409 }
            );
        }

        // Check if email already exists
        const existingEmail = await db.collection('users').findOne({
            email: data.email,
        });

        if (existingEmail) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'อีเมลนี้ถูกใช้งานแล้ว'),
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user
        const now = new Date();
        const result = await db.collection('users').insertOne({
            username: data.username,
            email: data.email,
            password: hashedPassword,
            fullName: data.fullName,
            phone: data.phone || null,
            role: 'USER', // Default role
            createdAt: now,
            updatedAt: now,
        });

        const userId = result.insertedId.toString();

        // Generate JWT token
        const token = generateToken({
            userId,
            email: data.email,
            role: 'USER',
        });

        // Create response with cookie
        const response = Response.json(
            createApiResponse({
                message: 'สมัครสมาชิกสำเร็จ',
                user: {
                    id: userId,
                    username: data.username,
                    email: data.email,
                    fullName: data.fullName,
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
