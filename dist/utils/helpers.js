"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Helpers = void 0;
const types_1 = require("@/types");
const logger_1 = require("./logger");
class Helpers {
    static generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    static generateBookingReference() {
        const prefix = 'BK';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }
    static generatePaymentReference() {
        const prefix = 'PAY';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }
    static formatCurrency(amount, currency = 'INR') {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }
    static formatDate(date, format = 'short') {
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
    static getTimeDifferenceInHours(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) {
            throw new Error('Invalid time format');
        }
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return (endMinutes - startMinutes) / 60;
    }
    static isWeekend(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const dayOfWeek = dateObj.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
    static isToday(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        return dateObj.toDateString() === today.toDateString();
    }
    static isPastDate(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        return dateObj < now;
    }
    static addDays(date, days) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const result = new Date(dateObj);
        result.setDate(result.getDate() + days);
        return result;
    }
    static getStartOfDay(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const result = new Date(dateObj);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    static getEndOfDay(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const result = new Date(dateObj);
        result.setHours(23, 59, 59, 999);
        return result;
    }
    static timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        if (hours === undefined || minutes === undefined) {
            throw new Error('Invalid time format');
        }
        return hours * 60 + minutes;
    }
    static minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    static isWithinBusinessHours(time, startHour = 6, endHour = 22) {
        const [hours] = time.split(':').map(Number);
        if (hours === undefined) {
            throw new Error('Invalid time format');
        }
        return hours >= startHour && hours < endHour;
    }
    static getEventTypeDisplayName(eventType) {
        const displayNames = {
            [types_1.EventType.WEDDING]: 'Wedding',
            [types_1.EventType.CORPORATE]: 'Corporate Event',
            [types_1.EventType.BIRTHDAY]: 'Birthday Party',
            [types_1.EventType.ANNIVERSARY]: 'Anniversary',
            [types_1.EventType.CONFERENCE]: 'Conference',
            [types_1.EventType.SEMINAR]: 'Seminar',
            [types_1.EventType.PARTY]: 'Party',
            [types_1.EventType.MEETING]: 'Meeting',
            [types_1.EventType.OTHER]: 'Other',
        };
        return displayNames[eventType] || 'Unknown';
    }
    static getBookingStatusDisplayName(status) {
        const displayNames = {
            [types_1.BookingStatus.PENDING]: 'Pending',
            [types_1.BookingStatus.CONFIRMED]: 'Confirmed',
            [types_1.BookingStatus.CHECKED_IN]: 'Checked In',
            [types_1.BookingStatus.COMPLETED]: 'Completed',
            [types_1.BookingStatus.CANCELLED]: 'Cancelled',
            [types_1.BookingStatus.NO_SHOW]: 'No Show',
        };
        return displayNames[status] || 'Unknown';
    }
    static getPaymentStatusDisplayName(status) {
        const displayNames = {
            [types_1.PaymentStatus.PENDING]: 'Pending',
            [types_1.PaymentStatus.PROCESSING]: 'Processing',
            [types_1.PaymentStatus.COMPLETED]: 'Completed',
            [types_1.PaymentStatus.FAILED]: 'Failed',
            [types_1.PaymentStatus.REFUNDED]: 'Refunded',
            [types_1.PaymentStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
        };
        return displayNames[status] || 'Unknown';
    }
    static getQuotationStatusDisplayName(status) {
        const displayNames = {
            [types_1.QuotationStatus.DRAFT]: 'Draft',
            [types_1.QuotationStatus.SENT]: 'Sent',
            [types_1.QuotationStatus.ACCEPTED]: 'Accepted',
            [types_1.QuotationStatus.REJECTED]: 'Rejected',
            [types_1.QuotationStatus.EXPIRED]: 'Expired',
        };
        return displayNames[status] || 'Unknown';
    }
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
        return obj;
    }
    static removeUndefinedValues(obj) {
        const result = {};
        for (const key in obj) {
            if (obj[key] !== undefined) {
                result[key] = obj[key];
            }
        }
        return result;
    }
    static objectToQueryString(obj) {
        const params = new URLSearchParams();
        for (const key in obj) {
            if (obj[key] !== undefined && obj[key] !== null) {
                params.append(key, String(obj[key]));
            }
        }
        return params.toString();
    }
    static queryStringToObject(queryString) {
        const params = new URLSearchParams(queryString);
        const result = {};
        for (const [key, value] of params.entries()) {
            result[key] = value;
        }
        return result;
    }
    static generateRandomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    static generateRandomNumber(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static async retry(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (i === maxRetries) {
                    throw lastError;
                }
                const delay = baseDelay * Math.pow(2, i);
                logger_1.logger.warn(`Retry attempt ${i + 1} failed, retrying in ${delay}ms`, { error: lastError.message });
                await this.sleep(delay);
            }
        }
        throw lastError;
    }
    static debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    static throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    static isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        }
        catch {
            return false;
        }
    }
    static safeJSONParse(str, defaultValue) {
        try {
            return JSON.parse(str);
        }
        catch {
            return defaultValue;
        }
    }
    static capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    static toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
    }
    static truncate(str, length, suffix = '...') {
        if (str.length <= length) {
            return str;
        }
        return str.substring(0, length - suffix.length) + suffix;
    }
    static generateSlug(str) {
        return str
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    static maskSensitiveData(data, visibleChars = 4) {
        if (data.length <= visibleChars) {
            return '*'.repeat(data.length);
        }
        return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
    }
    static generatePaginationMetadata(page, limit, total) {
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
exports.Helpers = Helpers;
exports.default = Helpers;
//# sourceMappingURL=helpers.js.map