import { Request, Response } from 'express';
export declare class HealthController {
    static health(req: Request, res: Response): Promise<void>;
    static healthDetailed(req: Request, res: Response): Promise<void>;
    static ready(req: Request, res: Response): Promise<void>;
    static live(req: Request, res: Response): Promise<void>;
    static metrics(req: Request, res: Response): Promise<void>;
    private static checkDatabase;
    private static checkRedis;
    private static checkExternalServices;
    private static isServiceReady;
}
export default HealthController;
//# sourceMappingURL=HealthController.d.ts.map