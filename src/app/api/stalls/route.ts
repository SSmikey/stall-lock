import { getDb, cleanupExpiredBookings } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await cleanupExpiredBookings();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const zone = searchParams.get('zone');

        const db = await getDb();
        const filter: any = {};

        if (status) {
            filter.status = status;
        }

        if (zone) {
            filter.zone = zone;
        }

        const stalls = await db
            .collection('stalls')
            .find(filter)
            .sort({ zone: 1, row: 1, column: 1 })
            .toArray();

        return Response.json(
            createApiResponse({
                stalls,
                total: stalls.length,
            })
        );
    } catch (error) {
        return handleApiError(error);
    }
}
