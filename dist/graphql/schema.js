"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
exports.typeDefs = `
  scalar Date

  type PaginationMeta {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  enum BookingStatus {
    PENDING
    CONFIRMED
    CHECKED_IN
    COMPLETED
    CANCELLED
    NO_SHOW
  }

  enum PaymentStatus {
    PENDING
    PROCESSING
    COMPLETED
    FAILED
    REFUNDED
    PARTIALLY_REFUNDED
  }

  enum QuotationStatus {
    DRAFT
    SENT
    ACCEPTED
    REJECTED
    EXPIRED
  }

  enum EventType {
    WEDDING
    CORPORATE
    BIRTHDAY
    ANNIVERSARY
    CONFERENCE
    SEMINAR
    PARTY
    MEETING
    OTHER
  }

  type Hall {
    id: ID!
    name: String!
    description: String
    capacity: Int!
    area: Float!
    location: String!
    amenities: [String!]!
    baseRate: Float!
    hourlyRate: Float
    dailyRate: Float
    weekendRate: Float
    isActive: Boolean!
    isAvailable: Boolean!
    images: [String!]!
    floorPlan: String
    createdAt: Date
    updatedAt: Date
  }

  type HallBooking {
    id: ID!
    hallId: ID!
    customerId: ID!
    eventName: String!
    eventType: EventType!
    startDate: Date!
    endDate: Date!
    startTime: String!
    endTime: String!
    duration: Int!
    guestCount: Int!
    specialRequests: String
    baseAmount: Float!
    additionalCharges: Float!
    discount: Float!
    taxAmount: Float!
    totalAmount: Float!
    depositAmount: Float
    balanceAmount: Float
    depositPaid: Boolean!
    paymentStatus: PaymentStatus!
    status: BookingStatus!
    createdAt: Date
    updatedAt: Date
  }

  type HallQuotation {
    id: ID!
    hallId: ID!
    customerId: ID!
    quotationNumber: String!
    eventName: String!
    eventType: EventType!
    eventDate: Date!
    startTime: String!
    endTime: String!
    guestCount: Int!
    baseAmount: Float!
    subtotal: Float!
    taxAmount: Float!
    totalAmount: Float!
    validUntil: Date!
    status: QuotationStatus!
    isAccepted: Boolean!
    isExpired: Boolean!
    createdAt: Date
    updatedAt: Date
  }

  type HallPage {
    data: [Hall!]!
    pagination: PaginationMeta!
  }

  type BookingPage {
    data: [HallBooking!]!
    pagination: PaginationMeta!
  }

  type QuotationPage {
    data: [HallQuotation!]!
    pagination: PaginationMeta!
  }

  input HallFilters {
    location: String
    capacity: Int
    minCapacity: Int
    maxCapacity: Int
    amenities: [String!]
    minRate: Float
    maxRate: Float
    isActive: Boolean
    isAvailable: Boolean
  }

  input PaginationInput {
    page: Int
    limit: Int
    sortBy: String
    sortOrder: String
  }

  input CreateHallInput {
    name: String!
    description: String
    capacity: Int!
    area: Float
    location: String!
    amenities: [String!]
    baseRate: Float!
    hourlyRate: Float
    dailyRate: Float
    weekendRate: Float
    images: [String!]
    floorPlan: String
  }

  input UpdateHallInput {
    name: String
    description: String
    capacity: Int
    area: Float
    location: String
    amenities: [String!]
    baseRate: Float
    hourlyRate: Float
    dailyRate: Float
    weekendRate: Float
    isActive: Boolean
    isAvailable: Boolean
    images: [String!]
    floorPlan: String
  }

  input CreateBookingInput {
    hallId: ID!
    customerId: ID!
    eventName: String!
    eventType: EventType!
    startDate: String!
    endDate: String!
    startTime: String!
    endTime: String!
    guestCount: Int!
    specialRequests: String
  }

  input UpdateBookingInput {
    eventName: String
    eventType: EventType
    startDate: String
    endDate: String
    startTime: String
    endTime: String
    guestCount: Int
    specialRequests: String
  }

  input CreateQuotationInput {
    hallId: ID!
    customerId: ID!
    eventName: String!
    eventType: EventType!
    eventDate: String!
    startTime: String!
    endTime: String!
    guestCount: Int!
  }

  input UpdateQuotationInput {
    eventName: String
    eventType: EventType
    eventDate: String
    startTime: String
    endTime: String
    guestCount: Int
  }

  type Query {
    hall(id: ID!): Hall
    halls(filters: HallFilters, pagination: PaginationInput): HallPage!
    booking(id: ID!): HallBooking
    bookings(pagination: PaginationInput): BookingPage!
    quotation(id: ID!): HallQuotation
    quotations(pagination: PaginationInput): QuotationPage!
  }

  type Mutation {
    createHall(input: CreateHallInput!): Hall!
    updateHall(id: ID!, input: UpdateHallInput!): Hall!
    deleteHall(id: ID!): Boolean!

    createBooking(input: CreateBookingInput!): HallBooking!
    updateBooking(id: ID!, input: UpdateBookingInput!): HallBooking!
    cancelBooking(id: ID!, reason: String!): HallBooking!
    confirmBooking(id: ID!): HallBooking!
    checkInBooking(id: ID!): HallBooking!
    checkOutBooking(id: ID!): HallBooking!

    createQuotation(input: CreateQuotationInput!): HallQuotation!
    updateQuotation(id: ID!, input: UpdateQuotationInput!): HallQuotation!
    acceptQuotation(id: ID!): HallQuotation!
    rejectQuotation(id: ID!): HallQuotation!
    expireQuotation(id: ID!): HallQuotation!
    sendQuotation(id: ID!): HallQuotation!
  }
`;
//# sourceMappingURL=schema.js.map