// Hall Management Service Types and Interfaces
// This file contains all TypeScript type definitions for the hall management service

// Import Prisma enums
import { 
  EventType, 
  BookingStatus, 
  PaymentStatus, 
  PaymentMode, 
  PaymentType, 
  QuotationStatus, 
  LineItemType 
} from '@prisma/client';

// Re-export Prisma enums
export { 
  EventType, 
  BookingStatus, 
  PaymentStatus, 
  PaymentMode, 
  PaymentType, 
  QuotationStatus, 
  LineItemType 
};

// Base interfaces
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Hall interfaces
export interface Hall extends BaseEntity {
  name: string;
  description: string | null;
  capacity: number;
  area: number;
  location: string;
  amenities: string[];
  baseRate: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  weekendRate: number | null;
  isActive: boolean;
  isAvailable: boolean;
  images: string[];
  floorPlan: string | null;
}

export interface CreateHallRequest {
  name: string;
  description: string | null;
  capacity: number;
  area?: number;
  location: string;
  floor?: string;
  amenities: string[];
  baseRate: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  weekendRate: number | null;
  images?: string[];
  floorPlan: string | null;
}

export interface UpdateHallRequest {
  name?: string;
  description: string | null;
  capacity?: number;
  area?: number;
  location?: string;
  floor?: string;
  amenities?: string[];
  baseRate?: number;
  hourlyRate: number | null;
  dailyRate: number | null;
  weekendRate: number | null;
  isActive?: boolean;
  isAvailable?: boolean;
  images?: string[];
  floorPlan: string | null;
}

// Hall Booking interfaces
export interface HallBooking extends BaseEntity {
  hallId: string;
  customerId: string;
  eventName: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  guestCount: number;
  specialRequests: string | null;
  baseAmount: number;
  additionalCharges: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  depositAmount: number | null;
  balanceAmount: number | null;
  depositPaid: boolean;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode | null;
  status: BookingStatus;
  isConfirmed: boolean;
  isCancelled: boolean;
  cancellationReason: string | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  hall?: Hall;
  lineItems?: HallLineItem[];
  payments?: HallPayment[];
}

export interface CreateBookingRequest {
  hallId: string;
  customerId: string;
  eventName: string;
  eventType: EventType;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  specialRequests: string | null;
  quotationId?: string;
}

export interface UpdateBookingRequest {
  eventName?: string;
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  specialRequests: string | null;
  status?: BookingStatus;
  cancellationReason?: string;
}

// Hall Quotation interfaces
export interface HallQuotation extends BaseEntity {
  hallId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quotationNumber: string;
  eventName: string;
  eventType: EventType;
  eventDate: Date;
  startTime: string;
  endTime: string;
  guestCount: number;
  baseAmount: number;
  lineItems: HallLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: Date;
  isAccepted: boolean;
  isExpired: boolean;
  status: QuotationStatus;
  acceptedAt: Date | null;
  hall?: Hall;
  booking?: HallBooking;
}

export interface CreateQuotationRequest {
  hallId: string;
  customerId: string;
  eventName: string;
  eventType: EventType;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  lineItems: CreateLineItemRequest[];
  validUntil?: string;
}

export interface UpdateQuotationRequest {
  eventName?: string;
  eventType?: EventType;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  lineItems?: CreateLineItemRequest[];
  validUntil?: string;
  status?: QuotationStatus;
  baseAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
}

// Hall Line Item interfaces
export interface HallLineItem extends BaseEntity {
  hallId: string;
  quotationId: string | null;
  bookingId: string | null;
  itemType: LineItemType;
  itemName: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: Record<string, any>;
  hall?: Hall;
  quotation?: HallQuotation;
  booking?: HallBooking;
}

export interface CreateLineItemRequest {
  itemType: LineItemType;
  itemName: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  specifications?: Record<string, any>;
}

export interface UpdateLineItemRequest {
  itemType?: LineItemType;
  itemName?: string;
  description: string | null;
  quantity?: number;
  unitPrice?: number;
  specifications?: Record<string, any>;
}

// Hall Payment interfaces
export interface HallPayment extends BaseEntity {
  bookingId: string;
  paymentNumber: string;
  amount: number;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  reference?: string;
  isRefunded: boolean;
  refundAmount?: number;
  refundReason?: string;
  processedAt?: Date;
  refundedAt?: Date;
  gatewayResponse?: any;
  booking?: HallBooking;
}

export interface CreatePaymentRequest {
  bookingId: string;
  amount: number;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  transactionId?: string;
  reference?: string;
}

export interface UpdatePaymentRequest {
  status?: PaymentStatus;
  transactionId?: string;
  reference?: string;
  refundAmount?: number;
  refundReason?: string;
}

// Hall Availability interfaces
export interface HallAvailability extends BaseEntity {
  hallId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

export interface CreateAvailabilityRequest {
  hallId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
}

export interface UpdateAvailabilityRequest {
  isAvailable?: boolean;
  reason?: string;
}

// Cost Calculator interfaces
export interface CostCalculationRequest {
  hallId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  lineItems: CreateLineItemRequest[];
  discount?: number;
}

export interface CostCalculationResponse {
  baseAmount: number;
  lineItems: HallLineItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  breakdown: {
    hallRental: number;
    chairs: number;
    tables: number;
    decoration: number;
    lighting: number;
    avEquipment: number;
    catering: number;
    security: number;
    generator: number;
    cleaning: number;
    parking: number;
    other: number;
  };
}

// Search and Filter interfaces
export interface HallSearchFilters {
  location?: string;
  capacity?: number;
  minCapacity?: number;
  maxCapacity?: number;
  eventType?: EventType;
  date?: string;
  startTime?: string;
  endTime?: string;
  amenities?: string[];
  minRate?: number;
  maxRate?: number;
  isActive?: boolean;
  isAvailable?: boolean;
}

export interface BookingSearchFilters {
  hallId?: string;
  customerId?: string;
  eventType?: EventType;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  isConfirmed?: boolean;
  isCancelled?: boolean;
}

export interface QuotationSearchFilters {
  hallId?: string;
  customerId?: string;
  eventType?: EventType;
  status?: QuotationStatus;
  isAccepted?: boolean;
  isExpired?: boolean;
  eventDate?: string;
  validUntil?: string;
}

// Pagination interfaces
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
  requestId?: string;
  details?: any;
}

// Service interfaces
export interface HallServiceInterface {
  createHall(data: CreateHallRequest): Promise<Hall>;
  getHallById(id: string): Promise<Hall | null>;
  getHalls(filters?: HallSearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Hall>>;
  updateHall(id: string, data: UpdateHallRequest): Promise<Hall>;
  deleteHall(id: string): Promise<boolean>;
  checkAvailability(hallId: string, date: string, startTime: string, endTime: string): Promise<boolean>;
}

export interface BookingServiceInterface {
  createBooking(data: CreateBookingRequest): Promise<HallBooking>;
  getBookingById(id: string): Promise<HallBooking | null>;
  getBookings(filters?: BookingSearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<HallBooking>>;
  updateBooking(id: string, data: UpdateBookingRequest): Promise<HallBooking>;
  cancelBooking(id: string, reason: string): Promise<HallBooking>;
  confirmBooking(id: string): Promise<HallBooking>;
}

export interface QuotationServiceInterface {
  createQuotation(data: CreateQuotationRequest): Promise<HallQuotation>;
  getQuotationById(id: string): Promise<HallQuotation | null>;
  getQuotations(filters?: QuotationSearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<HallQuotation>>;
  updateQuotation(id: string, data: UpdateQuotationRequest): Promise<HallQuotation>;
  acceptQuotation(id: string): Promise<HallQuotation>;
  rejectQuotation(id: string): Promise<HallQuotation>;
  expireQuotation(id: string): Promise<HallQuotation>;
}

export interface CostCalculatorServiceInterface {
  calculateCost(data: CostCalculationRequest): Promise<CostCalculationResponse>;
  generateQuotation(data: CreateQuotationRequest): Promise<HallQuotation>;
  validateBooking(data: CreateBookingRequest): Promise<{ isValid: boolean; errors: string[] }>;
}

// Utility types
export type HallWithRelations = Hall & {
  bookings?: HallBooking[];
  quotations?: HallQuotation[];
  lineItems?: HallLineItem[];
};

export type BookingWithRelations = HallBooking & {
  hall?: Hall;
  quotation?: HallQuotation;
  lineItems?: HallLineItem[];
  payments?: HallPayment[];
};

export type QuotationWithRelations = HallQuotation & {
  hall?: Hall;
  booking?: HallBooking;
  lineItems?: HallLineItem[];
};

// Event types for business events
export interface HallBookingCreatedEvent {
  type: 'hall.booking.created';
  data: {
    bookingId: string;
    hallId: string;
    customerId: string;
    eventName: string;
    eventType: EventType;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
  };
}

export interface HallBookingCancelledEvent {
  type: 'hall.booking.cancelled';
  data: {
    bookingId: string;
    hallId: string;
    customerId: string;
    cancellationReason: string;
    refundAmount?: number;
  };
}

export interface HallQuotationCreatedEvent {
  type: 'hall.quotation.created';
  data: {
    quotationId: string;
    hallId: string;
    customerId: string;
    eventName: string;
    totalAmount: number;
    validUntil: Date;
  };
}

export interface HallQuotationAcceptedEvent {
  type: 'hall.quotation.accepted';
  data: {
    quotationId: string;
    bookingId: string;
    hallId: string;
    customerId: string;
    totalAmount: number;
  };
}

export type HallBusinessEvent = 
  | HallBookingCreatedEvent
  | HallBookingCancelledEvent
  | HallQuotationCreatedEvent
  | HallQuotationAcceptedEvent;
