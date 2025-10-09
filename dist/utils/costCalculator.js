"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostCalculator = void 0;
const config_1 = require("@/config/config");
const types_1 = require("@/types");
const logger_1 = require("./logger");
class CostCalculator {
    static calculateCost(request) {
        try {
            const { hallId, eventDate, startTime, endTime, guestCount, lineItems, discount = 0 } = request;
            const baseAmount = this.calculateBaseHallCost(eventDate, startTime, endTime);
            const processedLineItems = this.processLineItems(lineItems, guestCount);
            const subtotal = baseAmount + processedLineItems.reduce((sum, item) => sum + item.totalPrice, 0);
            const discountAmount = (subtotal * discount) / 100;
            const discountedSubtotal = subtotal - discountAmount;
            const taxAmount = (discountedSubtotal * config_1.config.costCalculator.taxPercentage) / 100;
            const totalAmount = discountedSubtotal + taxAmount;
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
        }
        catch (error) {
            logger_1.logger.error('Cost calculation failed:', error);
            throw new Error('Failed to calculate cost');
        }
    }
    static calculateBaseHallCost(eventDate, startTime, endTime) {
        const eventDateTime = new Date(eventDate);
        const dayOfWeek = eventDateTime.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const duration = this.calculateDuration(startTime, endTime);
        let baseRate = config_1.config.costCalculator.baseHallRate;
        if (isWeekend) {
            baseRate = baseRate * 1.5;
        }
        if (duration <= 4) {
            return baseRate;
        }
        else if (duration <= 8) {
            return baseRate * 1.5;
        }
        else {
            return baseRate * 2;
        }
    }
    static processLineItems(lineItems, guestCount) {
        return lineItems.map(item => {
            let unitPrice = item.unitPrice;
            let quantity = item.quantity;
            if (this.isGuestDependentItem(item.itemType)) {
                quantity = Math.max(quantity, guestCount);
            }
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
    static isGuestDependentItem(itemType) {
        const guestDependentItems = [
            types_1.LineItemType.CHAIR,
            types_1.LineItemType.CATERING,
            types_1.LineItemType.CLEANING,
        ];
        return guestDependentItems.includes(itemType);
    }
    static applyDynamicPricing(itemType, basePrice, guestCount) {
        switch (itemType) {
            case types_1.LineItemType.CHAIR:
                return config_1.config.costCalculator.chairRate;
            case types_1.LineItemType.DECORATION:
                return config_1.config.costCalculator.decorationRate;
            case types_1.LineItemType.LIGHTING:
                return config_1.config.costCalculator.lightingRate;
            case types_1.LineItemType.AV_EQUIPMENT:
                return config_1.config.costCalculator.avRate;
            case types_1.LineItemType.CATERING:
                return config_1.config.costCalculator.cateringRatePerPerson;
            case types_1.LineItemType.SECURITY:
                return config_1.config.costCalculator.securityRate;
            case types_1.LineItemType.GENERATOR:
                return config_1.config.costCalculator.generatorRate;
            default:
                return basePrice;
        }
    }
    static calculateDuration(startTime, endTime) {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) {
            throw new Error('Invalid time format');
        }
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return (endMinutes - startMinutes) / 60;
    }
    static generateCostBreakdown(lineItems) {
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
                case types_1.LineItemType.HALL_RENTAL:
                    breakdown.hallRental += item.totalPrice;
                    break;
                case types_1.LineItemType.CHAIR:
                    breakdown.chairs += item.totalPrice;
                    break;
                case types_1.LineItemType.TABLE:
                    breakdown.tables += item.totalPrice;
                    break;
                case types_1.LineItemType.DECORATION:
                    breakdown.decoration += item.totalPrice;
                    break;
                case types_1.LineItemType.LIGHTING:
                    breakdown.lighting += item.totalPrice;
                    break;
                case types_1.LineItemType.AV_EQUIPMENT:
                    breakdown.avEquipment += item.totalPrice;
                    break;
                case types_1.LineItemType.CATERING:
                    breakdown.catering += item.totalPrice;
                    break;
                case types_1.LineItemType.SECURITY:
                    breakdown.security += item.totalPrice;
                    break;
                case types_1.LineItemType.GENERATOR:
                    breakdown.generator += item.totalPrice;
                    break;
                case types_1.LineItemType.CLEANING:
                    breakdown.cleaning += item.totalPrice;
                    break;
                case types_1.LineItemType.PARKING:
                    breakdown.parking += item.totalPrice;
                    break;
                default:
                    breakdown.other += item.totalPrice;
            }
        });
        return breakdown;
    }
    static generateQuotationNumber() {
        const prefix = 'QUO';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `${prefix}${timestamp}${random}`;
    }
    static calculateDepositAmount(totalAmount) {
        return Math.round((totalAmount * config_1.config.business.depositPercentage) / 100);
    }
    static calculateRefundAmount(totalAmount, paidAmount, cancellationHours, eventDate) {
        const now = new Date();
        const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilEvent < 0) {
            return 0;
        }
        if (hoursUntilEvent >= 72) {
            return Math.round(paidAmount * 0.9);
        }
        else if (hoursUntilEvent >= 24) {
            return Math.round(paidAmount * 0.5);
        }
        else if (hoursUntilEvent >= 12) {
            return Math.round(paidAmount * 0.25);
        }
        else {
            return 0;
        }
    }
    static validateCostRequest(request) {
        const errors = [];
        if (!request.hallId) {
            errors.push('Hall ID is required');
        }
        if (!request.eventDate) {
            errors.push('Event date is required');
        }
        else {
            const eventDate = new Date(request.eventDate);
            const now = new Date();
            if (eventDate < now) {
                errors.push('Event date cannot be in the past');
            }
        }
        if (!request.startTime || !request.endTime) {
            errors.push('Start time and end time are required');
        }
        else {
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
    static getDefaultLineItems(eventType, guestCount) {
        const baseItems = [
            {
                itemType: types_1.LineItemType.HALL_RENTAL,
                itemName: 'Hall Rental',
                description: 'Basic hall rental for the event',
                quantity: 1,
                unitPrice: config_1.config.costCalculator.baseHallRate,
            },
        ];
        if (guestCount > 0) {
            baseItems.push({
                itemType: types_1.LineItemType.CHAIR,
                itemName: 'Chairs',
                description: 'Chairs for guests',
                quantity: guestCount,
                unitPrice: config_1.config.costCalculator.chairRate,
            });
        }
        switch (eventType) {
            case types_1.EventType.WEDDING:
                baseItems.push({
                    itemType: types_1.LineItemType.DECORATION,
                    itemName: 'Wedding Decoration Package',
                    description: 'Complete wedding decoration package',
                    quantity: 1,
                    unitPrice: config_1.config.costCalculator.decorationRate * 2,
                }, {
                    itemType: types_1.LineItemType.LIGHTING,
                    itemName: 'Wedding Lighting',
                    description: 'Wedding lighting setup',
                    quantity: 1,
                    unitPrice: config_1.config.costCalculator.lightingRate * 1.5,
                }, {
                    itemType: types_1.LineItemType.CATERING,
                    itemName: 'Wedding Catering',
                    description: 'Wedding catering service',
                    quantity: guestCount,
                    unitPrice: config_1.config.costCalculator.cateringRatePerPerson * 1.2,
                });
                break;
            case types_1.EventType.CORPORATE:
            case types_1.EventType.CONFERENCE:
            case types_1.EventType.SEMINAR:
                baseItems.push({
                    itemType: types_1.LineItemType.AV_EQUIPMENT,
                    itemName: 'AV Equipment Package',
                    description: 'Audio-visual equipment for corporate events',
                    quantity: 1,
                    unitPrice: config_1.config.costCalculator.avRate,
                }, {
                    itemType: types_1.LineItemType.TABLE,
                    itemName: 'Conference Tables',
                    description: 'Conference tables for corporate events',
                    quantity: Math.ceil(guestCount / 6),
                    unitPrice: 200,
                });
                break;
            case types_1.EventType.BIRTHDAY:
            case types_1.EventType.PARTY:
                baseItems.push({
                    itemType: types_1.LineItemType.DECORATION,
                    itemName: 'Party Decoration',
                    description: 'Party decoration setup',
                    quantity: 1,
                    unitPrice: config_1.config.costCalculator.decorationRate,
                }, {
                    itemType: types_1.LineItemType.CATERING,
                    itemName: 'Party Catering',
                    description: 'Party catering service',
                    quantity: guestCount,
                    unitPrice: config_1.config.costCalculator.cateringRatePerPerson,
                });
                break;
        }
        if (guestCount > 50) {
            baseItems.push({
                itemType: types_1.LineItemType.SECURITY,
                itemName: 'Security',
                description: 'Security services for large events',
                quantity: 1,
                unitPrice: config_1.config.costCalculator.securityRate,
            });
        }
        if (guestCount > 100) {
            baseItems.push({
                itemType: types_1.LineItemType.GENERATOR,
                itemName: 'Backup Generator',
                description: 'Backup generator for large events',
                quantity: 1,
                unitPrice: config_1.config.costCalculator.generatorRate,
            });
        }
        return baseItems;
    }
}
exports.CostCalculator = CostCalculator;
exports.default = CostCalculator;
//# sourceMappingURL=costCalculator.js.map