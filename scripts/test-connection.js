const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

async function test() {
    console.log('--- Testing MongoDB Connection ---');
    const envPath = path.resolve(process.cwd(), '.env.local');
    console.log('Loading .env.local from:', envPath);
    dotenv.config({ path: envPath });

    const uri = process.env.MONGODB_URI;
    console.log('MONGODB_URI is:', uri ? 'Defined (length: ' + uri.length + ')' : 'UNDEFINED');

    if (!uri) {
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        console.log('Connected successfully!');
        const db = client.db('stalllock');
        const ping = await db.command({ ping: 1 });
        console.log('Ping result:', ping);
    } catch (e) {
        console.error('Connection error:', e);
    } finally {
        await client.close();
        console.log('Connection closed.');
    }
}

test();
