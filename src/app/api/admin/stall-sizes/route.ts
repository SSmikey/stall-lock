import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';

export async function GET(request: NextRequest) {
    try {
        const tokenUser = getUserFromRequest(request);

        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        const db = await getDb();
        const stallSizes = await db.collection('stallSizes')
            .find({})
            .sort({ name: 1 })
            .toArray();

        return Response.json(createApiResponse(stallSizes));
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const tokenUser = getUserFromRequest(request);

        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, label, dimensions } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, 'กรุณาระบุรหัสขนาด'),
                { status: 400 }
            );
        }

        if (!label || typeof label !== 'string' || label.trim() === '') {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, 'กรุณาระบุชื่อที่แสดง'),
                { status: 400 }
            );
        }

        const db = await getDb();
        const now = new Date();

        // Check if size name already exists
        const existing = await db.collection('stallSizes').findOne({
            name: name.trim().toUpperCase()
        });

        if (existing) {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, `ขนาด "${name}" มีอยู่ในระบบแล้ว`),
                { status: 400 }
            );
        }

        const stallSize = {
            name: name.trim().toUpperCase(),
            label: label.trim(),
            dimensions: dimensions?.trim() || null,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('stallSizes').insertOne(stallSize);

        return Response.json(
            createApiResponse({
                ...stallSize,
                _id: result.insertedId
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
