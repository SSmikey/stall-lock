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
