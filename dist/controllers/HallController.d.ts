import { Request, Response, NextFunction } from 'express';
export declare class HallController {
    private hallService;
    constructor();
    createHall: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHallById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHalls: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateHall: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    deleteHall: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    checkAvailability: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHallWithRelations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    searchHalls: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHallStatistics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static routes(): any;
}
export default HallController;
//# sourceMappingURL=HallController.d.ts.map