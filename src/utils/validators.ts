import { 
  CreateHallRequest, 
  UpdateHallRequest, 
  CreateBookingRequest, 
  UpdateBookingRequest,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  CreateLineItemRequest,
  CreatePaymentRequest,
  CreateAvailabilityRequest,
  EventType,
  BookingStatus,
  PaymentMode,
  PaymentType,
  LineItemType
} from '@/types';
import { logger } from './logger';

export class Validators {
  /**
   * Validate hall creation request
   */
  public static validateCreateHall(data: CreateHallRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Hall name is required');
    } else if (data.name.length > 100) {
      errors.push('Hall name must be less than 100 characters');
    }

    if (!data.capacity || data.capacity <= 0) {
      errors.push('Capacity must be greater than 0');
    } else if (data.capacity > 10000) {
      errors.push('Capacity cannot exceed 10,000');
    }

    if (data.area && data.area <= 0) {
      errors.push('Area must be greater than 0');
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.push('Location is required');
    } else if (data.location.length > 200) {
      errors.push('Location must be less than 200 characters');
    }

    if (data.floor && data.floor.length > 50) {
      errors.push('Floor must be less than 50 characters');
    }

    if (!data.baseRate || data.baseRate <= 0) {
      errors.push('Base rate must be greater than 0');
    }

    if (data.hourlyRate && data.hourlyRate <= 0) {
      errors.push('Hourly rate must be greater than 0');
    }

    if (data.dailyRate && data.dailyRate <= 0) {
      errors.push('Daily rate must be greater than 0');
    }

    if (data.weekendRate && data.weekendRate <= 0) {
      errors.push('Weekend rate must be greater than 0');
    }

    if (data.amenities && !Array.isArray(data.amenities)) {
      errors.push('Amenities must be an array');
    }

    if (data.images && !Array.isArray(data.images)) {
      errors.push('Images must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate hall update request
   */
  public static validateUpdateHall(data: UpdateHallRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        errors.push('Hall name cannot be empty');
      } else if (data.name.length > 100) {
        errors.push('Hall name must be less than 100 characters');
      }
    }

    if (data.capacity !== undefined) {
      if (data.capacity <= 0) {
        errors.push('Capacity must be greater than 0');
      } else if (data.capacity > 10000) {
        errors.push('Capacity cannot exceed 10,000');
      }
    }

    if (data.area !== undefined && data.area <= 0) {
      errors.push('Area must be greater than 0');
    }

    if (data.location !== undefined) {
      if (!data.location || data.location.trim().length === 0) {
        errors.push('Location cannot be empty');
      } else if (data.location.length > 200) {
        errors.push('Location must be less than 200 characters');
      }
    }

    if (data.floor !== undefined && data.floor.length > 50) {
      errors.push('Floor must be less than 50 characters');
    }

    if (data.baseRate !== undefined && data.baseRate <= 0) {
      errors.push('Base rate must be greater than 0');
    }

    if (data.hourlyRate !== undefined && data.hourlyRate <= 0) {
      errors.push('Hourly rate must be greater than 0');
    }

    if (data.dailyRate !== undefined && data.dailyRate <= 0) {
      errors.push('Daily rate must be greater than 0');
    }

    if (data.weekendRate !== undefined && data.weekendRate <= 0) {
      errors.push('Weekend rate must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate booking creation request
   */
  public static validateCreateBooking(data: CreateBookingRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.hallId) {
      errors.push('Hall ID is required');
    }

    if (!data.customerId) {
      errors.push('Customer ID is required');
    }

    if (!data.eventName || data.eventName.trim().length === 0) {
      errors.push('Event name is required');
    } else if (data.eventName.length > 200) {
      errors.push('Event name must be less than 200 characters');
    }

    if (!data.eventType || !Object.values(EventType).includes(data.eventType)) {
      errors.push('Valid event type is required');
    }

    if (!data.startDate) {
      errors.push('Start date is required');
    } else {
      const startDate = new Date(data.startDate);
      const now = new Date();
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date format');
      } else if (startDate < now) {
        errors.push('Start date cannot be in the past');
      }
    }

    if (!data.endDate) {
      errors.push('End date is required');
    } else {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date format');
      } else if (data.startDate && endDate < new Date(data.startDate)) {
        errors.push('End date must be after start date');
      }
    }

    if (!data.startTime || !this.isValidTimeFormat(data.startTime)) {
      errors.push('Valid start time is required (HH:MM format)');
    }

    if (!data.endTime || !this.isValidTimeFormat(data.endTime)) {
      errors.push('Valid end time is required (HH:MM format)');
    }

    if (data.startTime && data.endTime && !this.isValidTimeRange(data.startTime, data.endTime)) {
      errors.push('End time must be after start time');
    }

    if (!data.guestCount || data.guestCount <= 0) {
      errors.push('Guest count must be greater than 0');
    } else if (data.guestCount > 10000) {
      errors.push('Guest count cannot exceed 10,000');
    }

    if (data.specialRequests && data.specialRequests.length > 1000) {
      errors.push('Special requests must be less than 1000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate booking update request
   */
  public static validateUpdateBooking(data: UpdateBookingRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.eventName !== undefined) {
      if (!data.eventName || data.eventName.trim().length === 0) {
        errors.push('Event name cannot be empty');
      } else if (data.eventName.length > 200) {
        errors.push('Event name must be less than 200 characters');
      }
    }

    if (data.eventType !== undefined && !Object.values(EventType).includes(data.eventType)) {
      errors.push('Invalid event type');
    }

    if (data.startDate !== undefined) {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date format');
      }
    }

    if (data.endDate !== undefined) {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date format');
      }
    }

    if (data.startTime !== undefined && !this.isValidTimeFormat(data.startTime)) {
      errors.push('Invalid start time format (HH:MM)');
    }

    if (data.endTime !== undefined && !this.isValidTimeFormat(data.endTime)) {
      errors.push('Invalid end time format (HH:MM)');
    }

    if (data.guestCount !== undefined) {
      if (data.guestCount <= 0) {
        errors.push('Guest count must be greater than 0');
      } else if (data.guestCount > 10000) {
        errors.push('Guest count cannot exceed 10,000');
      }
    }

    if (data.specialRequests !== undefined && data.specialRequests.length > 1000) {
      errors.push('Special requests must be less than 1000 characters');
    }

    if (data.status !== undefined && !Object.values(BookingStatus).includes(data.status)) {
      errors.push('Invalid booking status');
    }

    if (data.cancellationReason !== undefined && data.cancellationReason.length > 500) {
      errors.push('Cancellation reason must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate quotation creation request
   */
  public static validateCreateQuotation(data: CreateQuotationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.hallId) {
      errors.push('Hall ID is required');
    }

    if (!data.customerId) {
      errors.push('Customer ID is required');
    }

    if (!data.eventName || data.eventName.trim().length === 0) {
      errors.push('Event name is required');
    } else if (data.eventName.length > 200) {
      errors.push('Event name must be less than 200 characters');
    }

    if (!data.eventType || !Object.values(EventType).includes(data.eventType)) {
      errors.push('Valid event type is required');
    }

    if (!data.eventDate) {
      errors.push('Event date is required');
    } else {
      const eventDate = new Date(data.eventDate);
      const now = new Date();
      if (isNaN(eventDate.getTime())) {
        errors.push('Invalid event date format');
      } else if (eventDate < now) {
        errors.push('Event date cannot be in the past');
      }
    }

    if (!data.startTime || !this.isValidTimeFormat(data.startTime)) {
      errors.push('Valid start time is required (HH:MM format)');
    }

    if (!data.endTime || !this.isValidTimeFormat(data.endTime)) {
      errors.push('Valid end time is required (HH:MM format)');
    }

    if (data.startTime && data.endTime && !this.isValidTimeRange(data.startTime, data.endTime)) {
      errors.push('End time must be after start time');
    }

    if (!data.guestCount || data.guestCount <= 0) {
      errors.push('Guest count must be greater than 0');
    } else if (data.guestCount > 10000) {
      errors.push('Guest count cannot exceed 10,000');
    }

    if (!data.lineItems || data.lineItems.length === 0) {
      errors.push('At least one line item is required');
    } else {
      data.lineItems.forEach((item, index) => {
        const itemErrors = this.validateLineItem(item);
        if (!itemErrors.isValid) {
          errors.push(`Line item ${index + 1}: ${itemErrors.errors.join(', ')}`);
        }
      });
    }

    if (data.validUntil) {
      const validUntil = new Date(data.validUntil);
      if (isNaN(validUntil.getTime())) {
        errors.push('Invalid valid until date format');
      } else if (validUntil <= new Date()) {
        errors.push('Valid until date must be in the future');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate line item
   */
  public static validateLineItem(data: CreateLineItemRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.itemType || !Object.values(LineItemType).includes(data.itemType)) {
      errors.push('Valid item type is required');
    }

    if (!data.itemName || data.itemName.trim().length === 0) {
      errors.push('Item name is required');
    } else if (data.itemName.length > 100) {
      errors.push('Item name must be less than 100 characters');
    }

    if (data.description && data.description.length > 200) {
      errors.push('Description must be less than 200 characters');
    }

    if (!data.quantity || data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    } else if (data.quantity > 10000) {
      errors.push('Quantity cannot exceed 10,000');
    }

    if (!data.unitPrice || data.unitPrice <= 0) {
      errors.push('Unit price must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate payment creation request
   */
  public static validateCreatePayment(data: CreatePaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.bookingId) {
      errors.push('Booking ID is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!data.paymentType || !Object.values(PaymentType).includes(data.paymentType)) {
      errors.push('Valid payment type is required');
    }

    if (!data.paymentMode || !Object.values(PaymentMode).includes(data.paymentMode)) {
      errors.push('Valid payment mode is required');
    }

    if (data.transactionId && data.transactionId.length > 100) {
      errors.push('Transaction ID must be less than 100 characters');
    }

    if (data.reference && data.reference.length > 100) {
      errors.push('Reference must be less than 100 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate availability creation request
   */
  public static validateCreateAvailability(data: CreateAvailabilityRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.hallId) {
      errors.push('Hall ID is required');
    }

    if (!data.date) {
      errors.push('Date is required');
    } else {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
      }
    }

    if (!data.startTime || !this.isValidTimeFormat(data.startTime)) {
      errors.push('Valid start time is required (HH:MM format)');
    }

    if (!data.endTime || !this.isValidTimeFormat(data.endTime)) {
      errors.push('Valid end time is required (HH:MM format)');
    }

    if (data.startTime && data.endTime && !this.isValidTimeRange(data.startTime, data.endTime)) {
      errors.push('End time must be after start time');
    }

    if (data.reason && data.reason.length > 200) {
      errors.push('Reason must be less than 200 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate time format (HH:MM)
   */
  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Validate time range
   */
  private static isValidTimeRange(startTime: string, endTime: string): boolean {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes > startMinutes;
  }

  /**
   * Validate UUID format
   */
  public static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate email format
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  public static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Sanitize string input
   */
  public static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate pagination parameters
   */
  public static validatePagination(page?: number, limit?: number): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (page !== undefined) {
      if (!Number.isInteger(page) || page < 1) {
        errors.push('Page must be a positive integer');
      }
    }

    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        errors.push('Limit must be between 1 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate date range
   */
  public static validateDateRange(startDate?: string, endDate?: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        errors.push('Invalid start date format');
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        errors.push('Invalid end date format');
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        errors.push('End date must be after start date');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default Validators;
