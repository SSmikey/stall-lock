const { getDb } = require('../src/lib/db'); // Note: This might need adjustment if run outside Next.js context
const axios = require('axios');

// Since this is a specialized test, I'll assume the user runs it in a way that handles imports
// Or I'll write a standalone script using mongodb driver directly

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function runExpirationTest() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('stalllock');

        console.log('--- Setting up Expiration Test ---');

        // 1. Pick a stall to test
        const stall = await db.collection('stalls').findOne({ status: 'AVAILABLE' });
        if (!stall) throw new Error('No available stall found for test');

        console.log(`Using stall: ${stall.stallId}`);

        // 2. Create a booking that is ALREADY EXPIRED (1 minute ago)
        const pastDate = new Date(Date.now() - 60000);
        const expiredBooking = {
            bookingId: 'EXP-TEST-' + Date.now(),
            stallId: stall._id,
            userId: new ObjectId('65a3f2b4e4b0a1a2b3c4d5e6'),
            status: 'RESERVED',
            reservedAt: new Date(Date.now() - 3660000), // ~1 hour ago
            expiresAt: pastDate,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection('bookings').insertOne(expiredBooking);
        await db.collection('stalls').updateOne({ _id: stall._id }, { $set: { status: 'RESERVED' } });

        console.log('Expired booking created in DB. Stall status set to RESERVED.');

        // 3. Call the cleanup API
        console.log('Calling Cleanup API...');
        const res = await axios.post('http://localhost:3000/api/admin/system/cleanup');
        console.log('Cleanup API Response:', res.data);

        // 4. Verify results
        const updatedStall = await db.collection('stalls').findOne({ _id: stall._id });
        const updatedBooking = await db.collection('bookings').findOne({ _id: expiredBooking._id });

        console.log('--- Verification ---');
        console.log(`Stall Status: ${updatedStall.status} (Expected: AVAILABLE)`);
        console.log(`Booking Status: ${updatedBooking.status} (Expected: EXPIRED)`);

        if (updatedStall.status === 'AVAILABLE' && updatedBooking.status === 'EXPIRED') {
            console.log('✅ PASS: Expiration logic works correctly.');
        } else {
            console.error('❌ FAIL: Expiration logic failed!');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.close();
    }
}

runExpirationTest();
