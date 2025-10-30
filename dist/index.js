"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
const DatabaseConnection_1 = require("@/database/DatabaseConnection");
const RedisService_1 = require("@/services/RedisService");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
const RateLimitMiddleware_1 = require("@/middleware/RateLimitMiddleware");
const HealthController_1 = require("@/controllers/HealthController");
const HallController_1 = require("@/controllers/HallController");
const BookingController_1 = require("@/controllers/BookingController");
const QuotationController_1 = require("@/controllers/QuotationController");
class HallService {
    constructor() {
        this.app = (0, express_1.default)();
        this.redisService = new RedisService_1.RedisService();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));
        this.app.use((0, cors_1.default)({
            origin: process.env.NODE_ENV === 'production'
                ? ['https://rubizzhotel.com', 'https://www.rubizzhotel.com']
                : true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Gateway-Secret', 'X-Request-ID'],
        }));
        this.app.use((0, compression_1.default)());
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((req, res, next) => {
            req.headers['x-request-id'] = req.headers['x-request-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            res.setHeader('X-Request-ID', req.headers['x-request-id']);
            next();
        });
        this.app.use((0, morgan_1.default)('combined', { stream: logger_1.morganStream }));
        this.app.use(RateLimitMiddleware_1.RateLimitMiddleware.general);
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                logger_1.logger.info('Request completed', {
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    userId: req.user?.id,
                });
            });
            next();
        });
    }
    setupRoutes() {
        this.app.get('/health', HealthController_1.HealthController.health);
        this.app.get('/health/detailed', HealthController_1.HealthController.healthDetailed);
        this.app.get('/health/ready', HealthController_1.HealthController.ready);
        this.app.get('/health/live', HealthController_1.HealthController.live);
        this.app.get('/metrics', HealthController_1.HealthController.metrics);
        this.app.use('/api/v1', this.setupApiRoutes());
        this.app.get('/', (req, res) => {
            res.json({
                success: true,
                message: 'Rubizz Hotel Inn - Hall Management Service',
                version: config_1.config.server.serviceVersion,
                timestamp: new Date().toISOString(),
                documentation: '/api/v1/docs',
                health: '/health',
            });
        });
        this.app.use('*', ErrorHandler_1.ErrorHandler.handleNotFound);
    }
    setupApiRoutes() {
        const router = express_1.default.Router();
        router.use('/halls', HallController_1.HallController.routes());
        router.use('/bookings', BookingController_1.BookingController.routes());
        router.use('/quotations', QuotationController_1.QuotationController.routes());
        return router;
    }
    setupErrorHandling() {
        this.app.use(ErrorHandler_1.ErrorHandler.handle);
    }
    async start() {
        try {
            await DatabaseConnection_1.database.connect();
            logger_1.logger.info('Database connected successfully');
            await this.redisService.connect();
            logger_1.logger.info('Redis service connected successfully');
            this.server = this.app.listen(config_1.config.server.port, () => {
                logger_1.logger.info(`Hall Management Service started`, {
                    port: config_1.config.server.port,
                    environment: config_1.config.server.nodeEnv,
                    service: config_1.config.server.serviceName,
                    version: config_1.config.server.serviceVersion,
                });
            });
            this.setupGracefulShutdown();
        }
        catch (error) {
            logger_1.logger.error('Failed to start Hall Management Service:', error);
            process.exit(1);
        }
    }
    setupGracefulShutdown() {
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
            if (this.server) {
                this.server.close(async () => {
                    logger_1.logger.info('HTTP server closed');
                    try {
                        await DatabaseConnection_1.database.disconnect();
                        logger_1.logger.info('Database disconnected');
                        await this.redisService.disconnect();
                        logger_1.logger.info('Redis service disconnected');
                        logger_1.logger.info('Graceful shutdown completed');
                        process.exit(0);
                    }
                    catch (error) {
                        logger_1.logger.error('Error during graceful shutdown:', error);
                        process.exit(1);
                    }
                });
            }
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            gracefulShutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            gracefulShutdown('unhandledRejection');
        });
    }
    getApp() {
        return this.app;
    }
    getServer() {
        return this.server;
    }
}
const hallService = new HallService();
hallService.start().catch((error) => {
    logger_1.logger.error('Failed to start service:', error);
    process.exit(1);
});
exports.default = hallService;
//# sourceMappingURL=index.js.map