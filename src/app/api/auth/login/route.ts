import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { comparePassword, generateToken, getAuthCookieOptions } from '@/lib/auth';
import { LoginSchema, validate } from '@/lib/validation';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const data = validate(LoginSchema, body);

        const db = await getDb();

        // Find user by email
        const user = await db.collection('users').findOne({
            email: data.email,
        });

        if (!user) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_CREDENTIALS, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'),
                { status: 401 }
            );
        }

        // Verify password
        const isPasswordValid = await comparePassword(data.password, user.password);

        if (!isPasswordValid) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_CREDENTIALS, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'),
                { status: 401 }
            );
        }

        const userId = user._id.toString();

        // Generate JWT token
        const token = generateToken({
            userId,
            email: user.email,
            role: user.role,
        });

        // Create response with cookie
        const response = Response.json(
            createApiResponse({
                message: 'เข้าสู่ระบบสำเร็จ',
                user: {
                    id: userId,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                },
            }),
            { status: 200 }
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
