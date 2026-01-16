import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';
import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        requireAdmin(request);

        const db = await getDb();

        // Get all counts in parallel
        const [
            totalUsers,
            totalStalls,
            availableStalls,
            bookings,
            confirmedBookings
        ] = await Promise.all([
            db.collection('users').countDocuments(),
            db.collection('stalls').countDocuments(),
            db.collection('stalls').countDocuments({ status: 'AVAILABLE' }),
            db.collection('bookings').find({}).toArray(),
            db.collection('bookings').find({ status: 'CONFIRMED' }).toArray()
        ]);

        // Calculate booking stats
        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(b => b.status === 'AWAITING_APPROVAL').length;
        const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;
        const cancelledBookings = bookings.filter(b =>
            b.status === 'CANCELLED' || b.status === 'EXPIRED'
        ).length;

        // Get stall prices for confirmed bookings to calculate revenue
        const confirmedStallIds = confirmedBookings.map(b => b.stallId);
        const stalls = await db.collection('stalls').find({
            _id: { $in: confirmedStallIds }
        }).toArray();

        // Calculate total revenue from confirmed bookings
        const stallPriceMap = new Map(stalls.map(s => [s._id.toString(), s.price || 0]));
        const totalRevenue = confirmedBookings.reduce((sum, booking) => {
            const stallPrice = stallPriceMap.get(booking.stallId?.toString()) || 0;
            return sum + stallPrice;
        }, 0);

        const stats = {
            totalUsers,
            totalStalls,
            availableStalls,
            occupiedStalls: totalStalls - availableStalls,
            totalBookings,
            pendingBookings,
            confirmedBookings: confirmedCount,
            cancelledBookings,
            totalRevenue
        };

        return Response.json(createApiResponse(stats));
    } catch (error) {
        return handleApiError(error);
    }
}
