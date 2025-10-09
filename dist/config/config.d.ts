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
    redisSession: {
        url: any;
        host: any;
        port: any;
        password: any;
        username: any;
        tls: any;
        db: any;
    };
    redisCache: {
        url: any;
        host: any;
        port: any;
        password: any;
        username: any;
        tls: any;
        db: any;
    };
    redisQueue: {
        url: any;
        host: any;
        port: any;
        password: any;
        username: any;
        tls: any;
        db: any;
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
    };
    email: {
        smtp: {
            host: any;
            port: any;
            auth: {
                user: any;
                pass: any;
            };
        };
        brevo: {
            host: any;
            port: any;
            auth: {
                user: any;
                pass: any;
            };
        };
        from: {
            email: any;
            name: any;
        };
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
};
export default config;
//# sourceMappingURL=config.d.ts.map