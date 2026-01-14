import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { comparePassword, generateToken, getAuthCookieOptions } from '@/lib/auth';
import { LoginSchema, AdminLoginSchema, validate } from '@/lib/validation';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const db = await getDb();

        // Check if it's admin login (has username field) or user login (has phone field)
        const isAdminLogin = body.username !== undefined;

        if (isAdminLogin) {
            // Admin login with username
            const data = validate(AdminLoginSchema, body);

            const user = await db.collection('users').findOne({
                username: data.username,
                role: 'ADMIN',
            });

            if (!user) {
                return Response.json(
                    createApiError(ErrorCodes.INVALID_CREDENTIALS, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'),
                    { status: 401 }
                );
            }

            const isPasswordValid = await comparePassword(data.password, user.password);

            if (!isPasswordValid) {
                return Response.json(
                    createApiError(ErrorCodes.INVALID_CREDENTIALS, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'),
                    { status: 401 }
                );
            }

            const userId = user._id.toString();
            const token = generateToken({
                userId,
                email: user.phone,
                role: user.role,
            });

            const response = Response.json(
                createApiResponse({
                    message: 'เข้าสู่ระบบสำเร็จ',
                    user: {
                        id: userId,
                        username: user.username,
                        phone: user.phone,
                        role: user.role,
                    },
                }),
                { status: 200 }
            );

            response.headers.set(
                'Set-Cookie',
                `token=${token}; ${Object.entries(getAuthCookieOptions())
                    .map(([key, value]) => `${key}=${value}`)
                    .join('; ')}`
            );

            return response;
        } else {
            // User login with phone only (no password)
            const data = validate(LoginSchema, body);

            const user = await db.collection('users').findOne({
                phone: data.phone,
                role: 'USER', // Only USER can login with phone
            });

            if (!user) {
                return Response.json(
                    createApiError(ErrorCodes.INVALID_CREDENTIALS, 'ไม่พบเบอร์โทรศัพท์นี้ในระบบ'),
                    { status: 401 }
                );
            }

            const userId = user._id.toString();
            const token = generateToken({
                userId,
                email: user.phone,
                role: user.role,
            });

            const response = Response.json(
                createApiResponse({
                    message: 'เข้าสู่ระบบสำเร็จ',
                    user: {
                        id: userId,
                        username: user.username,
                        phone: user.phone,
                        role: user.role,
                    },
                }),
                { status: 200 }
            );

            response.headers.set(
                'Set-Cookie',
                `token=${token}; ${Object.entries(getAuthCookieOptions())
                    .map(([key, value]) => `${key}=${value}`)
                    .join('; ')}`
            );

            return response;
        }
    } catch (error) {
        return handleApiError(error);
    }
}
