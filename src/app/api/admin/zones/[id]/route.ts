import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tokenUser = getUserFromRequest(request);

        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, 'ID ไม่ถูกต้อง'),
                { status: 400 }
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

        // Check if zone name already exists (excluding current zone)
        const existing = await db.collection('zones').findOne({
            name: name.trim().toUpperCase(),
            _id: { $ne: new ObjectId(id) }
        });

        if (existing) {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, `โซน "${name}" มีอยู่ในระบบแล้ว`),
                { status: 400 }
            );
        }

        const result = await db.collection('zones').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name: name.trim().toUpperCase(),
                    description: description?.trim() || null,
                    color: color?.trim() || null,
                    updatedAt: now,
                }
            }
        );

        if (result.matchedCount === 0) {
            return Response.json(
                createApiError(ErrorCodes.NOT_FOUND, 'ไม่พบโซนนี้'),
                { status: 404 }
            );
        }

        return Response.json(createApiResponse({ message: 'อัปเดตโซนเรียบร้อยแล้ว' }));
    } catch (error) {
        return handleApiError(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const tokenUser = getUserFromRequest(request);

        if (!tokenUser || tokenUser.role !== 'ADMIN') {
            return Response.json(
                createApiError(ErrorCodes.FORBIDDEN, 'ไม่มีสิทธิ์เข้าถึง'),
                { status: 403 }
            );
        }

        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return Response.json(
                createApiError(ErrorCodes.VALIDATION_ERROR, 'ID ไม่ถูกต้อง'),
                { status: 400 }
            );
        }

        const db = await getDb();

        // Check if zone is being used by any stalls
        const zone = await db.collection('zones').findOne({ _id: new ObjectId(id) });
        if (zone) {
            const stallsUsingZone = await db.collection('stalls').countDocuments({ zone: zone.name });
            if (stallsUsingZone > 0) {
                return Response.json(
                    createApiError(ErrorCodes.VALIDATION_ERROR, `ไม่สามารถลบได้ มีแผงตลาด ${stallsUsingZone} แผงที่ใช้โซนนี้อยู่`),
                    { status: 400 }
                );
            }
        }

        const result = await db.collection('zones').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return Response.json(
                createApiError(ErrorCodes.NOT_FOUND, 'ไม่พบโซนนี้'),
                { status: 404 }
            );
        }

        return Response.json(createApiResponse({ message: 'ลบโซนเรียบร้อยแล้ว' }));
    } catch (error) {
        return handleApiError(error);
    }
}
