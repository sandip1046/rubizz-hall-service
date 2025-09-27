import { config } from '@/config/config';
import { 
  CostCalculationRequest, 
  CostCalculationResponse, 
  CreateLineItemRequest,
  LineItemType,
  EventType 
} from '@/types';
import { logger } from './logger';

export class CostCalculator {
  /**
   * Calculate total cost for hall booking
   */
  public static calculateCost(request: CostCalculationRequest): CostCalculationResponse {
    try {
      const { hallId, eventDate, startTime, endTime, guestCount, lineItems, discount = 0 } = request;
      
      // Calculate base hall rental cost
      const baseAmount = this.calculateBaseHallCost(eventDate, startTime, endTime);
      
      // Process line items
      const processedLineItems = this.processLineItems(lineItems, guestCount);
      
      // Calculate subtotal
      const subtotal = baseAmount + processedLineItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      // Apply discount
      const discountAmount = (subtotal * discount) / 100;
      const discountedSubtotal = subtotal - discountAmount;
      
      // Calculate tax
      const taxAmount = (discountedSubtotal * config.costCalculator.taxPercentage) / 100;
      
      // Calculate total
      const totalAmount = discountedSubtotal + taxAmount;
      
      // Generate breakdown
      const breakdown = this.generateCostBreakdown(processedLineItems);
      
      return {
        baseAmount,
        lineItems: processedLineItems,
        subtotal,
        discount: discountAmount,
        taxAmount,
        totalAmount,
        breakdown,
      };
    } catch (error) {
      logger.error('Cost calculation failed:', error);
      throw new Error('Failed to calculate cost');
    }
  }

  /**
   * Calculate base hall rental cost
   */
  private static calculateBaseHallCost(eventDate: string, startTime: string, endTime: string): number {
    const eventDateTime = new Date(eventDate);
    const dayOfWeek = eventDateTime.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Calculate duration in hours
    const duration = this.calculateDuration(startTime, endTime);
    
    // Determine base rate
    let baseRate = config.costCalculator.baseHallRate;
    
    // Apply weekend surcharge if applicable
    if (isWeekend) {
      baseRate = baseRate * 1.5; // 50% weekend surcharge
    }
    
    // Calculate cost based on duration
    if (duration <= 4) {
      return baseRate; // Half day rate
    } else if (duration <= 8) {
      return baseRate * 1.5; // Full day rate
    } else {
      return baseRate * 2; // Extended day rate
    }
  }

  /**
   * Process and calculate line items
   */
  private static processLineItems(lineItems: CreateLineItemRequest[], guestCount: number): any[] {
    return lineItems.map(item => {
      let unitPrice = item.unitPrice;
      let quantity = item.quantity;
      
      // Apply guest count multipliers for certain items
      if (this.isGuestDependentItem(item.itemType)) {
        quantity = Math.max(quantity, guestCount);
      }
      
      // Apply dynamic pricing based on item type
      unitPrice = this.applyDynamicPricing(item.itemType, unitPrice, guestCount);
      
      const totalPrice = unitPrice * quantity;
      
      return {
        ...item,
        unitPrice,
        quantity,
        totalPrice,
      };
    });
  }

  /**
   * Check if item is guest-dependent
   */
  private static isGuestDependentItem(itemType: LineItemType): boolean {
    const guestDependentItems = [
      LineItemType.CHAIR,
      LineItemType.CATERING,
      LineItemType.CLEANING,
    ];
    return guestDependentItems.includes(itemType);
  }

  /**
   * Apply dynamic pricing based on item type and guest count
   */
  private static applyDynamicPricing(itemType: LineItemType, basePrice: number, guestCount: number): number {
    switch (itemType) {
      case LineItemType.CHAIR:
        return config.costCalculator.chairRate;
      
      case LineItemType.DECORATION:
        return config.costCalculator.decorationRate;
      
      case LineItemType.LIGHTING:
        return config.costCalculator.lightingRate;
      
      case LineItemType.AV_EQUIPMENT:
        return config.costCalculator.avRate;
      
      case LineItemType.CATERING:
        return config.costCalculator.cateringRatePerPerson;
      
      case LineItemType.SECURITY:
        return config.costCalculator.securityRate;
      
      case LineItemType.GENERATOR:
        return config.costCalculator.generatorRate;
      
      default:
        return basePrice;
    }
  }

  /**
   * Calculate duration between start and end time
   */
  private static calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return (endMinutes - startMinutes) / 60;
  }

  /**
   * Generate cost breakdown by category
   */
  private static generateCostBreakdown(lineItems: any[]): any {
    const breakdown = {
      hallRental: 0,
      chairs: 0,
      tables: 0,
      decoration: 0,
      lighting: 0,
      avEquipment: 0,
      catering: 0,
      security: 0,
      generator: 0,
      cleaning: 0,
      parking: 0,
      other: 0,
    };

    lineItems.forEach(item => {
      switch (item.itemType) {
        case LineItemType.HALL_RENTAL:
          breakdown.hallRental += item.totalPrice;
          break;
        case LineItemType.CHAIR:
          breakdown.chairs += item.totalPrice;
          break;
        case LineItemType.TABLE:
          breakdown.tables += item.totalPrice;
          break;
        case LineItemType.DECORATION:
          breakdown.decoration += item.totalPrice;
          break;
        case LineItemType.LIGHTING:
          breakdown.lighting += item.totalPrice;
          break;
        case LineItemType.AV_EQUIPMENT:
          breakdown.avEquipment += item.totalPrice;
          break;
        case LineItemType.CATERING:
          breakdown.catering += item.totalPrice;
          break;
        case LineItemType.SECURITY:
          breakdown.security += item.totalPrice;
          break;
        case LineItemType.GENERATOR:
          breakdown.generator += item.totalPrice;
          break;
        case LineItemType.CLEANING:
          breakdown.cleaning += item.totalPrice;
          break;
        case LineItemType.PARKING:
          breakdown.parking += item.totalPrice;
          break;
        default:
          breakdown.other += item.totalPrice;
      }
    });

    return breakdown;
  }

  /**
   * Generate quotation number
   */
  public static generateQuotationNumber(): string {
    const prefix = 'QUO';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Calculate deposit amount
   */
  public static calculateDepositAmount(totalAmount: number): number {
    return Math.round((totalAmount * config.business.depositPercentage) / 100);
  }

  /**
   * Calculate refund amount based on cancellation policy
   */
  public static calculateRefundAmount(
    totalAmount: number, 
    paidAmount: number, 
    cancellationHours: number,
    eventDate: Date
  ): number {
    const now = new Date();
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilEvent < 0) {
      return 0; // Event has passed
    }
    
    if (hoursUntilEvent >= 72) {
      // More than 72 hours: 90% refund
      return Math.round(paidAmount * 0.9);
    } else if (hoursUntilEvent >= 24) {
      // 24-72 hours: 50% refund
      return Math.round(paidAmount * 0.5);
    } else if (hoursUntilEvent >= 12) {
      // 12-24 hours: 25% refund
      return Math.round(paidAmount * 0.25);
    } else {
      // Less than 12 hours: No refund
      return 0;
    }
  }

  /**
   * Validate cost calculation request
   */
  public static validateCostRequest(request: CostCalculationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!request.hallId) {
      errors.push('Hall ID is required');
    }
    
    if (!request.eventDate) {
      errors.push('Event date is required');
    } else {
      const eventDate = new Date(request.eventDate);
      const now = new Date();
      if (eventDate < now) {
        errors.push('Event date cannot be in the past');
      }
    }
    
    if (!request.startTime || !request.endTime) {
      errors.push('Start time and end time are required');
    } else {
      const duration = this.calculateDuration(request.startTime, request.endTime);
      if (duration <= 0) {
        errors.push('End time must be after start time');
      }
      if (duration > 24) {
        errors.push('Event duration cannot exceed 24 hours');
      }
    }
    
    if (!request.guestCount || request.guestCount <= 0) {
      errors.push('Guest count must be greater than 0');
    }
    
    if (!request.lineItems || request.lineItems.length === 0) {
      errors.push('At least one line item is required');
    }
    
    if (request.discount && (request.discount < 0 || request.discount > 100)) {
      errors.push('Discount must be between 0 and 100 percent');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default line items for event type
   */
  public static getDefaultLineItems(eventType: EventType, guestCount: number): CreateLineItemRequest[] {
    const baseItems: CreateLineItemRequest[] = [
      {
        itemType: LineItemType.HALL_RENTAL,
        itemName: 'Hall Rental',
        quantity: 1,
        unitPrice: config.costCalculator.baseHallRate,
      },
    ];

    // Add chairs based on guest count
    if (guestCount > 0) {
      baseItems.push({
        itemType: LineItemType.CHAIR,
        itemName: 'Chairs',
        quantity: guestCount,
        unitPrice: config.costCalculator.chairRate,
      });
    }

    // Add event-specific items
    switch (eventType) {
      case EventType.WEDDING:
        baseItems.push(
          {
            itemType: LineItemType.DECORATION,
            itemName: 'Wedding Decoration Package',
            quantity: 1,
            unitPrice: config.costCalculator.decorationRate * 2,
          },
          {
            itemType: LineItemType.LIGHTING,
            itemName: 'Wedding Lighting',
            quantity: 1,
            unitPrice: config.costCalculator.lightingRate * 1.5,
          },
          {
            itemType: LineItemType.CATERING,
            itemName: 'Wedding Catering',
            quantity: guestCount,
            unitPrice: config.costCalculator.cateringRatePerPerson * 1.2,
          }
        );
        break;
      
      case EventType.CORPORATE:
      case EventType.CONFERENCE:
      case EventType.SEMINAR:
        baseItems.push(
          {
            itemType: LineItemType.AV_EQUIPMENT,
            itemName: 'AV Equipment Package',
            quantity: 1,
            unitPrice: config.costCalculator.avRate,
          },
          {
            itemType: LineItemType.TABLE,
            itemName: 'Conference Tables',
            quantity: Math.ceil(guestCount / 6),
            unitPrice: 200,
          }
        );
        break;
      
      case EventType.BIRTHDAY:
      case EventType.PARTY:
        baseItems.push(
          {
            itemType: LineItemType.DECORATION,
            itemName: 'Party Decoration',
            quantity: 1,
            unitPrice: config.costCalculator.decorationRate,
          },
          {
            itemType: LineItemType.CATERING,
            itemName: 'Party Catering',
            quantity: guestCount,
            unitPrice: config.costCalculator.cateringRatePerPerson,
          }
        );
        break;
    }

    // Add common items for larger events
    if (guestCount > 50) {
      baseItems.push(
        {
          itemType: LineItemType.SECURITY,
          itemName: 'Security',
          quantity: 1,
          unitPrice: config.costCalculator.securityRate,
        }
      );
    }

    if (guestCount > 100) {
      baseItems.push(
        {
          itemType: LineItemType.GENERATOR,
          itemName: 'Backup Generator',
          quantity: 1,
          unitPrice: config.costCalculator.generatorRate,
        }
      );
    }

    return baseItems;
  }
}

export default CostCalculator;
