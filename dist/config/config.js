"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const joi_1 = __importDefault(require("joi"));
dotenv_1.default.config();
const envSchema = joi_1.default.object({
    PORT: joi_1.default.number().default(3007),
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    SERVICE_NAME: joi_1.default.string().default('rubizz-hall-service'),
    SERVICE_VERSION: joi_1.default.string().default('1.0.0'),
    DATABASE_URL: joi_1.default.string().required(),
    REDIS_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3000/api/v1/redis'),
    REDIS_SERVICE_TIMEOUT: joi_1.default.number().default(30000),
    REDIS_SERVICE_RETRIES: joi_1.default.number().default(3),
    REDIS_SERVICE_RETRY_DELAY: joi_1.default.number().default(1000),
    JWT_SECRET: joi_1.default.string().min(32).required(),
    JWT_EXPIRES_IN: joi_1.default.string().default('24h'),
    JWT_REFRESH_SECRET: joi_1.default.string().min(32).required(),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
    API_GATEWAY_URL: joi_1.default.string().uri().default('http://localhost:3000'),
    API_GATEWAY_SECRET: joi_1.default.string().min(16).required(),
    AUTH_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3001'),
    USER_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3002'),
    CUSTOMER_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3003'),
    NOTIFICATION_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3010'),
    MAIL_SERVICE_URL: joi_1.default.string().uri().default('http://localhost:3010'),
    RATE_LIMIT_WINDOW_MS: joi_1.default.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: joi_1.default.number().default(100),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FILE: joi_1.default.string().default('logs/hall-service.log'),
    DEFAULT_CURRENCY: joi_1.default.string().default('INR'),
    DEFAULT_TIMEZONE: joi_1.default.string().default('Asia/Kolkata'),
    BOOKING_ADVANCE_DAYS: joi_1.default.number().default(30),
    CANCELLATION_HOURS: joi_1.default.number().default(24),
    DEPOSIT_PERCENTAGE: joi_1.default.number().default(20),
    BASE_HALL_RATE: joi_1.default.number().default(5000),
    CHAIR_RATE: joi_1.default.number().default(50),
    DECORATION_RATE: joi_1.default.number().default(2000),
    LIGHTING_RATE: joi_1.default.number().default(1000),
    AV_RATE: joi_1.default.number().default(3000),
    CATERING_RATE_PER_PERSON: joi_1.default.number().default(300),
    SECURITY_RATE: joi_1.default.number().default(1000),
    GENERATOR_RATE: joi_1.default.number().default(2000),
    TAX_PERCENTAGE: joi_1.default.number().default(18),
    MAX_FILE_SIZE: joi_1.default.number().default(5242880),
    ALLOWED_FILE_TYPES: joi_1.default.string().default('image/jpeg,image/png,image/gif,application/pdf'),
    UPLOAD_PATH: joi_1.default.string().default('uploads/hall'),
    HEALTH_CHECK_INTERVAL: joi_1.default.number().default(30000),
    METRICS_ENABLED: joi_1.default.boolean().default(true),
    TRACING_ENABLED: joi_1.default.boolean().default(true),
    GRPC_ENABLED: joi_1.default.boolean().default(true),
    GRPC_PORT: joi_1.default.number().default(50051),
    GRPC_HOST: joi_1.default.string().default('0.0.0.0'),
    GRPC_TIMEOUT: joi_1.default.number().default(30000),
    GRPC_RETRIES: joi_1.default.number().default(3),
    GRPC_RETRY_DELAY: joi_1.default.number().default(1000),
    KAFKA_ENABLED: joi_1.default.boolean().default(true),
    KAFKA_BROKERS: joi_1.default.string().default('localhost:9092'),
    KAFKA_CLIENT_ID: joi_1.default.string().default('rubizz-hall-service'),
    KAFKA_GROUP_ID: joi_1.default.string().default('rubizz-hall-service-group'),
    KAFKA_RETRY_ATTEMPTS: joi_1.default.number().default(3),
    KAFKA_RETRY_DELAY: joi_1.default.number().default(1000),
    KAFKA_SESSION_TIMEOUT: joi_1.default.number().default(30000),
    KAFKA_HEARTBEAT_INTERVAL: joi_1.default.number().default(3000),
    KAFKA_TOPICS_EVENTS: joi_1.default.string().default('hall.booking,hall.quotation'),
    KAFKA_TOPICS_NOTIFICATIONS: joi_1.default.string().default('hall.notifications'),
    WEBSOCKET_ENABLED: joi_1.default.boolean().default(true),
    WEBSOCKET_PATH: joi_1.default.string().default('/ws'),
    WEBSOCKET_PING_INTERVAL: joi_1.default.number().default(30000),
    WEBSOCKET_PONG_TIMEOUT: joi_1.default.number().default(5000),
    WEBSOCKET_AUTHENTICATION: joi_1.default.boolean().default(true),
});
const { error, value: env } = envSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true,
});
if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
}
exports.config = {
    server: {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        serviceName: env.SERVICE_NAME,
        serviceVersion: env.SERVICE_VERSION,
    },
    database: {
        url: env.DATABASE_URL,
    },
    redisService: {
        url: env.REDIS_SERVICE_URL || 'http://localhost:3000/api/v1/redis',
        timeout: parseInt(env.REDIS_SERVICE_TIMEOUT || '30000', 10),
        retries: parseInt(env.REDIS_SERVICE_RETRIES || '3', 10),
        retryDelay: parseInt(env.REDIS_SERVICE_RETRY_DELAY || '1000', 10),
    },
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        refreshSecret: env.JWT_REFRESH_SECRET,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    apiGateway: {
        url: env.API_GATEWAY_URL,
        secret: env.API_GATEWAY_SECRET,
    },
    services: {
        auth: env.AUTH_SERVICE_URL,
        user: env.USER_SERVICE_URL,
        customer: env.CUSTOMER_SERVICE_URL,
        notification: env.NOTIFICATION_SERVICE_URL,
        mailService: env.MAIL_SERVICE_URL || 'http://localhost:3010',
    },
    rateLimit: {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
    logging: {
        level: env.LOG_LEVEL,
        file: env.LOG_FILE,
    },
    business: {
        currency: env.DEFAULT_CURRENCY,
        timezone: env.DEFAULT_TIMEZONE,
        bookingAdvanceDays: env.BOOKING_ADVANCE_DAYS,
        cancellationHours: env.CANCELLATION_HOURS,
        depositPercentage: env.DEPOSIT_PERCENTAGE,
    },
    costCalculator: {
        baseHallRate: env.BASE_HALL_RATE,
        chairRate: env.CHAIR_RATE,
        decorationRate: env.DECORATION_RATE,
        lightingRate: env.LIGHTING_RATE,
        avRate: env.AV_RATE,
        cateringRatePerPerson: env.CATERING_RATE_PER_PERSON,
        securityRate: env.SECURITY_RATE,
        generatorRate: env.GENERATOR_RATE,
        taxPercentage: env.TAX_PERCENTAGE,
    },
    upload: {
        maxFileSize: env.MAX_FILE_SIZE,
        allowedTypes: env.ALLOWED_FILE_TYPES.split(','),
        uploadPath: env.UPLOAD_PATH,
    },
    monitoring: {
        healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
        metricsEnabled: env.METRICS_ENABLED,
        tracingEnabled: env.TRACING_ENABLED,
    },
    grpc: {
        enabled: env.GRPC_ENABLED,
        port: env.GRPC_PORT,
        host: env.GRPC_HOST,
        timeout: env.GRPC_TIMEOUT,
        retries: env.GRPC_RETRIES,
        retryDelay: env.GRPC_RETRY_DELAY,
    },
    kafka: {
        enabled: env.KAFKA_ENABLED,
        brokers: env.KAFKA_BROKERS.split(',').map((b) => b.trim()),
        clientId: env.KAFKA_CLIENT_ID,
        groupId: env.KAFKA_GROUP_ID,
        retryAttempts: env.KAFKA_RETRY_ATTEMPTS,
        retryDelay: env.KAFKA_RETRY_DELAY,
        sessionTimeout: env.KAFKA_SESSION_TIMEOUT,
        heartbeatInterval: env.KAFKA_HEARTBEAT_INTERVAL,
        topics: {
            events: env.KAFKA_TOPICS_EVENTS.split(',').map((t) => t.trim()),
            notifications: env.KAFKA_TOPICS_NOTIFICATIONS.split(',').map((t) => t.trim()),
        },
    },
    websocket: {
        enabled: env.WEBSOCKET_ENABLED,
        path: env.WEBSOCKET_PATH,
        pingInterval: env.WEBSOCKET_PING_INTERVAL,
        pongTimeout: env.WEBSOCKET_PONG_TIMEOUT,
        authentication: env.WEBSOCKET_AUTHENTICATION,
    },
};
exports.default = exports.config;
//# sourceMappingURL=config.js.map