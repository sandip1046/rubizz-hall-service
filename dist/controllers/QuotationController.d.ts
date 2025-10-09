import { Request, Response, NextFunction } from 'express';
export declare class QuotationController {
    private quotationService;
    constructor();
    createQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getQuotationById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getQuotationByNumber: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getQuotations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    acceptQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    rejectQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    expireQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    sendQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    calculateCost: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getQuotationStatistics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCustomerQuotations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHallQuotations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static routes(): any;
}
export default QuotationController;
//# sourceMappingURL=QuotationController.d.ts.map