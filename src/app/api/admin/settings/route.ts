import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        requireAdmin(request);
        const db = await getDb();
        const settings = await db.collection('settings').findOne({ key: 'market_config' });

        // Default settings if not found
        if (!settings) {
            return Response.json(createApiResponse({
                autoReturnTime: "22:00",
                isAutoReturnEnabled: false
            }));
        }

        return Response.json(createApiResponse(settings));
    } catch (error) {
        return handleApiError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        requireAdmin(request);
        const db = await getDb();
        const body = await request.json();
        const { autoReturnTime, isAutoReturnEnabled, maxBookingDays } = body;

        const result = await db.collection('settings').findOneAndUpdate(
            { key: 'market_config' },
            {
                $set: {
                    autoReturnTime,
                    isAutoReturnEnabled,
                    maxBookingDays: maxBookingDays || 7,
                    updatedAt: new Date()
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        return Response.json(createApiResponse(result));
    } catch (error) {
        return handleApiError(error);
    }
}
