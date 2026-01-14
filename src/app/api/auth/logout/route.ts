import { NextRequest } from 'next/server';
import { createApiResponse, handleApiError } from '@/lib/api';

export async function POST(request: NextRequest) {
    try {
        // Clear auth cookie
        const response = Response.json(
            createApiResponse({
                message: 'ออกจากระบบสำเร็จ',
            }),
            { status: 200 }
        );

        // Remove cookie by setting maxAge to 0
        response.headers.set(
            'Set-Cookie',
            'token=; path=/; httpOnly=true; maxAge=0'
        );

        return response;
    } catch (error) {
        return handleApiError(error);
    }
}
