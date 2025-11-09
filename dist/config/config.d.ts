export declare const config: {
    server: {
        port: any;
        nodeEnv: any;
        serviceName: any;
        serviceVersion: any;
    };
    database: {
        url: any;
    };
    redisService: {
        url: any;
        timeout: number;
        retries: number;
        retryDelay: number;
    };
    jwt: {
        secret: any;
        expiresIn: any;
        refreshSecret: any;
        refreshExpiresIn: any;
    };
    apiGateway: {
        url: any;
        secret: any;
    };
    services: {
        auth: any;
        user: any;
        customer: any;
        notification: any;
        mailService: any;
    };
    rateLimit: {
        windowMs: any;
        maxRequests: any;
    };
    logging: {
        level: any;
        file: any;
    };
    business: {
        currency: any;
        timezone: any;
        bookingAdvanceDays: any;
        cancellationHours: any;
        depositPercentage: any;
    };
    costCalculator: {
        baseHallRate: any;
        chairRate: any;
        decorationRate: any;
        lightingRate: any;
        avRate: any;
        cateringRatePerPerson: any;
        securityRate: any;
        generatorRate: any;
        taxPercentage: any;
    };
    upload: {
        maxFileSize: any;
        allowedTypes: any;
        uploadPath: any;
    };
    monitoring: {
        healthCheckInterval: any;
        metricsEnabled: any;
        tracingEnabled: any;
    };
    grpc: {
        enabled: any;
        port: any;
        host: any;
        timeout: any;
        retries: any;
        retryDelay: any;
    };
    kafka: {
        enabled: any;
        brokers: any;
        clientId: any;
        groupId: any;
        retryAttempts: any;
        retryDelay: any;
        sessionTimeout: any;
        heartbeatInterval: any;
        topics: {
            events: any;
            notifications: any;
        };
    };
    websocket: {
        enabled: any;
        path: any;
        pingInterval: any;
        pongTimeout: any;
        authentication: any;
    };
};
export default config;
//# sourceMappingURL=config.d.ts.map