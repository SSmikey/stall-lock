import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const db = await getDb();

        const totalStalls = await db.collection('stalls').countDocuments();
        const availableStalls = await db.collection('stalls').countDocuments({ status: 'AVAILABLE' });
        const pendingBookings = await db.collection('bookings').countDocuments({ status: 'AWAITING_APPROVAL' });
        const recentConfirmed = await db.collection('bookings').countDocuments({
            status: 'CONFIRMED',
            updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        return Response.json(createApiResponse({
            totalStalls,
            availableStalls,
            pendingBookings,
            recentConfirmed
        }));
    } catch (error) {
        return handleApiError(error);
    }
}
