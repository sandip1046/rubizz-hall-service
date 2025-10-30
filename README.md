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
- **Database**: MongoDB with Mongoose ODM
- **API Protocols**: REST + GraphQL (/graphql)
- **Internal RPC**: gRPC (default on GRPC_PORT)
- **Realtime**: WebSocket (/ws)
- **Events**: Kafka (hall.booking, hall.quotation topics)
- **Cache**: Redis service via axios (`REDIS_SERVICE_URL`)
- **Email**: Nodemailer with SMTP and Brevo support
- **Authentication**: JWT with role-based access control
- **Validation**: Joi for request validation
- **Logging**: Winston for structured logging
- **Rate Limiting**: Express Rate Limit with Redis store

### Service Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Hall Service   │────│    MongoDB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              │
                    ┌─────────────────────────┐
                    │    Redis Cluster        │
                    │  ┌─────┐ ┌─────┐ ┌─────┐│
                    │  │Session│ │Cache│ │Queue││
                    │  └─────┘ └─────┘ └─────┘│
                    └─────────────────────────┘
                              │
                    ┌─────────────────────────┐
                    │    Email Services       │
                    │  ┌─────┐ ┌─────┐        │
                    │  │ SMTP│ │Brevo│        │
                    │  └─────┘ └─────┘        │
                    └─────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- Redis 6+ (Multiple instances recommended)
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

4. **Environment**
   - Ensure `.env` contains at least:
     - `DATABASE_URL` (MongoDB connection)
     - `REDIS_SERVICE_URL` (e.g., https://rubizz-redis-service.onrender.com/api/v1/redis)
     - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `API_GATEWAY_SECRET`
     - `PORT` (HTTP), `GRPC_PORT` (gRPC)
     - `KAFKA_BROKERS` (e.g., localhost:9092), `KAFKA_CLIENT_ID`, `KAFKA_GROUP_ID`

5. **Test Configuration**
   ```bash
   # Test the configuration
   npm run build
   node test-config.js
   ```

6. **Start the service**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## Protocol Endpoints

- **REST**: under `/api/v1/*` (existing controllers unchanged)
- **GraphQL**: `POST /graphql`
  - Query example:
    ```graphql
    query { halls(pagination: { page: 1, limit: 10 }) { data { id name } pagination { total } } }
    ```
- **WebSocket**: `ws://<host>/ws`
  - Receives JSON events like `booking.created`, `quotation.accepted`, etc.
- **gRPC**: binds on `0.0.0.0:GRPC_PORT` using `src/grpc/proto/hall.proto`
- **Kafka**:
  - Produces to `hall.booking` and `hall.quotation`
  - Consumer subscribes to both topics (logs inbound events)

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

#### Server Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Service port | 3007 | No |
| `NODE_ENV` | Environment | development | No |
| `SERVICE_NAME` | Service name | rubizz-hall-service | No |
| `SERVICE_VERSION` | Service version | 1.0.0 | No |

#### Database Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | MongoDB connection string | - | Yes |

#### Redis Configuration (Multiple Instances)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_SESSION_URL` | Session Redis URL | - | Yes |
| `REDIS_SESSION_HOST` | Session Redis host | - | Yes |
| `REDIS_SESSION_PORT` | Session Redis port | 6379 | No |
| `REDIS_SESSION_PASSWORD` | Session Redis password | - | Yes |
| `REDIS_SESSION_TLS` | Session Redis TLS | true | No |
| `REDIS_CACHE_URL` | Cache Redis URL | - | Yes |
| `REDIS_CACHE_HOST` | Cache Redis host | - | Yes |
| `REDIS_CACHE_PORT` | Cache Redis port | 6379 | No |
| `REDIS_CACHE_PASSWORD` | Cache Redis password | - | Yes |
| `REDIS_CACHE_TLS` | Cache Redis TLS | true | No |
| `REDIS_QUEUE_URL` | Queue Redis URL | - | Yes |
| `REDIS_QUEUE_HOST` | Queue Redis host | - | Yes |
| `REDIS_QUEUE_PORT` | Queue Redis port | 6379 | No |
| `REDIS_QUEUE_PASSWORD` | Queue Redis password | - | Yes |
| `REDIS_QUEUE_TLS` | Queue Redis TLS | true | No |

#### Email Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SMTP_HOST` | SMTP host | smtp.gmail.com | No |
| `SMTP_PORT` | SMTP port | 587 | No |
| `SMTP_USER` | SMTP username | - | No |
| `SMTP_PASS` | SMTP password | - | No |
| `BREVO_SMTP_HOST` | Brevo SMTP host | smtp-relay.brevo.com | No |
| `BREVO_SMTP_PORT` | Brevo SMTP port | 587 | No |
| `BREVO_SMTP_USER` | Brevo SMTP username | - | No |
| `BREVO_SMTP_PASS` | Brevo SMTP password | - | No |
| `FROM_EMAIL` | From email address | noreply@rubizzhotel.com | No |
| `FROM_NAME` | From name | Rubizz Hotel Inn | No |

#### Security Configuration
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES_IN` | JWT expiration | 24h | No |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - | Yes |
| `JWT_REFRESH_EXPIRES_IN` | JWT refresh expiration | 7d | No |
| `API_GATEWAY_SECRET` | API Gateway secret | - | Yes |

### Business Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_HALL_RATE` | Default hall rental rate | 5000 |
| `CHAIR_RATE` | Per chair rate | 50 |
| `DECORATION_RATE` | Decoration package rate | 2000 |
| `CATERING_RATE_PER_PERSON` | Per person catering rate | 300 |
| `TAX_PERCENTAGE` | Tax percentage | 18 |
| `DEPOSIT_PERCENTAGE` | Deposit percentage | 20 |

## 🗄️ Database Schema (MongoDB with Mongoose)

### Core Models

#### Hall Model
```prisma
model Hall {
  id          String   @id @default(cuid()) @map("_id")
  name        String
  description String?
  capacity    Int
  area        Float
  location    String
  amenities   String[]
  
  // Pricing
  baseRate    Float
  hourlyRate  Float?
  dailyRate   Float?
  weekendRate Float?
  
  // Status
  isActive    Boolean  @default(true)
  isAvailable Boolean  @default(true)
  
  // Images
  images      String[]
  floorPlan   String?
  
  // Relations
  bookings    HallBooking[]
  quotations  HallQuotation[]
  lineItems   HallLineItem[]
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("halls")
}
```

#### HallBooking Model
```prisma
model HallBooking {
  id              String   @id @default(cuid()) @map("_id")
  hallId          String
  hall            Hall     @relation(fields: [hallId], references: [id])
  
  // Customer Info
  customerId      String
  customerName    String
  customerEmail   String
  customerPhone   String
  
  // Event Details
  eventName       String
  eventType       EventType
  startDate       DateTime
  endDate         DateTime
  startTime       String
  endTime         String
  guestCount      Int
  
  // Pricing
  totalAmount     Float
  depositAmount   Float?
  balanceAmount   Float?
  
  // Status
  status          BookingStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  
  // Special Requests
  specialRequests String?
  
  // Relations
  lineItems       HallLineItem[]
  payments        HallPayment[]
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("hall_bookings")
}
```

#### HallQuotation Model
```prisma
model HallQuotation {
  id              String   @id @default(cuid()) @map("_id")
  hallId          String
  hall            Hall     @relation(fields: [hallId], references: [id])
  
  // Customer Info
  customerId      String
  customerName    String
  customerEmail   String
  customerPhone   String
  
  // Event Details
  eventName       String
  eventType       EventType
  eventDate       DateTime
  guestCount      Int
  
  // Quotation Details
  quotationNumber String   @unique
  totalAmount     Float
  validUntil      DateTime
  
  // Status
  status          QuotationStatus @default(DRAFT)
  
  // Relations
  lineItems       HallLineItem[]
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("hall_quotations")
}
```

#### HallLineItem Model
```prisma
model HallLineItem {
  id              String   @id @default(cuid()) @map("_id")
  hallId          String
  hall            Hall     @relation(fields: [hallId], references: [id])
  
  // Optional Relations
  bookingId       String?
  booking         HallBooking? @relation(fields: [bookingId], references: [id])
  quotationId     String?
  quotation       HallQuotation? @relation(fields: [quotationId], references: [id])
  
  // Item Details
  itemType        LineItemType
  itemName        String
  description     String?
  quantity        Int
  unitPrice       Float
  totalPrice      Float
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("hall_line_items")
}
```

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
- **Detailed Health**: `/health/detailed` - Dependencies status (MongoDB, Redis instances)
- **Readiness**: `/health/ready` - Kubernetes readiness
- **Liveness**: `/health/live` - Kubernetes liveness
- **Metrics**: `/metrics` - Service metrics

### Redis Health Monitoring
- **Session Redis**: Monitors session management Redis instance
- **Cache Redis**: Monitors caching Redis instance  
- **Queue Redis**: Monitors message queue Redis instance
- **Connection Status**: Tracks connection state for all Redis instances

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
        - name: REDIS_SERVICE_URL
          valueFrom:
            secretKeyRef:
              name: hall-service-secrets
              key: redis-service-url
        - name: GRPC_PORT
          value: "50051"
        - name: KAFKA_BROKERS
          value: "kafka:9092"
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
- **Database Indexing**: Optimized MongoDB queries with proper indexes
- **Multi-Redis Caching**: Session, cache, and queue Redis instances for optimal performance
- **Connection Pooling**: MongoDB connection optimization with Mongoose
- **ioredis Performance**: Enhanced Redis client with better performance
- **Compression**: Response compression
- **Rate Limiting**: API rate limiting with Redis store
- **Pagination**: Large dataset pagination
- **Email Optimization**: Dual email provider support for reliability

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
├── models/         # Mongoose models and schemas
├── services/       # Business logic (including EmailService)
├── types/          # TypeScript types
├── utils/          # Utility functions
├── database/       # Database connections (Prisma, Redis)
└── index.ts        # Application entry point

prisma/
├── schema.prisma   # Database schema
└── seed.ts         # Database seeding
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

## 🔧 Troubleshooting

### Common Issues

#### Configuration Errors
```bash
# Test your configuration
npm run build
node test-config.js
```

#### Redis Connection Issues
- Ensure all three Redis instances are accessible
- Check TLS configuration for Upstash Redis
- Verify credentials and connection strings

#### MongoDB Connection Issues
- Ensure MongoDB is running and accessible
- Check connection string format
- Verify network connectivity

#### Email Service Issues
- Test both SMTP and Brevo connections
- Verify email credentials
- Check firewall settings for SMTP ports

### Debug Commands
```bash
# Check service health
curl http://localhost:3007/health/detailed

# Test configuration
node test-config.js

# View logs
tail -f logs/hall-service.log
```

## 🆘 Support

For support and questions:
- **Documentation**: [API Docs](https://docs.rubizzhotel.com/hall-service)
- **Issues**: [GitHub Issues](https://github.com/rubizzhotel/hall-service/issues)
- **Email**: support@rubizzhotel.com
- **Slack**: #hall-service-support

## 🔄 Changelog

### v1.3.0 (2025-10-30)
- **NEW**: GraphQL endpoint at `/graphql` with schema/resolvers
- **NEW**: gRPC server and proto at `src/grpc/proto/hall.proto`
- **NEW**: WebSocket realtime at `/ws` broadcasting booking/quotation events
- **NEW**: Kafka producers/consumers for `hall.booking` and `hall.quotation`

### v1.2.0 (2025-10-30)
- **BREAKING CHANGES**: Migrated from Prisma to Mongoose for MongoDB
- **NEW**: Introduced Mongoose models for Halls, Bookings, Quotations, Line Items, Payments, Availability
- **IMPROVED**: Simplified setup (no Prisma generate/push)
- **IMPROVED**: Performance and flexibility for document operations

### v1.1.0 (2024-01-08)
- Updated Redis configuration to support multiple instances
- Added EmailService with dual provider support (SMTP + Brevo)
- Enhanced Redis connection with ioredis for better performance

### v1.0.0 (2024-01-01)
- Initial release
- Hall management functionality
- Booking system
- Quotation generation
- Payment processing
- Basic analytics

---

**Built with ❤️ by the Rubizz Hotel Inn Development Team**
