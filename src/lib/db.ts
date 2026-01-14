import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface User {
    _id?: ObjectId;
    username: string;
    email: string;
    password: string;
    role: 'USER' | 'ADMIN';
    phone?: string;
    fullName: string;
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

// Database helper functions
export async function getDb() {
    const client = await clientPromise;
    return client.db('stalllock');
}

export async function createIndexes() {
    const db = await getDb();

    // Users indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    // Stalls indexes
    await db.collection('stalls').createIndex({ stallId: 1 }, { unique: true });
    await db.collection('stalls').createIndex({ status: 1 });
    await db.collection('stalls').createIndex({ zone: 1, row: 1, column: 1 });

    // Bookings indexes
    await db.collection('bookings').createIndex({ bookingId: 1 }, { unique: true });
    await db.collection('bookings').createIndex({ stallId: 1, status: 1 });
    await db.collection('bookings').createIndex({ userId: 1, status: 1 });
    await db.collection('bookings').createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0 }
    );

    // Payments indexes
    await db.collection('payments').createIndex({ bookingId: 1 }, { unique: true });

    console.log('✅ Indexes created successfully');
}
