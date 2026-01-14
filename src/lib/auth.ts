import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface JWTPayload {
    userId: string;
    email: string;
    role: 'USER' | 'ADMIN';
    iat?: number;
    exp?: number;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

/**
 * Compare password with hashed password
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

/**
 * Get user from request token (from cookie)
 */
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
    try {
        const token = request.cookies.get('token')?.value;
        if (!token) return null;

        return verifyToken(token);
    } catch (error) {
        return null;
    }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(request: NextRequest): boolean {
    const user = getUserFromRequest(request);
    return user !== null;
}

/**
 * Check if user is admin
 */
export function isAdmin(request: NextRequest): boolean {
    const user = getUserFromRequest(request);
    return user !== null && user.role === 'ADMIN';
}

/**
 * Require authentication middleware helper
 */
export function requireAuth(request: NextRequest): JWTPayload {
    const user = getUserFromRequest(request);
    if (!user) {
        throw {
            code: 'UNAUTHORIZED',
            message: 'กรุณาเข้าสู่ระบบ',
            status: 401,
        };
    }
    return user;
}

/**
 * Require admin role middleware helper
 */
export function requireAdmin(request: NextRequest): JWTPayload {
    const user = requireAuth(request);
    if (user.role !== 'ADMIN') {
        throw {
            code: 'FORBIDDEN',
            message: 'คุณไม่มีสิทธิ์เข้าถึง',
            status: 403,
        };
    }
    return user;
}

/**
 * Create auth cookie options
 */
export function getAuthCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    };
}
