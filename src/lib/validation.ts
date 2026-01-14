import { z } from 'zod';

// ===== Auth Schemas =====

export const RegisterSchema = z.object({
    username: z.string()
        .min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร')
        .max(20, 'ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร')
        .regex(/^[a-zA-Z0-9_]+$/, 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือ _ เท่านั้น'),
    email: z.string()
        .email('รูปแบบอีเมลไม่ถูกต้อง'),
    password: z.string()
        .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
        .max(100, 'รหัสผ่านต้องไม่เกิน 100 ตัวอักษร'),
    fullName: z.string()
        .min(2, 'ชื่อ-นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร')
        .max(100, 'ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร'),
    phone: z.string()
        .regex(/^[0-9]{10}$/, 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก')
        .optional(),
});

export const LoginSchema = z.object({
    email: z.string()
        .email('รูปแบบอีเมลไม่ถูกต้อง'),
    password: z.string()
        .min(1, 'กรุณากรอกรหัสผ่าน'),
});

// ===== Booking Schemas =====

export const CreateBookingSchema = z.object({
    stallId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'รูปแบบ stallId ไม่ถูกต้อง'),
});

export const ApproveBookingSchema = z.object({
    bookingId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'รูปแบบ bookingId ไม่ถูกต้อง'),
});

export const RejectBookingSchema = z.object({
    bookingId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'รูปแบบ bookingId ไม่ถูกต้อง'),
    reason: z.string()
        .min(10, 'เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร')
        .max(500, 'เหตุผลต้องไม่เกิน 500 ตัวอักษร'),
});

// ===== Payment Schemas =====

export const PaymentUploadSchema = z.object({
    bookingId: z.string()
        .min(1, 'กรุณาระบุ bookingId'),
});

// ===== Query Params Schemas =====

export const StallQuerySchema = z.object({
    zone: z.enum(['A', 'B', 'C', 'D', 'ALL']).optional(),
    status: z.enum(['AVAILABLE', 'RESERVED', 'CONFIRMED', 'ALL']).optional(),
});

export const BookingQuerySchema = z.object({
    userId: z.string()
        .regex(/^[0-9a-fA-F]{24}$/, 'รูปแบบ userId ไม่ถูกต้อง')
        .optional(),
    status: z.enum(['RESERVED', 'AWAITING_APPROVAL', 'CONFIRMED', 'EXPIRED', 'CANCELLED', 'ALL']).optional(),
});

// ===== Type Exports =====

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type ApproveBookingInput = z.infer<typeof ApproveBookingSchema>;
export type RejectBookingInput = z.infer<typeof RejectBookingSchema>;
export type PaymentUploadInput = z.infer<typeof PaymentUploadSchema>;
export type StallQuery = z.infer<typeof StallQuerySchema>;
export type BookingQuery = z.infer<typeof BookingQuerySchema>;

// ===== Validation Helper =====

/**
 * Validate data with schema and throw error if invalid
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.errors[0];
            throw {
                code: 'INVALID_INPUT',
                message: firstError.message,
                details: error.errors,
                status: 400,
            };
        }
        throw error;
    }
}
