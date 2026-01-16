import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface User {
    _id?: ObjectId;
    username: string;
    phone: string; // ใช้เป็นรหัส login (required และ unique) - USER ใช้เบอร์โทรเป็น "รหัสผ่าน"
    password?: string; // มีเฉพาะ ADMIN เท่านั้น
    role: 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
}

export interface Stall {
    _id?: ObjectId;
    stallId: string;
    name: string;
    zone: string;
    row: number;
    column: number;
    size: number;
    price: number;
    priceUnit: 'DAY' | 'MONTH';
    status: 'AVAILABLE' | 'RESERVED' | 'CONFIRMED';
    description?: string;
    features: string[];
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Booking {
    _id?: ObjectId;
    bookingId: string;
    stallId: ObjectId;
    userId: ObjectId;
    status: 'RESERVED' | 'AWAITING_PAYMENT' | 'AWAITING_APPROVAL' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
    reservedAt: Date;
    expiresAt: Date;
    paymentSlipUrl?: string;
    paymentUploadedAt?: Date;
    approvedBy?: ObjectId;
    approvedAt?: Date;
    rejectedReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Payment {
    _id?: ObjectId;
    bookingId: ObjectId;
    slipUrl: string;
    slipOriginalName: string;
    slipSize: number;
    slipMimeType: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    uploadedAt: Date;
    verifiedAt?: Date;
    verifiedBy?: ObjectId;
    rejectedReason?: string;
}

export interface Zone {
    _id?: ObjectId;
    name: string;
    description?: string;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface StallSize {
    _id?: ObjectId;
    name: string;
    label: string;
    dimensions?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SystemSettings {
    _id?: ObjectId;
    key: 'market_config';
    autoReturnTime: string; // e.g., "22:00"
    isAutoReturnEnabled: boolean;
    updatedAt: Date;
}

// Database helper functions
export async function getDb() {
    const client = await clientPromise;
    return client.db('stalllock');
}

/**
 * Clean up expired bookings and release stalls
 */
export async function cleanupExpiredBookings() {
    const client = await clientPromise;
    const db = client.db('stalllock');
    const now = new Date();

    // Find expired bookings that are still in RESERVED status
    const expiredBookings = await db.collection('bookings').find({
        status: 'RESERVED',
        expiresAt: { $lt: now }
    }).toArray();

    if (expiredBookings.length === 0) return;

    console.log(`[Cleanup] Found ${expiredBookings.length} expired bookings`);

    for (const booking of expiredBookings) {
        const session = client.startSession();
        try {
            await session.withTransaction(async () => {
                // 1. Update booking status to EXPIRED
                await db.collection('bookings').updateOne(
                    { _id: booking._id },
                    { $set: { status: 'EXPIRED', updatedAt: now } },
                    { session }
                );

                // 2. Update stall status to AVAILABLE
                await db.collection('stalls').updateOne(
                    { _id: booking.stallId },
                    { $set: { status: 'AVAILABLE', updatedAt: now } },
                    { session }
                );

                console.log(`[Cleanup] Released stall ${booking.stallId} from expired booking ${booking.bookingId}`);
            });
        } catch (error) {
            console.error(`[Cleanup] Failed to release booking ${booking.bookingId}:`, error);
        } finally {
            await session.endSession();
        }
    }
}

/**
 * Automatically return stalls to AVAILABLE status if market is closed
 */
export async function autoReturnStalls(force: boolean = false) {
    const client = await clientPromise;
    const db = client.db('stalllock');
    const now = new Date();

    // 1. Get settings
    const settings = await db.collection('settings').findOne({ key: 'market_config' });

    if (!force) {
        if (!settings || !settings.isAutoReturnEnabled || !settings.autoReturnTime) return;

        // Check time
        const [hours, minutes] = settings.autoReturnTime.split(':').map(Number);
        const marketCloseTime = new Date(now);
        marketCloseTime.setHours(hours, minutes, 0, 0);

        if (now < marketCloseTime) return;
    }

    // 2. Find confirmed bookings that should be released
    // For simplicity, we release ALL confirmed bookings when the market closes
    const activeBookings = await db.collection('bookings').find({
        status: 'CONFIRMED'
    }).toArray();

    if (activeBookings.length === 0) return;

    console.log(`[AutoReturn] Found ${activeBookings.length} confirmed bookings to return`);

    for (const booking of activeBookings) {
        const session = client.startSession();
        try {
            await session.withTransaction(async () => {
                // Update booking to COMPLETED (instead of EXPIRED for records)
                await db.collection('bookings').updateOne(
                    { _id: booking._id },
                    { $set: { status: 'COMPLETED', updatedAt: now } },
                    { session }
                );

                // Update stall to AVAILABLE
                await db.collection('stalls').updateOne(
                    { _id: booking.stallId },
                    { $set: { status: 'AVAILABLE', updatedAt: now } },
                    { session }
                );
            });
        } catch (error) {
            console.error(`[AutoReturn] Failed to return booking ${booking.bookingId}:`, error);
        } finally {
            await session.endSession();
        }
    }

    return activeBookings.length;
}

export async function createIndexes() {
    const db = await getDb();

    // Users indexes
    await db.collection('users').createIndex({ phone: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 });

    // Stalls indexes
    await db.collection('stalls').createIndex({ stallId: 1 }, { unique: true });
    await db.collection('stalls').createIndex({ status: 1 });
    await db.collection('stalls').createIndex({ zone: 1, row: 1, column: 1 });

    // Bookings indexes
    await db.collection('bookings').createIndex({ bookingId: 1 }, { unique: true });
    await db.collection('bookings').createIndex({ status: 1 });
    await db.collection('bookings').createIndex({ stallId: 1, status: 1 });
    await db.collection('bookings').createIndex({ userId: 1, status: 1 });
    await db.collection('bookings').createIndex({ status: 1, expiresAt: 1 }); // For cleanup query
    await db.collection('bookings').createIndex({ status: 1, createdAt: -1 }); // For admin dashboard sort

    // Payments indexes
    await db.collection('payments').createIndex({ bookingId: 1 }, { unique: true });
    await db.collection('payments').createIndex({ status: 1 });

    // Counters collection (for atomic ID generation)
    await db.collection('counters').createIndex({ _id: 1, year: 1 }, { unique: true });

    console.log('✅ Indexes created successfully');
}

// Re-export API utilities for convenience
export { createApiResponse, createApiError, handleApiError, ErrorCodes } from './api';
