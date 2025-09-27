import { CostCalculator } from '@/utils/costCalculator';
import { EventType, LineItemType } from '@/types';

describe('CostCalculator', () => {
  describe('calculateCost', () => {
    it('should calculate cost correctly for basic hall rental', () => {
      const request = {
        hallId: 'test-hall-id',
        eventDate: '2024-12-31',
        startTime: '10:00',
        endTime: '18:00',
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

      const result = CostCalculator.calculateCost(request);

      expect(result).toHaveProperty('baseAmount');
      expect(result).toHaveProperty('subtotal');
      expect(result).toHaveProperty('taxAmount');
      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('breakdown');
      expect(result.totalAmount).toBeGreaterThan(0);
    });

    it('should apply weekend surcharge for weekend events', () => {
      const request = {
        hallId: 'test-hall-id',
        eventDate: '2024-12-28', // Saturday
        startTime: '10:00',
        endTime: '18:00',
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

      const result = CostCalculator.calculateCost(request);

      expect(result.baseAmount).toBeGreaterThan(5000); // Should have weekend surcharge
    });

    it('should calculate cost with multiple line items', () => {
      const request = {
        hallId: 'test-hall-id',
        eventDate: '2024-12-31',
        startTime: '10:00',
        endTime: '18:00',
        guestCount: 50,
        lineItems: [
          {
            itemType: LineItemType.HALL_RENTAL,
            itemName: 'Hall Rental',
            quantity: 1,
            unitPrice: 5000,
          },
          {
            itemType: LineItemType.CHAIR,
            itemName: 'Chairs',
            quantity: 50,
            unitPrice: 50,
          },
          {
            itemType: LineItemType.CATERING,
            itemName: 'Catering',
            quantity: 50,
            unitPrice: 300,
          },
        ],
      };

      const result = CostCalculator.calculateCost(request);

      expect(result.lineItems).toHaveLength(3);
      expect(result.totalAmount).toBeGreaterThan(result.baseAmount);
    });

    it('should apply discount correctly', () => {
      const request = {
        hallId: 'test-hall-id',
        eventDate: '2024-12-31',
        startTime: '10:00',
        endTime: '18:00',
        guestCount: 50,
        lineItems: [
          {
            itemType: LineItemType.HALL_RENTAL,
            itemName: 'Hall Rental',
            quantity: 1,
            unitPrice: 5000,
          },
        ],
        discount: 10,
      };

      const result = CostCalculator.calculateCost(request);

      expect(result.discount).toBeGreaterThan(0);
      expect(result.totalAmount).toBeLessThan(result.subtotal);
    });
  });

  describe('generateQuotationNumber', () => {
    it('should generate unique quotation numbers', () => {
      const number1 = CostCalculator.generateQuotationNumber();
      const number2 = CostCalculator.generateQuotationNumber();

      expect(number1).toMatch(/^QUO\d{8}[A-Z0-9]{4}$/);
      expect(number2).toMatch(/^QUO\d{8}[A-Z0-9]{4}$/);
      expect(number1).not.toBe(number2);
    });
  });

  describe('calculateDepositAmount', () => {
    it('should calculate deposit amount correctly', () => {
      const totalAmount = 10000;
      const depositAmount = CostCalculator.calculateDepositAmount(totalAmount);

      expect(depositAmount).toBe(2000); // 20% of 10000
    });
  });

  describe('calculateRefundAmount', () => {
    it('should calculate refund amount based on cancellation time', () => {
      const totalAmount = 10000;
      const paidAmount = 10000;
      const eventDate = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now

      const refundAmount = CostCalculator.calculateRefundAmount(
        totalAmount,
        paidAmount,
        24,
        eventDate
      );

      expect(refundAmount).toBe(5000); // 50% refund for 24-72 hours
    });

    it('should return 0 refund for events less than 12 hours away', () => {
      const totalAmount = 10000;
      const paidAmount = 10000;
      const eventDate = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours from now

      const refundAmount = CostCalculator.calculateRefundAmount(
        totalAmount,
        paidAmount,
        24,
        eventDate
      );

      expect(refundAmount).toBe(0);
    });
  });

  describe('validateCostRequest', () => {
    it('should validate correct cost request', () => {
      const request = {
        hallId: 'test-hall-id',
        eventDate: '2024-12-31',
        startTime: '10:00',
        endTime: '18:00',
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

      const result = CostCalculator.validateCostRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid cost request', () => {
      const request = {
        hallId: '',
        eventDate: '2020-01-01', // Past date
        startTime: '18:00',
        endTime: '10:00', // End before start
        guestCount: 0,
        lineItems: [],
      };

      const result = CostCalculator.validateCostRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultLineItems', () => {
    it('should generate default line items for wedding', () => {
      const lineItems = CostCalculator.getDefaultLineItems(EventType.WEDDING, 100);

      expect(lineItems.length).toBeGreaterThan(1);
      expect(lineItems[0].itemType).toBe(LineItemType.HALL_RENTAL);
      expect(lineItems.some(item => item.itemType === LineItemType.CHAIR)).toBe(true);
      expect(lineItems.some(item => item.itemType === LineItemType.DECORATION)).toBe(true);
    });

    it('should generate default line items for corporate event', () => {
      const lineItems = CostCalculator.getDefaultLineItems(EventType.CORPORATE, 50);

      expect(lineItems.length).toBeGreaterThan(1);
      expect(lineItems[0].itemType).toBe(LineItemType.HALL_RENTAL);
      expect(lineItems.some(item => item.itemType === LineItemType.AV_EQUIPMENT)).toBe(true);
    });
  });
});
