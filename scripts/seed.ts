import { getDb, createIndexes } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        const db = await getDb();

        // 1. Create indexes
        console.log('📊 Creating indexes...');
        await createIndexes();

        // 2. Clear existing data (development only)
        console.log('🗑️  Clearing existing data...');
        await db.collection('users').deleteMany({});
        await db.collection('stalls').deleteMany({});
        await db.collection('bookings').deleteMany({});
        await db.collection('payments').deleteMany({});

        // 3. Create admin user
        console.log('👤 Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.collection('users').insertOne({
            username: 'admin',
            email: 'admin@stalllock.com',
            password: hashedPassword,
            role: 'ADMIN',
            fullName: 'ผู้ดูแลระบบ',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 4. Create sample user
        console.log('👤 Creating sample user...');
        const userPassword = await bcrypt.hash('user123', 10);
        await db.collection('users').insertOne({
            username: 'user001',
            email: 'user@example.com',
            password: userPassword,
            role: 'USER',
            fullName: 'สมชาย ใจดี',
            phone: '0812345678',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 5. Create stalls
        console.log('🏪 Creating stalls...');
        const zones = ['A', 'B', 'C', 'D'];
        const stalls = [];

        for (const zone of zones) {
            for (let row = 1; row <= 5; row++) {
                for (let col = 1; col <= 5; col++) {
                    const stallNumber = String(row).padStart(2, '0') + String(col).padStart(2, '0');
                    stalls.push({
                        stallId: `${zone}-${stallNumber}`,
                        name: `ล็อคโซน ${zone} แถว ${row} ที่ ${col}`,
                        zone,
                        row,
                        column: col,
                        size: 3.0,
                        price: 5000,
                        status: 'AVAILABLE',
                        description: `ล็อคขนาด 3 ตารางเมตร โซน ${zone}`,
                        features: ['ไฟฟ้า', 'น้ำประปา'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
            }
        }

        await db.collection('stalls').insertMany(stalls);
        console.log(`✅ Created ${stalls.length} stalls`);

        console.log('🎉 Seeding completed successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Admin: admin / admin123');
        console.log('   User:  user001 / user123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
