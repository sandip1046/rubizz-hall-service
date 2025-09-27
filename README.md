# Rubizz Hotel Inn - Hall Management Service

## 🏛️ Overview

The **Hall Management Service** is a microservice within the Rubizz Hotel Inn ecosystem that handles event hall bookings, cost calculations, resource management, and quotation generation. This service provides comprehensive functionality for managing event halls, processing bookings, generating quotations, and tracking payments.

## ✨ Features

### 🏢 Hall Management
- **Hall Registration**: Create and manage event halls with detailed specifications
- **Capacity Management**: Define hall capacity, area, and amenities
- **Pricing Configuration**: Set base rates, hourly rates, daily rates, and weekend rates
- **Availability Tracking**: Real-time availability management
- **Image Management**: Upload and manage hall images and floor plans

### 📅 Booking Management
- **Event Booking**: Create and manage hall bookings for various event types
- **Booking Lifecycle**: Track booking status from pending to completion
- **Guest Management**: Handle guest count and special requests
- **Payment Integration**: Process deposits and full payments
- **Cancellation Handling**: Manage booking cancellations with reasons

### 💰 Quotation System
- **Interactive Cost Calculator**: Dynamic pricing based on requirements
- **Line Item Management**: Detailed breakdown of costs (chairs, decoration, catering, etc.)
- **Quotation Generation**: Professional quotation documents
- **Validity Management**: Track quotation expiration and acceptance
- **Auto-Conversion**: Convert quotations to bookings

### 💳 Payment Processing
- **Multiple Payment Modes**: Cash, Card, UPI, Net Banking, Wallet, Cheque, Bank Transfer
- **Payment Types**: Deposit, Advance, Full Payment, Refund
- **Transaction Tracking**: Complete payment history and audit trail
- **Refund Management**: Handle refunds with reason tracking

### 📊 Analytics & Reporting
- **Booking Analytics**: Track booking patterns and revenue
- **Hall Utilization**: Monitor hall usage and performance
- **Financial Reports**: Generate income and expense reports
- **Customer Insights**: Analyze customer booking behavior

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and caching
- **Authentication**: JWT with role-based access control
- **Validation**: Joi for request validation
- **Logging**: Winston for structured logging
- **Rate Limiting**: Express Rate Limit with Redis store

### Service Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Hall Service   │────│   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              │
                       ┌─────────────────┐
                       │     Redis       │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+
- npm 8+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rubizz-hall-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # (Optional) Seed database
   npm run prisma:seed
   ```

5. **Start the service**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📋 API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with dependencies
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe
- `GET /metrics` - Service metrics

### Hall Management
- `GET /api/v1/halls` - List all halls
- `POST /api/v1/halls` - Create new hall
- `GET /api/v1/halls/:id` - Get hall details
- `PUT /api/v1/halls/:id` - Update hall
- `DELETE /api/v1/halls/:id` - Delete hall
- `GET /api/v1/halls/availability` - Check hall availability

### Booking Management
- `GET /api/v1/bookings` - List bookings
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings/:id` - Get booking details
- `PUT /api/v1/bookings/:id` - Update booking
- `DELETE /api/v1/bookings/:id` - Cancel booking
- `POST /api/v1/bookings/:id/confirm` - Confirm booking
- `POST /api/v1/bookings/:id/checkin` - Check-in
- `POST /api/v1/bookings/:id/checkout` - Check-out

### Quotation Management
- `GET /api/v1/quotations` - List quotations
- `POST /api/v1/quotations` - Create quotation
- `GET /api/v1/quotations/:id` - Get quotation details
- `PUT /api/v1/quotations/:id` - Update quotation
- `POST /api/v1/quotations/:id/accept` - Accept quotation
- `POST /api/v1/quotations/:id/reject` - Reject quotation
- `POST /api/v1/quotations/calculate` - Calculate cost

### Payment Management
- `GET /api/v1/payments` - List payments
- `POST /api/v1/payments` - Create payment
- `GET /api/v1/payments/:id` - Get payment details
- `POST /api/v1/payments/:id/refund` - Process refund

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Service port | 3007 | No |
| `NODE_ENV` | Environment | development | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 | No |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `API_GATEWAY_SECRET` | API Gateway secret | - | Yes |
| `SMTP_HOST` | Email SMTP host | smtp.gmail.com | No |
| `SMTP_USER` | Email username | - | No |
| `SMTP_PASS` | Email password | - | No |

### Business Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_HALL_RATE` | Default hall rental rate | 5000 |
| `CHAIR_RATE` | Per chair rate | 50 |
| `DECORATION_RATE` | Decoration package rate | 2000 |
| `CATERING_RATE_PER_PERSON` | Per person catering rate | 300 |
| `TAX_PERCENTAGE` | Tax percentage | 18 |
| `DEPOSIT_PERCENTAGE` | Deposit percentage | 20 |

## 🗄️ Database Schema

### Core Entities

#### Hall
- `id` - Unique identifier
- `name` - Hall name
- `description` - Hall description
- `capacity` - Maximum guest capacity
- `area` - Hall area in square feet
- `location` - Hall location
- `amenities` - Available amenities
- `baseRate` - Base rental rate
- `hourlyRate` - Hourly rate (optional)
- `dailyRate` - Daily rate (optional)
- `weekendRate` - Weekend surcharge (optional)
- `isActive` - Hall status
- `isAvailable` - Availability status

#### HallBooking
- `id` - Unique identifier
- `hallId` - Reference to hall
- `customerId` - Reference to customer
- `eventName` - Event name
- `eventType` - Type of event
- `startDate` - Event start date
- `endDate` - Event end date
- `startTime` - Event start time
- `endTime` - Event end time
- `guestCount` - Number of guests
- `totalAmount` - Total booking amount
- `status` - Booking status
- `paymentStatus` - Payment status

#### HallQuotation
- `id` - Unique identifier
- `hallId` - Reference to hall
- `customerId` - Reference to customer
- `quotationNumber` - Unique quotation number
- `eventName` - Event name
- `eventType` - Type of event
- `eventDate` - Event date
- `totalAmount` - Total quotation amount
- `validUntil` - Quotation validity
- `status` - Quotation status

#### HallLineItem
- `id` - Unique identifier
- `hallId` - Reference to hall
- `quotationId` - Reference to quotation (optional)
- `bookingId` - Reference to booking (optional)
- `itemType` - Type of line item
- `itemName` - Item name
- `quantity` - Item quantity
- `unitPrice` - Unit price
- `totalPrice` - Total price

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full access to all operations
- **Manager**: Hall and booking management
- **Staff**: Booking operations and customer service
- **Customer**: Booking and quotation access

### Permissions
- `hall:create` - Create halls
- `hall:read` - View halls
- `hall:update` - Update halls
- `hall:delete` - Delete halls
- `booking:create` - Create bookings
- `booking:read` - View bookings
- `booking:update` - Update bookings
- `booking:cancel` - Cancel bookings
- `quotation:create` - Create quotations
- `quotation:read` - View quotations
- `quotation:update` - Update quotations
- `payment:create` - Process payments
- `payment:refund` - Process refunds

## 📊 Monitoring & Logging

### Health Checks
- **Basic Health**: `/health` - Service status
- **Detailed Health**: `/health/detailed` - Dependencies status
- **Readiness**: `/health/ready` - Kubernetes readiness
- **Liveness**: `/health/live` - Kubernetes liveness
- **Metrics**: `/metrics` - Service metrics

### Logging
- **Structured Logging**: JSON format with Winston
- **Log Levels**: error, warn, info, debug
- **Log Files**: Rotating log files with size limits
- **Request Logging**: HTTP request/response logging
- **Error Tracking**: Comprehensive error logging

### Metrics
- **Performance**: Response times, throughput
- **Business**: Booking counts, revenue, hall utilization
- **System**: Memory usage, CPU usage, database connections
- **Errors**: Error rates, failure counts

## 🚀 Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3007
CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hall-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hall-service
  template:
    metadata:
      labels:
        app: hall-service
    spec:
      containers:
      - name: hall-service
        image: rubizz/hall-service:latest
        ports:
        - containerPort: 3007
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: hall-service-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: hall-service-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3007
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3007
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

## 📈 Performance

### Optimization Features
- **Database Indexing**: Optimized queries with proper indexes
- **Redis Caching**: Frequently accessed data caching
- **Connection Pooling**: Database connection optimization
- **Compression**: Response compression
- **Rate Limiting**: API rate limiting
- **Pagination**: Large dataset pagination

### Performance Metrics
- **Response Time**: < 200ms for 95% of requests
- **Throughput**: 1000+ requests per second
- **Availability**: 99.9% uptime
- **Error Rate**: < 0.1%

## 🔧 Development

### Code Structure
```
src/
├── config/         # Configuration management
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # Data models
├── services/       # Business logic
├── types/          # TypeScript types
├── utils/          # Utility functions
├── database/       # Database connections
└── index.ts        # Application entry point
```

### Coding Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Conventional Commits**: Commit message format

### Git Workflow
1. Create feature branch
2. Implement changes
3. Write tests
4. Run linting and tests
5. Create pull request
6. Code review
7. Merge to main

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: [API Docs](https://docs.rubizzhotel.com/hall-service)
- **Issues**: [GitHub Issues](https://github.com/rubizzhotel/hall-service/issues)
- **Email**: support@rubizzhotel.com
- **Slack**: #hall-service-support

## 🔄 Changelog

### v1.0.0 (2024-01-01)
- Initial release
- Hall management functionality
- Booking system
- Quotation generation
- Payment processing
- Basic analytics

---

**Built with ❤️ by the Rubizz Hotel Inn Development Team**
