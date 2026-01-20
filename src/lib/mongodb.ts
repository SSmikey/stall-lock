import { MongoClient, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Please add MONGODB_URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    // Connection Pool Settings
    maxPoolSize: 10,              // Maximum number of connections
    minPoolSize: 2,               // Minimum number of connections
    maxIdleTimeMS: 60000,         // Close connections after 1 minute of idle time

    // Timeout Settings
    connectTimeoutMS: 10000,      // 10 seconds to establish connection
    socketTimeoutMS: 45000,       // 45 seconds for socket operations
    serverSelectionTimeoutMS: 10000, // 10 seconds to select server

    // Retry Settings
    retryWrites: true,            // Retry write operations
    retryReads: true,             // Retry read operations

    // Compression
    compressors: ['zlib'] as ('zlib')[], // Enable compression for data transfer
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the connection
    let globalWithMongo = global as typeof globalThis & {
        _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, create a new client for each connection
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;
