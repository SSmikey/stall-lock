import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        // Check if user is admin
        const tokenUser = getUserFromRequest(request);

        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        const body = await request.json();
        const { stallId, zone, size, price, description } = body;

        // Validate required fields
        if (!stallId || !zone || !size || !price) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณากรอกข้อมูลให้ครบถ้วน'),
                { status: 400 }
            );
        }

        // Validate price is a positive number
        if (typeof price !== 'number' || price <= 0) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'ราคาต้องเป็นตัวเลขที่มากกว่า 0'),
                { status: 400 }
            );
        }

        const db = await getDb();

        // Check if stallId already exists
        const existingStall = await db.collection('stalls').findOne({ stallId });

        if (existingStall) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'รหัสแผงนี้มีอยู่ในระบบแล้ว'),
                { status: 400 }
            );
        }

        // Create new stall
        const now = new Date();
        const result = await db.collection('stalls').insertOne({
            stallId,
            zone,
            size,
            price,
            description: description || null,
            status: 'AVAILABLE',
            createdAt: now,
            updatedAt: now,
        });

        return Response.json(
            createApiResponse({
                message: 'เพิ่มแผงตลาดสำเร็จ',
                stall: {
                    id: result.insertedId.toString(),
                    stallId,
                    zone,
                    size,
                    price,
                    description,
                    status: 'AVAILABLE',
                },
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
