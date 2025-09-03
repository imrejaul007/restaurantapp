# RestaurantHub - Restaurant Industry SaaS Platform

A comprehensive SaaS platform for the restaurant industry providing employee management, vendor marketplace, job portal, and community features.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + NestJS + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **File Storage**: AWS S3
- **Payment**: Razorpay
- **Cloud**: AWS (ECS/EKS)
- **Monitoring**: CloudWatch

### Project Structure
```
restaurant-saas/
├── backend/                 # NestJS API server
├── frontend/               # Next.js web app
├── shared/                 # Shared types and utilities
├── database/              # Database migrations and seeds
├── docker/                # Docker configurations
└── docs/                  # API documentation
```

## 🚀 Quick Start

1. Clone the repository
2. Install dependencies: `npm run install:all`
3. Setup environment variables
4. Run database migrations: `npm run db:migrate`
5. Start development servers: `npm run dev`

## 📋 Features

### Core Modules
- **Restaurant Profile Management**
- **Employee Verification System**
- **Job Portal**
- **Vendor Marketplace**
- **Community Forum**
- **Fraud Prevention**
- **Analytics Dashboard**

### Security Features
- JWT Authentication
- Role-based Access Control
- Input Validation & Sanitization
- Encrypted Password Storage
- Aadhaar Integration (UIDAI API)
- Document Verification

## 📊 Database Schema

See `database/schema.sql` for complete database structure.

## 🔧 Development

### Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## 📝 API Documentation

API documentation is available at `/api/docs` when running the backend server.

## 🧪 Testing

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run test:cov    # Coverage report
```

## 🚀 Deployment

### Using Docker
```bash
docker-compose up --build
```

### AWS ECS
See `docker/aws-deployment.yml` for deployment configuration.

## 📄 License

MIT License