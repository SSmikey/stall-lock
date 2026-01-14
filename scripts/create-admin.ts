// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local with absolute path
config({ path: resolve(process.cwd(), '.env.local') });

// Verify MongoDB URI is loaded
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    console.log('Current working directory:', process.cwd());
    process.exit(1);
}

// Now import other modules
import { MongoClient, ServerApiVersion } from 'mongodb';
import bcrypt from 'bcryptjs';

async function createAdmin() {
    let client: MongoClient | null = null;

    try {
        console.log('🔐 Creating admin user...');
        console.log('🔗 Connecting to MongoDB Atlas...');

        // Create MongoDB client
        const uri = process.env.MONGODB_URI!;
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        // Connect to MongoDB
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas!');

        const db = client.db('stalllock');
        const usersCollection = db.collection('users');

        // Check if admin user already exists
        const existingAdmin = await usersCollection.findOne({ username: 'admin' });

        if (existingAdmin) {
            console.log('\n⚠️  Admin user already exists!');
            console.log('   Username: admin');
            console.log('   Email:', existingAdmin.email);
            console.log('   Role:', existingAdmin.role);

            // Update password
            console.log('\n🔄 Updating admin password...');
            const hashedPassword = await bcrypt.hash('admin', 10);

            await usersCollection.updateOne(
                { username: 'admin' },
                {
                    $set: {
                        password: hashedPassword,
                        updatedAt: new Date()
                    }
                }
            );

            console.log('✅ Admin password updated successfully!');
        } else {
            // Create new admin user
            console.log('\n➕ Creating new admin user...');
            const hashedPassword = await bcrypt.hash('admin', 10);

            await usersCollection.insertOne({
                username: 'admin',
                email: 'admin@stalllock.com',
                password: hashedPassword,
                role: 'ADMIN',
                fullName: 'ผู้ดูแลระบบ',
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📝 Admin Login Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin');
        console.log('   Email: admin@stalllock.com');

        // Test MongoDB connection
        console.log('\n🔍 Testing MongoDB Atlas connection...');
        const stats = await db.stats();
        console.log('✅ Database Stats:');
        console.log('   Database:', db.databaseName);
        console.log('   Collections:', stats.collections);
        console.log('   Data Size:', (stats.dataSize / 1024).toFixed(2), 'KB');
        console.log('   Storage Size:', (stats.storageSize / 1024).toFixed(2), 'KB');

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('\n📂 Collections in database:');
        collections.forEach(col => {
            console.log('   -', col.name);
        });

        console.log('\n🎉 All done! You can now login with the admin credentials above!');

    } catch (error) {
        console.error('\n❌ Failed to create admin user:', error);
        if (error instanceof Error) {
            console.error('   Error message:', error.message);
        }
        process.exit(1);
    } finally {
        // Close MongoDB connection
        if (client) {
            await client.close();
            console.log('\n🔌 MongoDB connection closed.');
        }
        process.exit(0);
    }
}

createAdmin();
