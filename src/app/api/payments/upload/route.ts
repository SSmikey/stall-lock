import { getDb } from '@/lib/db';
import { createApiResponse, createApiError, handleApiError, ErrorCodes } from '@/lib/api';
import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('slip') as File;
        const bookingId = formData.get('bookingId') as string;

        if (!file || !bookingId) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_INPUT, 'กรุณาอัพโหลดไฟล์และระบุรหัสการจอง'),
                { status: 400 }
            );
        }

        // Validate file type
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            return Response.json(
                createApiError(ErrorCodes.INVALID_FILE_TYPE),
                { status: 400 }
            );
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return Response.json(
                createApiError(ErrorCodes.FILE_TOO_LARGE),
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db('stalllock');
        const session = client.startSession();

        try {
            let result: any;

            await session.withTransaction(async () => {
                // 1. Find booking
                const query: any = ObjectId.isValid(bookingId)
                    ? { _id: new ObjectId(bookingId) }
                    : { bookingId: bookingId };

                const booking = await db.collection('bookings').findOne(query, { session });

                if (!booking) {
                    throw { code: ErrorCodes.BOOKING_NOT_FOUND, status: 404 };
                }

                if (booking.status !== 'RESERVED') {
                    throw {
                        code: ErrorCodes.BOOKING_ALREADY_PROCESSED,
                        message: 'การจองนี้ได้รับการดำเนินการแล้ว หรือหมดอายุแล้ว',
                        status: 400
                    };
                }

                // 2. Save file
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const uploadDir = join(process.cwd(), 'public', 'uploads');

                // Ensure directory exists
                await mkdir(uploadDir, { recursive: true });

                const filePath = join(uploadDir, fileName);
                await writeFile(filePath, buffer);

                const slipUrl = `/uploads/${fileName}`;

                // 3. Create payment record
                await db.collection('payments').insertOne(
                    {
                        bookingId: booking._id,
                        slipUrl,
                        slipOriginalName: file.name,
                        slipSize: file.size,
                        slipMimeType: file.type,
                        status: 'PENDING',
                        uploadedAt: new Date(),
                    },
                    { session }
                );

                // 4. Update booking status
                await db.collection('bookings').updateOne(
                    { _id: booking._id },
                    {
                        $set: {
                            status: 'AWAITING_APPROVAL',
                            paymentSlipUrl: slipUrl,
                            paymentUploadedAt: new Date(),
                            updatedAt: new Date(),
                        }
                    },
                    { session }
                );

                result = {
                    bookingId: booking.bookingId,
                    status: 'AWAITING_APPROVAL',
                    slipUrl
                };
            });

            return Response.json(createApiResponse(result));
        } finally {
            await session.endSession();
        }
    } catch (error: any) {
        return handleApiError(error);
    }
}
