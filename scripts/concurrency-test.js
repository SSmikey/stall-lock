const axios = require('axios');

async function runConcurrencyTest() {
    const API_URL = 'http://localhost:3000/api/bookings';
    const TEST_STALL_ID = '65a3f2b4e4b0a1a2b3c4d5e1'; // Replace with a real valid ID from your DB
    const USER_ID = '65a3f2b4e4b0a1a2b3c4d5e6';

    console.log(`Starting concurrency test: 100 requests for stall ${TEST_STALL_ID}...`);

    const requests = [];
    for (let i = 0; i < 100; i++) {
        requests.push(
            axios.post(API_URL, {
                stallId: TEST_STALL_ID,
                userId: USER_ID
            }).catch(err => err.response)
        );
    }

    const results = await Promise.all(requests);

    const successes = results.filter(r => r && r.status === 201);
    const conflicts = results.filter(r => r && r.status === 409);
    const errors = results.filter(r => r && r.status !== 201 && r.status !== 409);

    console.log('--- Test Results ---');
    console.log(`Successful Bookings: ${successes.length} (Expected: 1)`);
    console.log(`Conflict/Double Bookings Blocked: ${conflicts.length} (Expected: 99)`);
    console.log(`Other Errors: ${errors.length}`);

    if (successes.length === 1) {
        console.log('✅ PASS: Concurrency handled correctly.');
    } else {
        console.error('❌ FAIL: Potential double-booking detected!');
    }
}

runConcurrencyTest();
