import { getDb } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api';

export async function GET() {
    try {
        const db = await getDb();
        const zones = await db.collection('zones')
            .find({})
            .sort({ name: 1 })
            .toArray();

        return Response.json(createApiResponse(zones));
    } catch (error) {
        return handleApiError(error);
    }
}
