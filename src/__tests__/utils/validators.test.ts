import { Validators } from '@/utils/validators';
import { EventType, LineItemType } from '@/types';

describe('Validators', () => {
  describe('validateCreateHall', () => {
    it('should validate correct hall data', () => {
      const data = {
        name: 'Grand Hall',
        capacity: 200,
        location: 'Main Building',
        baseRate: 5000,
      };

      const result = Validators.validateCreateHall(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid hall data', () => {
      const data = {
        name: '',
        capacity: 0,
        location: '',
        baseRate: -100,
      };

      const result = Validators.validateCreateHall(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCreateBooking', () => {
    it('should validate correct booking data', () => {
      const data = {
        hallId: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        eventName: 'Wedding Reception',
        eventType: EventType.WEDDING,
        startDate: '2024-12-31',
        endDate: '2024-12-31',
        startTime: '18:00',
        endTime: '23:00',
        guestCount: 100,
      };

      const result = Validators.validateCreateBooking(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid booking data', () => {
      const data = {
        hallId: 'invalid-uuid',
        customerId: '',
        eventName: '',
        eventType: 'INVALID_TYPE',
        startDate: '2020-01-01', // Past date
        endDate: '2020-01-01',
        startTime: '23:00',
        endTime: '18:00', // End before start
        guestCount: 0,
      };

      const result = Validators.validateCreateBooking(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCreateQuotation', () => {
    it('should validate correct quotation data', () => {
      const data = {
        hallId: '123e4567-e89b-12d3-a456-426614174000',
        customerId: '123e4567-e89b-12d3-a456-426614174001',
        eventName: 'Corporate Event',
        eventType: EventType.CORPORATE,
        eventDate: '2024-12-31',
        startTime: '09:00',
        endTime: '17:00',
        guestCount: 50,
        lineItems: [
          {
            itemType: LineItemType.HALL_RENTAL,
            itemName: 'Hall Rental',
            quantity: 1,
            unitPrice: 5000,
          },
        ],
      };

      const result = Validators.validateCreateQuotation(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid quotation data', () => {
      const data = {
        hallId: '',
        customerId: '',
        eventName: '',
        eventType: 'INVALID_TYPE',
        eventDate: '2020-01-01', // Past date
        startTime: '17:00',
        endTime: '09:00', // End before start
        guestCount: 0,
        lineItems: [], // Empty line items
      };

      const result = Validators.validateCreateQuotation(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateLineItem', () => {
    it('should validate correct line item data', () => {
      const data = {
        itemType: LineItemType.CHAIR,
        itemName: 'Chairs',
        quantity: 50,
        unitPrice: 50,
      };

      const result = Validators.validateLineItem(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid line item data', () => {
      const data = {
        itemType: 'INVALID_TYPE',
        itemName: '',
        quantity: 0,
        unitPrice: -10,
      };

      const result = Validators.validateLineItem(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      const result = Validators.isValidUUID(validUUID);

      expect(result).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidUUID = 'not-a-uuid';
      const result = Validators.isValidUUID(invalidUUID);

      expect(result).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      const validEmail = 'test@example.com';
      const result = Validators.isValidEmail(validEmail);

      expect(result).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidEmail = 'not-an-email';
      const result = Validators.isValidEmail(invalidEmail);

      expect(result).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone number', () => {
      const validPhone = '+1234567890';
      const result = Validators.isValidPhone(validPhone);

      expect(result).toBe(true);
    });

    it('should reject invalid phone number', () => {
      const invalidPhone = 'not-a-phone';
      const result = Validators.isValidPhone(invalidPhone);

      expect(result).toBe(false);
    });
  });

  describe('validatePagination', () => {
    it('should validate correct pagination parameters', () => {
      const result = Validators.validatePagination(1, 10);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid pagination parameters', () => {
      const result = Validators.validatePagination(0, 200);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateDateRange', () => {
    it('should validate correct date range', () => {
      const result = Validators.validateDateRange('2024-01-01', '2024-12-31');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid date range', () => {
      const result = Validators.validateDateRange('2024-12-31', '2024-01-01');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
