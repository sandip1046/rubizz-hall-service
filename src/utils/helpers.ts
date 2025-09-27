import { EventType, BookingStatus, PaymentStatus, QuotationStatus } from '@/types';
import { logger } from './logger';

export class Helpers {
  /**
   * Generate unique ID
   */
  public static generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate booking reference number
   */
  public static generateBookingReference(): string {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Generate payment reference number
   */
  public static generatePaymentReference(): string {
    const prefix = 'PAY';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Format currency amount
   */
  public static formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  /**
   * Format date for display
   */
  public static formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-IN');
      case 'long':
        return dateObj.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'time':
        return dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });
      default:
        return dateObj.toLocaleDateString('en-IN');
    }
  }

  /**
   * Calculate time difference in hours
   */
  public static getTimeDifferenceInHours(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return (endMinutes - startMinutes) / 60;
  }

  /**
   * Check if date is weekend
   */
  public static isWeekend(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = dateObj.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  }

  /**
   * Check if date is today
   */
  public static isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  }

  /**
   * Check if date is in the past
   */
  public static isPastDate(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    return dateObj < now;
  }

  /**
   * Add days to date
   */
  public static addDays(date: Date | string, days: number): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const result = new Date(dateObj);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Get start of day
   */
  public static getStartOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const result = new Date(dateObj);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Get end of day
   */
  public static getEndOfDay(date: Date | string): Date {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const result = new Date(dateObj);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Convert time string to minutes
   */
  public static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string
   */
  public static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Check if time is within business hours
   */
  public static isWithinBusinessHours(time: string, startHour: number = 6, endHour: number = 22): boolean {
    const [hours] = time.split(':').map(Number);
    return hours >= startHour && hours < endHour;
  }

  /**
   * Get event type display name
   */
  public static getEventTypeDisplayName(eventType: EventType): string {
    const displayNames: Record<EventType, string> = {
      [EventType.WEDDING]: 'Wedding',
      [EventType.CORPORATE]: 'Corporate Event',
      [EventType.BIRTHDAY]: 'Birthday Party',
      [EventType.ANNIVERSARY]: 'Anniversary',
      [EventType.CONFERENCE]: 'Conference',
      [EventType.SEMINAR]: 'Seminar',
      [EventType.PARTY]: 'Party',
      [EventType.MEETING]: 'Meeting',
      [EventType.OTHER]: 'Other',
    };
    return displayNames[eventType] || 'Unknown';
  }

  /**
   * Get booking status display name
   */
  public static getBookingStatusDisplayName(status: BookingStatus): string {
    const displayNames: Record<BookingStatus, string> = {
      [BookingStatus.PENDING]: 'Pending',
      [BookingStatus.CONFIRMED]: 'Confirmed',
      [BookingStatus.CHECKED_IN]: 'Checked In',
      [BookingStatus.COMPLETED]: 'Completed',
      [BookingStatus.CANCELLED]: 'Cancelled',
      [BookingStatus.NO_SHOW]: 'No Show',
    };
    return displayNames[status] || 'Unknown';
  }

  /**
   * Get payment status display name
   */
  public static getPaymentStatusDisplayName(status: PaymentStatus): string {
    const displayNames: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Pending',
      [PaymentStatus.PROCESSING]: 'Processing',
      [PaymentStatus.COMPLETED]: 'Completed',
      [PaymentStatus.FAILED]: 'Failed',
      [PaymentStatus.REFUNDED]: 'Refunded',
      [PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
    };
    return displayNames[status] || 'Unknown';
  }

  /**
   * Get quotation status display name
   */
  public static getQuotationStatusDisplayName(status: QuotationStatus): string {
    const displayNames: Record<QuotationStatus, string> = {
      [QuotationStatus.DRAFT]: 'Draft',
      [QuotationStatus.SENT]: 'Sent',
      [QuotationStatus.ACCEPTED]: 'Accepted',
      [QuotationStatus.REJECTED]: 'Rejected',
      [QuotationStatus.EXPIRED]: 'Expired',
    };
    return displayNames[status] || 'Unknown';
  }

  /**
   * Deep clone object
   */
  public static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    if (typeof obj === 'object') {
      const clonedObj = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
    
    return obj;
  }

  /**
   * Remove undefined values from object
   */
  public static removeUndefinedValues<T extends Record<string, any>>(obj: T): Partial<T> {
    const result: Partial<T> = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  /**
   * Convert object to query string
   */
  public static objectToQueryString(obj: Record<string, any>): string {
    const params = new URLSearchParams();
    for (const key in obj) {
      if (obj[key] !== undefined && obj[key] !== null) {
        params.append(key, String(obj[key]));
      }
    }
    return params.toString();
  }

  /**
   * Parse query string to object
   */
  public static queryStringToObject(queryString: string): Record<string, string> {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Generate random string
   */
  public static generateRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random number
   */
  public static generateRandomNumber(min: number = 0, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Sleep for specified milliseconds
   */
  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry function with exponential backoff
   */
  public static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, i);
        logger.warn(`Retry attempt ${i + 1} failed, retrying in ${delay}ms`, { error: lastError.message });
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Debounce function
   */
  public static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function
   */
  public static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Check if string is valid JSON
   */
  public static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safe JSON parse
   */
  public static safeJSONParse<T>(str: string, defaultValue: T): T {
    try {
      return JSON.parse(str);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Capitalize first letter
   */
  public static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Convert string to title case
   */
  public static toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Truncate string
   */
  public static truncate(str: string, length: number, suffix: string = '...'): string {
    if (str.length <= length) {
      return str;
    }
    return str.substring(0, length - suffix.length) + suffix;
  }

  /**
   * Generate slug from string
   */
  public static generateSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check if email is valid
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if phone number is valid
   */
  public static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Mask sensitive data
   */
  public static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }
    return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
  }

  /**
   * Generate pagination metadata
   */
  public static generatePaginationMetadata(
    page: number,
    limit: number,
    total: number
  ): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}

export default Helpers;
