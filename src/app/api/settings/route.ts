import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const db = await getDb();
        const settings = await db.collection('settings').findOne({ key: 'market_config' });

        // Return only safe public settings
        return Response.json(createApiResponse({
            maxBookingDays: settings?.maxBookingDays || 7,
            // Add other public settings here if needed
        }));
    } catch (error) {
        return handleApiError(error);
    }
}
