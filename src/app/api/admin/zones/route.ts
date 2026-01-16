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
        const zones = await db.collection('zones')
            .find({})
            .sort({ name: 1 })
            .toArray();

        return Response.json(createApiResponse(zones));
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
        const { name, description, color } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, 'กรุณาระบุชื่อโซน'),
                { status: 400 }
            );
        }

        const db = await getDb();
        const now = new Date();

        // Check if zone name already exists
        const existing = await db.collection('zones').findOne({
            name: name.trim().toUpperCase()
        });

        if (existing) {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, `โซน "${name}" มีอยู่ในระบบแล้ว`),
                { status: 400 }
            );
        }

        const zone = {
            name: name.trim().toUpperCase(),
            description: description?.trim() || null,
            color: color?.trim() || null,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('zones').insertOne(zone);

        return Response.json(
            createApiResponse({
                ...zone,
                _id: result.insertedId
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}
