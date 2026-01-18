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
                createApiError(ErrorCodes.INVALID_INPUT, 'ID ไม่ถูกต้อง'),
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, label, dimensions } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณาระบุรหัสขนาด'),
                { status: 400 }
            );
        }

        if (!label || typeof label !== 'string' || label.trim() === '') {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณาระบุชื่อที่แสดง'),
                { status: 400 }
            );
        }

        const db = await getDb();
        const now = new Date();

        // Check if size name already exists (excluding current)
        const existing = await db.collection('stallSizes').findOne({
            name: name.trim().toUpperCase(),
            _id: { $ne: new ObjectId(id) }
        });

        if (existing) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, `ขนาด "${name}" มีอยู่ในระบบแล้ว`),
                { status: 400 }
            );
        }

        const result = await db.collection('stallSizes').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name: name.trim().toUpperCase(),
                    label: label.trim(),
                    dimensions: dimensions?.trim() || null,
                    updatedAt: now,
                }
            }
        );

        if (result.matchedCount === 0) {
            return Response.json(
                createApiError(ErrorCodes.STALL_NOT_FOUND, 'ไม่พบขนาดนี้'),
                { status: 404 }
            );
        }

        return Response.json(createApiResponse({ message: 'อัปเดตขนาดเรียบร้อยแล้ว' }));
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
                createApiError(ErrorCodes.INVALID_INPUT, 'ID ไม่ถูกต้อง'),
                { status: 400 }
            );
        }

        const db = await getDb();

        // Check if size is being used by any stalls
        const stallSize = await db.collection('stallSizes').findOne({ _id: new ObjectId(id) });
        if (stallSize) {
            const stallsUsingSize = await db.collection('stalls').countDocuments({ size: stallSize.name });
            if (stallsUsingSize > 0) {
                return Response.json(
                    createApiError(ErrorCodes.INVALID_INPUT, `ไม่สามารถลบได้ มีแผงตลาด ${stallsUsingSize} แผงที่ใช้ขนาดนี้อยู่`),
                    { status: 400 }
                );
            }
        }

        const result = await db.collection('stallSizes').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return Response.json(
                createApiError(ErrorCodes.STALL_NOT_FOUND, 'ไม่พบขนาดนี้'),
                { status: 404 }
            );
        }

        return Response.json(createApiResponse({ message: 'ลบขนาดเรียบร้อยแล้ว' }));
    } catch (error) {
        return handleApiError(error);
    }
}
