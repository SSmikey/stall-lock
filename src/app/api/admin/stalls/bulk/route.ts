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
        const { zone, size, price, priceUnit, description, quantity, startNumber } = body;

        // Validate required fields
        if (!zone || !size || !price || !quantity || !startNumber) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณากรอกข้อมูลให้ครบถ้วน'),
                { status: 400 }
            );
        }

        // Validate numbers
        if (typeof price !== 'number' || price <= 0) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'ราคาต้องเป็นตัวเลขที่มากกว่า 0'),
                { status: 400 }
            );
        }

        if (typeof quantity !== 'number' || quantity <= 0 || quantity > 100) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'จำนวนแผงต้องอยู่ระหว่าง 1-100'),
                { status: 400 }
            );
        }

        if (typeof startNumber !== 'number' || startNumber < 1) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'เลขเริ่มต้นต้องมากกว่า 0'),
                { status: 400 }
            );
        }

        const db = await getDb();
        const now = new Date();
        const stallsToCreate = [];

        // Generate stall IDs and check for duplicates
        for (let i = 0; i < quantity; i++) {
            const number = startNumber + i;
            const stallId = `${zone}-${String(number).padStart(3, '0')}`;

            // Check if stallId already exists
            const existing = await db.collection('stalls').findOne({ stallId });
            if (existing) {
                return Response.json(
                    createApiError(ErrorCodes.INVALID_INPUT, `รหัสแผง ${stallId} มีอยู่ในระบบแล้ว`),
                    { status: 400 }
                );
            }

            stallsToCreate.push({
                stallId,
                zone,
                size,
                price,
                priceUnit: priceUnit || 'DAY',
                description: description || null,
                status: 'AVAILABLE',
                createdAt: now,
                updatedAt: now,
            });
        }

        // Insert all stalls at once
        const result = await db.collection('stalls').insertMany(stallsToCreate);

        return Response.json(
            createApiResponse({
                message: `เพิ่มแผงตลาดสำเร็จ ${quantity} แผง`,
                count: result.insertedCount,
                stalls: stallsToCreate.map(s => ({
                    stallId: s.stallId,
                    zone: s.zone,
                    size: s.size,
                    price: s.price,
                    priceUnit: s.priceUnit,
                })),
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
