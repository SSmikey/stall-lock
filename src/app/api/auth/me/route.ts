import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
    try {
        // Get user from token
        const tokenUser = getUserFromRequest(request);

        if (!tokenUser) {
            return Response.json(
                createApiError(ErrorCodes.UNAUTHORIZED, 'กรุณาเข้าสู่ระบบ'),
                { status: 401 }
            );
        }

        const db = await getDb();

        // Get fresh user data from database
        const user = await db.collection('users').findOne({
            _id: new ObjectId(tokenUser.userId),
        });

        if (!user) {
            return Response.json(
                createApiError(ErrorCodes.UNAUTHORIZED, 'ไม่พบข้อมูลผู้ใช้'),
                { status: 401 }
            );
        }

        // Return user data (without password)
        return Response.json(
            createApiResponse({
                id: user._id.toString(),
                username: user.username,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
                createdAt: user.createdAt,
            })
        );
    } catch (error) {
        return handleApiError(error);
    }
}
