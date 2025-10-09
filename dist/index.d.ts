import express from 'express';
declare class HallService {
    private app;
    private server;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private setupApiRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    private setupGracefulShutdown;
    getApp(): express.Application;
    getServer(): any;
}
declare const hallService: HallService;
export default hallService;
//# sourceMappingURL=index.d.ts.map