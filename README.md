# Stall Lock Booking System

## Setup Instructions

### 1. Install Dependencies
```bash
npm install mongodb framer-motion react-circular-progressbar react-dropzone bootstrap bcryptjs jsonwebtoken tsx
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 2. Environment Variables
Your `.env.local` file should contain:
```env
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
UPLOAD_DIR=./public/uploads
NODE_ENV=development
```

### 3. Seed Database
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

## Login Credentials (After Seeding)
- **Admin:** admin / admin123
- **User:** user001 / user123

## API Endpoints
- `GET /api/stalls` - Get all stalls
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get bookings

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── stalls/route.ts
│   │   └── bookings/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
└── lib/
    ├── mongodb.ts
    ├── db.ts
    └── api.ts
```
