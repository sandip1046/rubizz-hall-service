import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare class ValidationMiddleware {
    static validateBody(schema: Joi.ObjectSchema): (req: Request, res: Response, next: NextFunction) => void;
    static validateQuery(schema: Joi.ObjectSchema): (req: Request, res: Response, next: NextFunction) => void;
    static validateParams(schema: Joi.ObjectSchema): (req: Request, res: Response, next: NextFunction) => void;
    static validateFile(options?: {
        maxSize?: number;
        allowedTypes?: string[];
        required?: boolean;
    }): (req: Request, res: Response, next: NextFunction) => void;
    static validatePagination: (req: Request, res: Response, next: NextFunction) => void;
    static validateUuid(field?: string): (req: Request, res: Response, next: NextFunction) => void;
    static validateDateRange: (req: Request, res: Response, next: NextFunction) => void;
    static validateSearchFilters: (req: Request, res: Response, next: NextFunction) => void;
}
export declare const ValidationSchemas: {
    createHall: Joi.ObjectSchema<any>;
    updateHall: Joi.ObjectSchema<any>;
    createBooking: Joi.ObjectSchema<any>;
    updateBooking: Joi.ObjectSchema<any>;
    createQuotation: Joi.ObjectSchema<any>;
    updateQuotation: Joi.ObjectSchema<any>;
    createLineItem: Joi.ObjectSchema<any>;
    createPayment: Joi.ObjectSchema<any>;
    createAvailability: Joi.ObjectSchema<any>;
};
export default ValidationMiddleware;
//# sourceMappingURL=ValidationMiddleware.d.ts.map