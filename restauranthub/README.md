# RestaurantHub SaaS Platform

A comprehensive B2B/B2C SaaS platform for restaurants with multi-role support (Admin, Restaurant, Employee, Vendor) including hiring/verification, marketplace, job portal, community forum, messaging, analytics, and payment systems.

## 🏗️ Architecture

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Cache/Real-time**: Redis + Socket.io
- **File Storage**: AWS S3 (LocalStack for development)
- **Payment**: Razorpay integration
- **Authentication**: JWT with refresh tokens + RBAC
- **API Documentation**: Swagger/OpenAPI

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Development Setup

1. **Clone and install dependencies**
```bash
cd restauranthub
npm install
```

2. **Start infrastructure services**
```bash
npm run docker:up
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start development servers**
```bash
npm run dev
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/docs

## 📊 Database Schema

The platform uses a comprehensive PostgreSQL schema with 30+ models:

### Core Entities
- **Users**: Multi-role authentication (Admin, Restaurant, Employee, Vendor)
- **Restaurants**: Restaurant profiles with branches and verification
- **Vendors**: Vendor profiles with product catalog
- **Employees**: Employee management with Aadhaar verification
- **Products**: Marketplace products with categories and inventory
- **Orders**: Complete order management with payments
- **Jobs**: Job portal with applications and hiring workflow

### Features
- Role-based access control (RBAC)
- Document verification system
- Real-time messaging and notifications
- Analytics and reporting
- Credit system for restaurants
- Review and rating system

## 🔐 Authentication & Authorization

### Supported Roles
1. **ADMIN**: Platform administration and verification
2. **RESTAURANT**: Restaurant owners and managers
3. **EMPLOYEE**: Restaurant staff and job seekers
4. **VENDOR**: Product suppliers and service providers

### Security Features
- JWT access tokens (15min) + refresh tokens (7 days)
- Argon2 password hashing
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS enforcement
- CSRF protection

## 📱 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Reset password with token

### Restaurants
- `GET /restaurants` - List all restaurants
- `GET /restaurants/:id` - Get restaurant details
- `GET /restaurants/:id/dashboard` - Restaurant dashboard
- `POST /restaurants/:id/employees` - Add employee
- `GET /restaurants/:id/jobs` - List restaurant jobs

### Marketplace
- `GET /products` - Browse products
- `GET /products/:id` - Product details
- `POST /cart/items` - Add to cart
- `POST /orders` - Create order
- `GET /orders/:id` - Order details

### Jobs Portal
- `GET /jobs` - Search jobs
- `POST /jobs/:id/applications` - Apply for job
- `GET /employees/:id/applications` - My applications

## 🗺️ Screen-to-Endpoint Mapping

Complete documentation available in `/docs/SCREEN_TO_ENDPOINT_MAPPING.md` showing:
- Every screen mapped to API endpoints
- Data flow (input/output)
- Navigation paths (no dead-ends)
- Real-time event subscriptions

## 🔄 Real-time Features

### WebSocket Events
- `order:status` - Order status updates
- `message:new` - New messages
- `notification:new` - Push notifications
- `job:application` - Job application updates
- `payment:status` - Payment confirmations

### Caching Strategy
- User sessions: Redis
- Product catalog: 2 minutes
- Dashboard stats: 1 minute
- Static content: 1 hour

## 🧪 Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Deployment

### Docker Production Build
```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://user:pass@host:6379
JWT_SECRET=your-production-secret
AWS_ACCESS_KEY_ID=your-aws-key
RAZORPAY_KEY_ID=your-razorpay-key
```

## 📈 Performance Optimizations

- **Database**: Optimized indexes on frequently queried fields
- **Caching**: Redis for sessions, user data, and API responses
- **Pagination**: Cursor-based for real-time data, offset for static lists
- **Connection Pooling**: Prisma connection pooling
- **Rate Limiting**: Prevents API abuse
- **Image Optimization**: S3 with CloudFront CDN

## 🔍 Monitoring & Analytics

### Built-in Analytics
- Restaurant dashboard with revenue, orders, employee metrics
- Vendor analytics with product performance and sales
- Employee tracking with attendance and applications
- Admin reports with platform-wide statistics

### Logging
- Audit logs for all critical actions
- User activity tracking
- Performance monitoring hooks

## 🛡️ Security Measures

- **Authentication**: JWT with secure refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Class-validator with DTOs
- **SQL Injection**: Prisma ORM with parameterized queries  
- **XSS Protection**: Input sanitization and output encoding
- **HTTPS**: SSL/TLS encryption
- **Rate Limiting**: API endpoint protection
- **File Upload**: Virus scanning and type validation

## 📞 Support & Documentation

### API Documentation
- Interactive Swagger UI at `/docs`
- Comprehensive endpoint documentation
- Request/response examples
- Authentication examples

### Development Guidelines
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Conventional commits
- PR review requirements
- Test coverage requirements

## 🚧 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced search with Elasticsearch
- [ ] AI-powered recommendations
- [ ] Video calling integration
- [ ] Advanced reporting with exports
- [ ] Third-party integrations (accounting, POS)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Development Team

Built with ❤️ for the restaurant industry

For support, email: support@restauranthub.com