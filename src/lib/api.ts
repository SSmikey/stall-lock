export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export const ErrorCodes = {
    // Stall errors
    STALL_NOT_FOUND: 'STALL_NOT_FOUND',
    STALL_ALREADY_BOOKED: 'STALL_ALREADY_BOOKED',
    STALL_NOT_AVAILABLE: 'STALL_NOT_AVAILABLE',

    // Booking errors
    BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
    BOOKING_EXPIRED: 'BOOKING_EXPIRED',
    BOOKING_ALREADY_PROCESSED: 'BOOKING_ALREADY_PROCESSED',
    CANNOT_CANCEL_BOOKING: 'CANNOT_CANCEL_BOOKING',

    // Payment errors
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    PAYMENT_ALREADY_UPLOADED: 'PAYMENT_ALREADY_UPLOADED',

    // Auth errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    USERNAME_EXISTS: 'USERNAME_EXISTS',
    EMAIL_EXISTS: 'EMAIL_EXISTS',

    // General
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
} as const;

export const ErrorMessages: Record<string, string> = {
    [ErrorCodes.STALL_NOT_FOUND]: 'ไม่พบล็อคนี้',
    [ErrorCodes.STALL_ALREADY_BOOKED]: 'ล็อคนี้ถูกจองแล้ว',
    [ErrorCodes.STALL_NOT_AVAILABLE]: 'ล็อคนี้ไม่ว่าง',
    [ErrorCodes.BOOKING_NOT_FOUND]: 'ไม่พบการจองนี้',
    [ErrorCodes.BOOKING_EXPIRED]: 'การจองหมดอายุแล้ว',
    [ErrorCodes.BOOKING_ALREADY_PROCESSED]: 'การจองได้รับการดำเนินการแล้ว',
    [ErrorCodes.CANNOT_CANCEL_BOOKING]: 'ไม่สามารถยกเลิกการจองได้',
    [ErrorCodes.INVALID_FILE_TYPE]: 'ไฟล์ต้องเป็น jpg หรือ png เท่านั้น',
    [ErrorCodes.FILE_TOO_LARGE]: 'ไฟล์ใหญ่เกิน 5MB',
    [ErrorCodes.PAYMENT_ALREADY_UPLOADED]: 'อัพโหลดสลิปแล้ว',
    [ErrorCodes.UNAUTHORIZED]: 'ไม่มีสิทธิ์เข้าถึง',
    [ErrorCodes.FORBIDDEN]: 'ไม่อนุญาตให้เข้าถึง',
    [ErrorCodes.INVALID_CREDENTIALS]: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    [ErrorCodes.USERNAME_EXISTS]: 'ชื่อผู้ใช้นี้ถูกใช้แล้ว',
    [ErrorCodes.EMAIL_EXISTS]: 'อีเมลนี้ถูกใช้แล้ว',
    [ErrorCodes.INTERNAL_ERROR]: 'เกิดข้อผิดพลาด',
    [ErrorCodes.INVALID_INPUT]: 'ข้อมูลไม่ถูกต้อง',
};

export function createApiResponse<T>(data: T): ApiResponse<T> {
    return {
        success: true,
        data,
    };
}

export function createApiError(
    code: string,
    message?: string,
    details?: any
): ApiResponse {
    return {
        success: false,
        error: {
            code,
            message: message || ErrorMessages[code] || 'เกิดข้อผิดพลาด',
            details,
        },
    };
}

export function handleApiError(error: any): Response {
    console.error('API Error:', error);

    if (error.code && ErrorMessages[error.code]) {
        return Response.json(
            createApiError(error.code, error.message, error.details),
            { status: error.status || 500 }
        );
    }

    return Response.json(
        createApiError(ErrorCodes.INTERNAL_ERROR),
        { status: 500 }
    );
}
