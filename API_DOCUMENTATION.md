# Rubizz Hall Service - API Documentation

**Service**: rubizz-hall-service  
**Port**: 3010  
**Version**: 1.0.0  
**Base URL**: `http://localhost:3010` (Development) | `https://rubizz-hall-service.onrender.com` (Production)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Health Checks](#health-checks)
3. [REST API Endpoints](#rest-api-endpoints)
4. [GraphQL API](#graphql-api)
5. [gRPC API](#grpc-api)
6. [WebSocket API](#websocket-api)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## 🎯 Overview

The Hall Service manages event halls, hall bookings, and quotations for the Rubizz Hotel Inn platform. It provides:

- **Hall Management**: Create, manage, and track event halls
- **Booking Management**: Create, update, confirm, and manage hall bookings
- **Quotation Management**: Create, send, accept, and manage quotations
- **Availability Checking**: Real-time hall availability for date ranges
- **Statistics**: Hall and booking statistics and analytics

### Supported Protocols

- ✅ **REST API**: HTTP/HTTPS requests
- ✅ **GraphQL**: GraphQL queries and mutations
- ✅ **gRPC**: Internal service-to-service communication
- ✅ **WebSocket**: Real-time subscriptions and updates
- ✅ **Kafka**: Event publishing and consumption

### Event Types

- `WEDDING` - Wedding ceremonies and receptions
- `CORPORATE` - Corporate events and meetings
- `BIRTHDAY` - Birthday parties
- `CONFERENCE` - Conferences and seminars
- `EXHIBITION` - Exhibitions and trade shows
- `OTHER` - Other events

### Booking Statuses

- `PENDING` - Booking request submitted
- `CONFIRMED` - Booking confirmed
- `CANCELLED` - Booking cancelled
- `COMPLETED` - Event completed
- `CHECKED_IN` - Event checked in
- `CHECKED_OUT` - Event checked out

### Quotation Statuses

- `DRAFT` - Quotation draft
- `SENT` - Quotation sent to customer
- `ACCEPTED` - Quotation accepted by customer
- `REJECTED` - Quotation rejected by customer
- `EXPIRED` - Quotation expired
- `CONVERTED` - Quotation converted to booking

---

## 🏥 Health Checks

### Check Service Health

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T10:30:00Z",
  "service": "rubizz-hall-service",
  "version": "1.0.0",
  "uptime": 3600
}
```

### Detailed Health Check

```http
GET /health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "kafka": "connected",
  "timestamp": "2025-11-11T10:30:00Z"
}
```

### Check Readiness

```http
GET /health/ready
```

### Check Liveness

```http
GET /health/live
```

### Get Metrics

```http
GET /metrics
```

---

## 📡 REST API Endpoints

### Hall Management Endpoints

#### Create Hall

Create a new event hall. **Admin only**.

```http
POST /api/v1/halls
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Grand Ballroom",
  "description": "Spacious ballroom perfect for weddings and corporate events",
  "capacity": 500,
  "location": "Main Building, 2nd Floor",
  "amenities": ["sound-system", "projector", "stage", "lighting"],
  "pricing": {
    "baseRate": 50000,
    "hourlyRate": 5000,
    "minimumHours": 4
  },
  "images": ["https://example.com/hall1.jpg"],
  "eventTypes": ["WEDDING", "CORPORATE", "CONFERENCE"],
  "isActive": true
}
```

**Field Validation:**
- `name`: Required, string (1-200 characters)
- `description`: Optional, string (max 1000 characters)
- `capacity`: Required, integer (min 1)
- `location`: Required, string
- `amenities`: Optional, array of strings
- `pricing`: Required, pricing object
  - `baseRate`: Required, number (base price)
  - `hourlyRate`: Optional, number (hourly rate)
  - `minimumHours`: Optional, integer (minimum booking hours)
- `images`: Optional, array of image URLs
- `eventTypes`: Optional, array of event types
- `isActive`: Optional, boolean (default: true)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Hall created successfully",
  "data": {
    "id": "hall123",
    "name": "Grand Ballroom",
    "description": "Spacious ballroom perfect for weddings and corporate events",
    "capacity": 500,
    "location": "Main Building, 2nd Floor",
    "amenities": ["sound-system", "projector", "stage", "lighting"],
    "pricing": {
      "baseRate": 50000,
      "hourlyRate": 5000,
      "minimumHours": 4
    },
    "images": ["https://example.com/hall1.jpg"],
    "eventTypes": ["WEDDING", "CORPORATE", "CONFERENCE"],
    "isActive": true,
    "createdAt": "2025-11-11T10:30:00Z"
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN or SUPER_ADMIN role

---

#### Get Halls

Get list of halls with filters and pagination.

```http
GET /api/v1/halls?page=1&limit=10&capacity=500&eventType=WEDDING&isActive=true
```

**Query Parameters:**
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10, max: 100)
- `location`: Optional, filter by location
- `capacity`: Optional, filter by exact capacity
- `minCapacity`: Optional, filter by minimum capacity
- `maxCapacity`: Optional, filter by maximum capacity
- `eventType`: Optional, filter by event type
- `date`: Optional, filter by availability date (YYYY-MM-DD)
- `startTime`: Optional, filter by start time (HH:mm)
- `endTime`: Optional, filter by end time (HH:mm)
- `amenities`: Optional, comma-separated amenities
- `minRate`: Optional, filter by minimum rate
- `maxRate`: Optional, filter by maximum rate
- `isActive`: Optional, filter by active status
- `isAvailable`: Optional, filter by availability
- `sortBy`: Optional, field to sort by (default: "createdAt")
- `sortOrder`: Optional, "asc" or "desc" (default: "desc")

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Halls retrieved successfully",
  "data": [
    {
      "id": "hall123",
      "name": "Grand Ballroom",
      "capacity": 500,
      "location": "Main Building, 2nd Floor",
      "pricing": {
        "baseRate": 50000,
        "hourlyRate": 5000
      },
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Optional (public access for browsing)

---

#### Get Hall by ID

Get hall details by ID.

```http
GET /api/v1/halls/:id
```

**Path Parameters:**
- `id`: Hall ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Hall retrieved successfully",
  "data": {
    "id": "hall123",
    "name": "Grand Ballroom",
    "description": "Spacious ballroom perfect for weddings and corporate events",
    "capacity": 500,
    "location": "Main Building, 2nd Floor",
    "amenities": [
      {
        "id": "sound-system",
        "name": "Sound System",
        "included": true
      },
      {
        "id": "projector",
        "name": "Projector",
        "included": true
      }
    ],
    "pricing": {
      "baseRate": 50000,
      "hourlyRate": 5000,
      "minimumHours": 4
    },
    "images": ["https://example.com/hall1.jpg"],
    "eventTypes": ["WEDDING", "CORPORATE", "CONFERENCE"],
    "isActive": true,
    "createdAt": "2025-11-11T10:30:00Z",
    "updatedAt": "2025-11-11T10:30:00Z"
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Optional (public access)

---

#### Search Halls

Search halls by name, description, or location.

```http
GET /api/v1/halls/search?q=ballroom&page=1&limit=10
```

**Query Parameters:**
- `q`: Required, search query
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10)
- `sortBy`: Optional, field to sort by
- `sortOrder`: Optional, "asc" or "desc"

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Halls searched successfully",
  "data": [
    {
      "id": "hall123",
      "name": "Grand Ballroom",
      "capacity": 500,
      "location": "Main Building, 2nd Floor"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Optional (public access)

---

#### Check Hall Availability

Check if a hall is available for a specific date and time.

```http
GET /api/v1/halls/:id/availability?date=2025-12-01&startTime=10:00&endTime=18:00
```

**Path Parameters:**
- `id`: Hall ID

**Query Parameters:**
- `date`: Required, date (YYYY-MM-DD)
- `startTime`: Required, start time (HH:mm)
- `endTime`: Required, end time (HH:mm)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Availability checked successfully",
  "data": {
    "hallId": "hall123",
    "date": "2025-12-01",
    "startTime": "10:00",
    "endTime": "18:00",
    "isAvailable": true,
    "conflictingBookings": []
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Optional (public access)

---

#### Get Hall with Relations

Get hall details with related bookings and quotations. **Admin/Manager only**.

```http
GET /api/v1/halls/:id/relations
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Hall ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Hall with relations retrieved successfully",
  "data": {
    "id": "hall123",
    "name": "Grand Ballroom",
    "bookings": [
      {
        "id": "booking123",
        "eventDate": "2025-12-01",
        "status": "CONFIRMED"
      }
    ],
    "quotations": [
      {
        "id": "quotation123",
        "status": "SENT"
      }
    ]
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

#### Update Hall

Update hall information. **Admin only**.

```http
PUT /api/v1/halls/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: Hall ID

**Request Body:**
```json
{
  "name": "Grand Ballroom - Updated",
  "capacity": 600,
  "pricing": {
    "baseRate": 55000,
    "hourlyRate": 5500
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Hall updated successfully",
  "data": {
    "id": "hall123",
    "name": "Grand Ballroom - Updated",
    "capacity": 600,
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN or SUPER_ADMIN role

---

#### Delete Hall

Delete a hall. **Admin only**.

```http
DELETE /api/v1/halls/:id
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Hall ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Hall deleted successfully",
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN or SUPER_ADMIN role

---

#### Get Hall Statistics

Get hall statistics and analytics. **Admin/Manager only**.

```http
GET /api/v1/halls/:id/statistics
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Hall ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Hall statistics retrieved successfully",
  "data": {
    "hallId": "hall123",
    "totalBookings": 50,
    "confirmedBookings": 40,
    "cancelledBookings": 5,
    "completedBookings": 35,
    "totalRevenue": 2000000,
    "averageBookingValue": 50000,
    "utilizationRate": 75,
    "bookingsByEventType": {
      "WEDDING": 25,
      "CORPORATE": 15,
      "CONFERENCE": 10
    },
    "bookingsByMonth": {
      "2025-11": 5,
      "2025-12": 10
    }
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

### Booking Management Endpoints

#### Create Booking

Create a new hall booking. **Authentication required**.

```http
POST /api/v1/bookings
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "hallId": "hall123",
  "customerId": "customer123",
  "eventType": "WEDDING",
  "eventName": "John & Jane Wedding",
  "eventDate": "2025-12-01",
  "startTime": "10:00",
  "endTime": "18:00",
  "numberOfGuests": 300,
  "contactPerson": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "specialRequirements": "Need sound system and stage setup",
  "paymentMethod": "ONLINE",
  "quotationId": "quotation123"
}
```

**Field Validation:**
- `hallId`: Required, valid hall ID
- `customerId`: Required, valid customer ID
- `eventType`: Required, valid event type
- `eventName`: Required, string
- `eventDate`: Required, valid date (YYYY-MM-DD)
- `startTime`: Required, valid time (HH:mm)
- `endTime`: Required, valid time (HH:mm), must be after startTime
- `numberOfGuests`: Required, integer (min 1)
- `contactPerson`: Required, contact person object
  - `name`: Required, string
  - `email`: Required, valid email
  - `phone`: Required, valid phone number
- `specialRequirements`: Optional, string
- `paymentMethod`: Optional, enum: "ONLINE", "CASH", "CARD"
- `quotationId`: Optional, quotation ID if booking from quotation

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "booking123",
    "bookingNumber": "HALL-2025-001",
    "hallId": "hall123",
    "hall": {
      "name": "Grand Ballroom",
      "capacity": 500
    },
    "customerId": "customer123",
    "eventType": "WEDDING",
    "eventName": "John & Jane Wedding",
    "eventDate": "2025-12-01",
    "startTime": "10:00",
    "endTime": "18:00",
    "numberOfGuests": 300,
    "contactPerson": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 50000,
    "createdAt": "2025-11-11T10:30:00Z"
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires CUSTOMER, ADMIN, SUPER_ADMIN, or MANAGER role

**Note**: Booking creation triggers Kafka events and WebSocket broadcasts.

---

#### Get Bookings

Get list of bookings with filters and pagination. **Admin/Manager/Staff only**.

```http
GET /api/v1/bookings?page=1&limit=10&hallId=hall123&status=CONFIRMED
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10, max: 100)
- `hallId`: Optional, filter by hall ID
- `customerId`: Optional, filter by customer ID
- `eventType`: Optional, filter by event type
- `status`: Optional, filter by booking status
- `paymentStatus`: Optional, filter by payment status
- `startDate`: Optional, filter by start date (YYYY-MM-DD)
- `endDate`: Optional, filter by end date (YYYY-MM-DD)
- `isConfirmed`: Optional, filter by confirmed status
- `isCancelled`: Optional, filter by cancelled status
- `sortBy`: Optional, field to sort by (default: "createdAt")
- `sortOrder`: Optional, "asc" or "desc" (default: "desc")

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "id": "booking123",
      "bookingNumber": "HALL-2025-001",
      "hallId": "hall123",
      "customerId": "customer123",
      "eventType": "WEDDING",
      "eventDate": "2025-12-01",
      "status": "CONFIRMED",
      "totalAmount": 50000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, MANAGER, or STAFF role

---

#### Get My Bookings

Get bookings for the authenticated customer.

```http
GET /api/v1/bookings/my-bookings?page=1&limit=10
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "id": "booking123",
      "bookingNumber": "HALL-2025-001",
      "hallId": "hall123",
      "hall": {
        "name": "Grand Ballroom"
      },
      "eventType": "WEDDING",
      "eventDate": "2025-12-01",
      "status": "CONFIRMED",
      "totalAmount": 50000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires CUSTOMER role

---

#### Get Bookings by Hall

Get all bookings for a specific hall. **Admin/Manager/Staff only**.

```http
GET /api/v1/bookings/hall/:hallId?page=1&limit=10
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `hallId`: Hall ID

**Query Parameters:**
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "id": "booking123",
      "bookingNumber": "HALL-2025-001",
      "customerId": "customer123",
      "eventDate": "2025-12-01",
      "status": "CONFIRMED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, MANAGER, or STAFF role

---

#### Get Booking by ID

Get booking details by ID.

```http
GET /api/v1/bookings/:id
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Booking ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking retrieved successfully",
  "data": {
    "id": "booking123",
    "bookingNumber": "HALL-2025-001",
    "hallId": "hall123",
    "hall": {
      "id": "hall123",
      "name": "Grand Ballroom",
      "capacity": 500,
      "location": "Main Building, 2nd Floor"
    },
    "customerId": "customer123",
    "eventType": "WEDDING",
    "eventName": "John & Jane Wedding",
    "eventDate": "2025-12-01",
    "startTime": "10:00",
    "endTime": "18:00",
    "numberOfGuests": 300,
    "contactPerson": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "totalAmount": 50000,
    "specialRequirements": "Need sound system and stage setup",
    "createdAt": "2025-11-11T10:30:00Z",
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Users can only access their own bookings unless they are admin/manager/staff

---

#### Update Booking

Update booking information. **Admin/Manager only**.

```http
PUT /api/v1/bookings/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: Booking ID

**Request Body:**
```json
{
  "eventName": "John & Jane Wedding - Updated",
  "numberOfGuests": 350,
  "specialRequirements": "Updated requirements"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {
    "id": "booking123",
    "eventName": "John & Jane Wedding - Updated",
    "numberOfGuests": 350,
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

#### Confirm Booking

Confirm a booking. **Admin/Manager only**.

```http
POST /api/v1/bookings/:id/confirm
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Booking ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "data": {
    "id": "booking123",
    "status": "CONFIRMED",
    "confirmedAt": "2025-11-11T11:00:00Z",
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

**Note**: Confirmation triggers Kafka events and WebSocket broadcasts.

---

#### Cancel Booking

Cancel a booking.

```http
POST /api/v1/bookings/:id/cancel
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: Booking ID

**Request Body:**
```json
{
  "reason": "Change of plans"
}
```

**Field Validation:**
- `reason`: Optional, cancellation reason

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": "booking123",
    "status": "CANCELLED",
    "cancellationReason": "Change of plans",
    "cancelledAt": "2025-11-11T11:00:00Z",
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Users can only cancel their own bookings unless they are admin/manager

**Note**: Cancellation triggers Kafka events and WebSocket broadcasts.

---

#### Check In Booking

Check in a booking. **Admin/Manager/Staff only**.

```http
POST /api/v1/bookings/:id/checkin
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Booking ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking checked in successfully",
  "data": {
    "id": "booking123",
    "status": "CHECKED_IN",
    "checkedInAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-01T10:00:00Z"
  },
  "timestamp": "2025-12-01T10:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, MANAGER, or STAFF role

---

#### Check Out Booking

Check out a booking. **Admin/Manager/Staff only**.

```http
POST /api/v1/bookings/:id/checkout
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Booking ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking checked out successfully",
  "data": {
    "id": "booking123",
    "status": "CHECKED_OUT",
    "checkedOutAt": "2025-12-01T18:00:00Z",
    "updatedAt": "2025-12-01T18:00:00Z"
  },
  "timestamp": "2025-12-01T18:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, MANAGER, or STAFF role

---

#### Get Booking Statistics

Get booking statistics and analytics. **Admin/Manager only**.

```http
GET /api/v1/bookings/statistics
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking statistics retrieved successfully",
  "data": {
    "totalBookings": 200,
    "pendingBookings": 10,
    "confirmedBookings": 150,
    "cancelledBookings": 20,
    "completedBookings": 20,
    "totalRevenue": 10000000,
    "averageBookingValue": 50000,
    "bookingsByEventType": {
      "WEDDING": 100,
      "CORPORATE": 60,
      "CONFERENCE": 40
    },
    "bookingsByMonth": {
      "2025-11": 20,
      "2025-12": 30
    }
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

### Quotation Management Endpoints

#### Calculate Cost

Calculate estimated cost for a hall booking. **Public access**.

```http
POST /api/v1/quotations/calculate
Content-Type: application/json
```

**Request Body:**
```json
{
  "hallId": "hall123",
  "eventDate": "2025-12-01",
  "startTime": "10:00",
  "endTime": "18:00",
  "numberOfGuests": 300,
  "eventType": "WEDDING",
  "additionalServices": ["catering", "decoration"]
}
```

**Field Validation:**
- `hallId`: Required, valid hall ID
- `eventDate`: Required, valid date (YYYY-MM-DD)
- `startTime`: Required, valid time (HH:mm)
- `endTime`: Required, valid time (HH:mm)
- `numberOfGuests`: Required, integer (min 1)
- `eventType`: Optional, event type
- `additionalServices`: Optional, array of service IDs

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Cost calculated successfully",
  "data": {
    "hallId": "hall123",
    "hall": {
      "name": "Grand Ballroom",
      "baseRate": 50000
    },
    "eventDate": "2025-12-01",
    "startTime": "10:00",
    "endTime": "18:00",
    "duration": 8,
    "numberOfGuests": 300,
    "baseAmount": 50000,
    "hourlyCharges": 40000,
    "additionalServices": [
      {
        "service": "catering",
        "amount": 30000
      },
      {
        "service": "decoration",
        "amount": 20000
      }
    ],
    "subtotal": 140000,
    "tax": 25200,
    "discount": 0,
    "totalAmount": 165200,
    "breakdown": {
      "hallRental": 90000,
      "services": 50000,
      "tax": 25200
    }
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Optional (public access)

---

#### Create Quotation

Create a new quotation. **Admin/Manager only**.

```http
POST /api/v1/quotations
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "hallId": "hall123",
  "customerId": "customer123",
  "eventType": "WEDDING",
  "eventName": "John & Jane Wedding",
  "eventDate": "2025-12-01",
  "startTime": "10:00",
  "endTime": "18:00",
  "numberOfGuests": 300,
  "contactPerson": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "pricing": {
    "baseAmount": 50000,
    "hourlyCharges": 40000,
    "additionalServices": [
      {
        "service": "catering",
        "amount": 30000
      }
    ],
    "subtotal": 120000,
    "tax": 21600,
    "discount": 10000,
    "totalAmount": 131600
  },
  "validUntil": "2025-11-25",
  "termsAndConditions": "Standard terms apply"
}
```

**Field Validation:**
- `hallId`: Required, valid hall ID
- `customerId`: Required, valid customer ID
- `eventType`: Required, valid event type
- `eventName`: Required, string
- `eventDate`: Required, valid date (YYYY-MM-DD)
- `startTime`: Required, valid time (HH:mm)
- `endTime`: Required, valid time (HH:mm)
- `numberOfGuests`: Required, integer (min 1)
- `contactPerson`: Required, contact person object
- `pricing`: Required, pricing object
- `validUntil`: Optional, quotation expiry date (YYYY-MM-DD)
- `termsAndConditions`: Optional, string

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Quotation created successfully",
  "data": {
    "id": "quotation123",
    "quotationNumber": "QT-2025-001",
    "hallId": "hall123",
    "customerId": "customer123",
    "eventType": "WEDDING",
    "eventName": "John & Jane Wedding",
    "eventDate": "2025-12-01",
    "status": "DRAFT",
    "totalAmount": 131600,
    "validUntil": "2025-11-25",
    "createdAt": "2025-11-11T10:30:00Z"
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

#### Get Quotations

Get list of quotations with filters. **Admin/Manager/Staff only**.

```http
GET /api/v1/quotations?page=1&limit=10&hallId=hall123&status=SENT
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10, max: 100)
- `hallId`: Optional, filter by hall ID
- `customerId`: Optional, filter by customer ID
- `status`: Optional, filter by quotation status
- `sortBy`: Optional, field to sort by (default: "createdAt")
- `sortOrder`: Optional, "asc" or "desc" (default: "desc")

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotations retrieved successfully",
  "data": [
    {
      "id": "quotation123",
      "quotationNumber": "QT-2025-001",
      "hallId": "hall123",
      "customerId": "customer123",
      "eventType": "WEDDING",
      "status": "SENT",
      "totalAmount": 131600,
      "createdAt": "2025-11-11T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, MANAGER, or STAFF role

---

#### Get My Quotations

Get quotations for the authenticated customer.

```http
GET /api/v1/quotations/my-quotations?page=1&limit=10
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotations retrieved successfully",
  "data": [
    {
      "id": "quotation123",
      "quotationNumber": "QT-2025-001",
      "hallId": "hall123",
      "hall": {
        "name": "Grand Ballroom"
      },
      "eventType": "WEDDING",
      "status": "SENT",
      "totalAmount": 131600,
      "validUntil": "2025-11-25"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires CUSTOMER role

---

#### Get Quotations by Hall

Get all quotations for a specific hall. **Admin/Manager/Staff only**.

```http
GET /api/v1/quotations/hall/:hallId?page=1&limit=10
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `hallId`: Hall ID

**Query Parameters:**
- `page`: Optional, page number (default: 1)
- `limit`: Optional, items per page (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotations retrieved successfully",
  "data": [
    {
      "id": "quotation123",
      "quotationNumber": "QT-2025-001",
      "customerId": "customer123",
      "status": "SENT",
      "totalAmount": 131600
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 20,
    "totalPages": 2
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, MANAGER, or STAFF role

---

#### Get Quotation by ID

Get quotation details by ID.

```http
GET /api/v1/quotations/:id
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Quotation ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation retrieved successfully",
  "data": {
    "id": "quotation123",
    "quotationNumber": "QT-2025-001",
    "hallId": "hall123",
    "hall": {
      "id": "hall123",
      "name": "Grand Ballroom",
      "capacity": 500
    },
    "customerId": "customer123",
    "eventType": "WEDDING",
    "eventName": "John & Jane Wedding",
    "eventDate": "2025-12-01",
    "startTime": "10:00",
    "endTime": "18:00",
    "numberOfGuests": 300,
    "contactPerson": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890"
    },
    "pricing": {
      "baseAmount": 50000,
      "hourlyCharges": 40000,
      "additionalServices": [
        {
          "service": "catering",
          "amount": 30000
        }
      ],
      "subtotal": 120000,
      "tax": 21600,
      "discount": 10000,
      "totalAmount": 131600
    },
    "status": "SENT",
    "validUntil": "2025-11-25",
    "termsAndConditions": "Standard terms apply",
    "createdAt": "2025-11-11T10:30:00Z",
    "updatedAt": "2025-11-11T10:30:00Z"
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Users can only access their own quotations unless they are admin/manager/staff

---

#### Get Quotation by Number

Get quotation details by quotation number. **Public access**.

```http
GET /api/v1/quotations/number/:quotationNumber
```

**Path Parameters:**
- `quotationNumber`: Quotation number (e.g., "QT-2025-001")

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation retrieved successfully",
  "data": {
    "id": "quotation123",
    "quotationNumber": "QT-2025-001",
    "status": "SENT",
    "totalAmount": 131600,
    "validUntil": "2025-11-25"
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Optional (public access for quotation viewing)

---

#### Update Quotation

Update quotation information. **Admin/Manager only**.

```http
PUT /api/v1/quotations/:id
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: Quotation ID

**Request Body:**
```json
{
  "pricing": {
    "discount": 15000,
    "totalAmount": 126600
  },
  "validUntil": "2025-11-30"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation updated successfully",
  "data": {
    "id": "quotation123",
    "pricing": {
      "discount": 15000,
      "totalAmount": 126600
    },
    "validUntil": "2025-11-30",
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

#### Send Quotation

Send quotation to customer. **Admin/Manager only**.

```http
POST /api/v1/quotations/:id/send
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Quotation ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation sent successfully",
  "data": {
    "id": "quotation123",
    "status": "SENT",
    "sentAt": "2025-11-11T11:00:00Z",
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

**Note**: Sending quotation triggers email notification and Kafka events.

---

#### Accept Quotation

Accept a quotation. **Customer/Admin/Manager only**.

```http
POST /api/v1/quotations/:id/accept
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Quotation ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation accepted successfully",
  "data": {
    "id": "quotation123",
    "status": "ACCEPTED",
    "acceptedAt": "2025-11-11T11:00:00Z",
    "updatedAt": "2025-11-11T11:00:00Z",
    "booking": {
      "id": "booking123",
      "bookingNumber": "HALL-2025-001"
    }
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires CUSTOMER, ADMIN, SUPER_ADMIN, or MANAGER role

**Note**: Accepting quotation automatically creates a booking and triggers Kafka events.

---

#### Reject Quotation

Reject a quotation. **Customer/Admin/Manager only**.

```http
POST /api/v1/quotations/:id/reject
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: Quotation ID

**Request Body:**
```json
{
  "reason": "Price too high"
}
```

**Field Validation:**
- `reason`: Optional, rejection reason

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation rejected successfully",
  "data": {
    "id": "quotation123",
    "status": "REJECTED",
    "rejectionReason": "Price too high",
    "rejectedAt": "2025-11-11T11:00:00Z",
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires CUSTOMER, ADMIN, SUPER_ADMIN, or MANAGER role

**Note**: Rejection triggers Kafka events and notifications.

---

#### Expire Quotation

Manually expire a quotation. **Admin/Manager only**.

```http
POST /api/v1/quotations/:id/expire
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `id`: Quotation ID

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation expired successfully",
  "data": {
    "id": "quotation123",
    "status": "EXPIRED",
    "expiredAt": "2025-11-11T11:00:00Z",
    "updatedAt": "2025-11-11T11:00:00Z"
  },
  "timestamp": "2025-11-11T11:00:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

#### Get Quotation Statistics

Get quotation statistics and analytics. **Admin/Manager only**.

```http
GET /api/v1/quotations/statistics
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Quotation statistics retrieved successfully",
  "data": {
    "totalQuotations": 100,
    "draftQuotations": 10,
    "sentQuotations": 50,
    "acceptedQuotations": 30,
    "rejectedQuotations": 5,
    "expiredQuotations": 5,
    "conversionRate": 30,
    "averageQuotationValue": 131600,
    "quotationsByStatus": {
      "DRAFT": 10,
      "SENT": 50,
      "ACCEPTED": 30,
      "REJECTED": 5,
      "EXPIRED": 5
    }
  },
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Authorization**: Requires ADMIN, SUPER_ADMIN, or MANAGER role

---

## 🔍 GraphQL API

### Endpoint

```
POST /graphql
```

### Queries

#### Get Hall

```graphql
query {
  hall(id: "hall123") {
    id
    name
    capacity
    location
    pricing {
      baseRate
      hourlyRate
    }
    amenities
    eventTypes
    isActive
  }
}
```

#### Get Halls

```graphql
query {
  halls(filters: {
    capacity: 500
    eventType: WEDDING
    isActive: true
  }, pagination: {
    page: 1
    limit: 10
  }) {
    data {
      id
      name
      capacity
      pricing {
        baseRate
      }
    }
    pagination {
      page
      limit
      total
      totalPages
    }
  }
}
```

#### Check Hall Availability

```graphql
query {
  checkHallAvailability(
    hallId: "hall123"
    date: "2025-12-01"
    startTime: "10:00"
    endTime: "18:00"
  ) {
    isAvailable
    conflictingBookings {
      id
      eventDate
      startTime
      endTime
    }
  }
}
```

#### Get Booking

```graphql
query {
  booking(id: "booking123") {
    id
    bookingNumber
    hall {
      name
      capacity
    }
    eventType
    eventDate
    startTime
    endTime
    status
    totalAmount
  }
}
```

#### Get Quotation

```graphql
query {
  quotation(id: "quotation123") {
    id
    quotationNumber
    hall {
      name
    }
    eventType
    eventDate
    status
    totalAmount
    validUntil
  }
}
```

### Mutations

#### Create Booking

```graphql
mutation {
  createBooking(input: {
    hallId: "hall123"
    customerId: "customer123"
    eventType: WEDDING
    eventName: "John & Jane Wedding"
    eventDate: "2025-12-01"
    startTime: "10:00"
    endTime: "18:00"
    numberOfGuests: 300
  }) {
    id
    bookingNumber
    status
    totalAmount
  }
}
```

#### Confirm Booking

```graphql
mutation {
  confirmBooking(id: "booking123") {
    id
    status
    confirmedAt
  }
}
```

#### Create Quotation

```graphql
mutation {
  createQuotation(input: {
    hallId: "hall123"
    customerId: "customer123"
    eventType: WEDDING
    eventDate: "2025-12-01"
    startTime: "10:00"
    endTime: "18:00"
    numberOfGuests: 300
    pricing {
      baseAmount: 50000
      hourlyCharges: 40000
      totalAmount: 131600
    }
  }) {
    id
    quotationNumber
    status
    totalAmount
  }
}
```

#### Accept Quotation

```graphql
mutation {
  acceptQuotation(id: "quotation123") {
    id
    status
    acceptedAt
    booking {
      id
      bookingNumber
    }
  }
}
```

### Subscriptions

#### Booking Status Updates

```graphql
subscription {
  bookingStatusUpdated(bookingId: "booking123") {
    id
    status
    updatedAt
  }
}
```

#### Quotation Status Updates

```graphql
subscription {
  quotationStatusUpdated(quotationId: "quotation123") {
    id
    status
    updatedAt
  }
}
```

---

## 🔌 gRPC API

### Service Definition

The Hall Service exposes gRPC endpoints for internal service-to-service communication.

**Proto File**: `proto/hall.proto`

### Methods

#### GetHall

```protobuf
rpc GetHall(GetHallRequest) returns (GetHallResponse);
```

#### CheckHallAvailability

```protobuf
rpc CheckHallAvailability(CheckHallAvailabilityRequest) returns (CheckHallAvailabilityResponse);
```

#### CreateBooking

```protobuf
rpc CreateBooking(CreateBookingRequest) returns (CreateBookingResponse);
```

#### GetBooking

```protobuf
rpc GetBooking(GetBookingRequest) returns (GetBookingResponse);
```

### gRPC Endpoint

```
localhost:50057
```

---

## 🔌 WebSocket API

WebSocket support is provided via native WebSocket and Socket.IO.

### Connection

```
ws://localhost:3010/ws
```

### Real-Time Events

- `hall.created` - New hall created
- `hall.updated` - Hall information updated
- `booking.created` - New booking created
- `booking.status.updated` - Booking status changed
- `booking.confirmed` - Booking confirmed
- `booking.cancelled` - Booking cancelled
- `quotation.created` - New quotation created
- `quotation.status.updated` - Quotation status changed
- `quotation.accepted` - Quotation accepted
- `quotation.rejected` - Quotation rejected

---

## ⚠️ Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (authorization failed)
- `404` - Not Found
- `409` - Conflict (hall/booking already exists or unavailable)
- `429` - Too Many Requests
- `500` - Internal Server Error

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `HALL_NOT_FOUND` - Hall not found
- `HALL_NOT_AVAILABLE` - Hall not available for booking
- `BOOKING_NOT_FOUND` - Booking not found
- `BOOKING_CANNOT_BE_MODIFIED` - Booking cannot be modified
- `QUOTATION_NOT_FOUND` - Quotation not found
- `QUOTATION_EXPIRED` - Quotation has expired
- `QUOTATION_ALREADY_ACCEPTED` - Quotation already accepted
- `INVALID_DATE_RANGE` - Invalid date/time range
- `RATE_LIMIT_EXCEEDED` - Too many requests

---

## 🚦 Rate Limiting

### Rate Limit Configuration

Different endpoints have different rate limits:

- **Public Endpoints** (hall search, availability check): 200 requests per 15 minutes per IP
- **Booking Creation**: 10 requests per 15 minutes per user
- **Quotation Creation**: 10 requests per 15 minutes per user
- **Search Endpoints**: 100 requests per 15 minutes per IP
- **Strict Endpoints** (hall/booking management): 10 requests per 15 minutes per IP
- **General Endpoints**: 100 requests per 15 minutes per IP

### Rate Limit Headers

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1636632000
```

---

## 🔒 Authorization Rules

### Public Endpoints (No Authentication)

- Get Halls (list)
- Get Hall by ID
- Search Halls
- Check Hall Availability
- Calculate Cost
- Get Quotation by Number

### Protected Endpoints (Authentication Required)

- Create Booking
- Get My Bookings
- Get Booking by ID (own bookings)
- Cancel Booking (own bookings)
- Get My Quotations
- Get Quotation by ID (own quotations)
- Accept Quotation (own quotations)
- Reject Quotation (own quotations)

### Admin/Staff Only Endpoints

- Hall Management (ADMIN, SUPER_ADMIN)
- Booking Management (ADMIN, SUPER_ADMIN, MANAGER, STAFF)
- Quotation Management (ADMIN, SUPER_ADMIN, MANAGER)
- Statistics (ADMIN, SUPER_ADMIN, MANAGER)

---

## 📝 Request/Response Format

### Request Headers

```
Content-Type: application/json
Authorization: Bearer <access_token> (for protected endpoints)
X-Request-ID: req_1234567890 (optional, auto-generated)
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful" (optional),
  "pagination": { ... } (optional),
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "code": "ERROR_CODE" (optional),
  "timestamp": "2025-11-11T10:30:00Z",
  "requestId": "req_1234567890"
}
```

---

## 🔗 Related Documentation

- [API Gateway Documentation](../rubizz-api-gateway/API_DOCUMENTATION.md)
- [Customer Service Documentation](../rubizz-customer-service/API_DOCUMENTATION.md)
- [Hotel Service Documentation](../rubizz-hotel-service/API_DOCUMENTATION.md)
- [Development and Production Guide](../DEVELOPMENT_AND_PRODUCTION_GUIDE.md)

---

## 📊 Integration Examples

### Frontend Integration (React/Next.js)

```typescript
// Check hall availability
const checkAvailability = async (hallId: string, date: string, startTime: string, endTime: string) => {
  const params = new URLSearchParams({
    date,
    startTime,
    endTime,
  });
  
  const response = await fetch(`http://localhost:3010/api/v1/halls/${hallId}/availability?${params}`);
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.message);
  }
};

// Create booking
const createBooking = async (bookingData: any, token: string) => {
  const response = await fetch('http://localhost:3010/api/v1/bookings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData),
  });
  
  const data = await response.json();
  
  if (data.success) {
    return data.data;
  } else {
    throw new Error(data.message);
  }
};
```

### Frontend Integration (Angular)

```typescript
// Check hall availability
checkAvailability(hallId: string, date: string, startTime: string, endTime: string): Observable<AvailabilityData> {
  const params = new URLSearchParams({
    date,
    startTime,
    endTime,
  });
  
  return this.http.get<AvailabilityResponse>(
    `http://localhost:3010/api/v1/halls/${hallId}/availability?${params}`
  ).pipe(
    map(response => response.data)
  );
}

// Create booking
createBooking(bookingData: any): Observable<Booking> {
  return this.http.post<BookingResponse>(
    'http://localhost:3010/api/v1/bookings',
    bookingData
  ).pipe(
    map(response => response.data)
  );
}
```

---

**Last Updated**: November 2025  
**Version**: 1.0.0

