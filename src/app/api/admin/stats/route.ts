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

        // Calculate total revenue from confirmed bookings
        const totalRevenue = confirmedBookings.reduce((sum, booking) => {
            return sum + (booking.totalPrice || 0);
        }, 0);

        // Calculate monthly stats for the last 6 months
        const monthsLabel = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const monthlyStats = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mIndex = d.getMonth();
            const y = d.getFullYear();

            const monthBookings = bookings.filter(b => {
                const bDate = new Date(b.createdAt);
                return bDate.getMonth() === mIndex && bDate.getFullYear() === y;
            });

            // Calculate revenue for this month (only CONFIRMED bookings)
            const monthRevenue = monthBookings
                .filter(b => b.status === 'CONFIRMED')
                .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

            monthlyStats.push({
                month: monthsLabel[mIndex],
                total: monthBookings.length,
                confirmed: monthBookings.filter(b => b.status === 'CONFIRMED').length,
                revenue: monthRevenue
            });
        }

        const stats = {
            totalUsers,
            totalStalls,
            availableStalls,
            occupiedStalls: totalStalls - availableStalls,
            totalBookings,
            pendingBookings,
            confirmedBookings: confirmedCount,
            cancelledBookings,
            totalRevenue,
            monthlyStats
        };

        return Response.json(createApiResponse(stats));
    } catch (error) {
        return handleApiError(error);
    }
}
