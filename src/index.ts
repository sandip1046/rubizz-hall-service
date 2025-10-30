import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from '@/config/config';
import { logger, morganStream } from '@/utils/logger';
import { database } from '@/database/DatabaseConnection';
import { RedisService } from '@/services/RedisService';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { RateLimitMiddleware } from '@/middleware/RateLimitMiddleware';
import { HealthController } from '@/controllers/HealthController';

// Import controllers
import { HallController } from '@/controllers/HallController';
import { BookingController } from '@/controllers/BookingController';
import { QuotationController } from '@/controllers/QuotationController';

class HallService {
  private app: express.Application;
  private server: any;
  private redisService: RedisService;

  constructor() {
    this.app = express();
    this.redisService = new RedisService();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
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

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://rubizzhotel.com', 'https://www.rubizzhotel.com']
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Gateway-Secret', 'X-Request-ID'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] || 
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.setHeader('X-Request-ID', req.headers['x-request-id']);
      next();
    });

    // Logging middleware
    this.app.use(morgan('combined', { stream: morganStream }));

    // Rate limiting
    this.app.use(RateLimitMiddleware.general);

    // Request logging
    this.app.use((req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info('Request completed', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: (req as any).user?.id,
        });
      });

      next();
    });
  }

  private setupRoutes(): void {
    // Health check routes (no authentication required)
    this.app.get('/health', HealthController.health);
    this.app.get('/health/detailed', HealthController.healthDetailed);
    this.app.get('/health/ready', HealthController.ready);
    this.app.get('/health/live', HealthController.live);
    this.app.get('/metrics', HealthController.metrics);

    // API routes
    this.app.use('/api/v1', this.setupApiRoutes());

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Rubizz Hotel Inn - Hall Management Service',
        version: config.server.serviceVersion,
        timestamp: new Date().toISOString(),
        documentation: '/api/v1/docs',
        health: '/health',
      });
    });

    // 404 handler
    this.app.use('*', ErrorHandler.handleNotFound);
  }

  private setupApiRoutes(): express.Router {
    const router = express.Router();

    // Hall management routes
    router.use('/halls', HallController.routes());

    // Booking management routes
    router.use('/bookings', BookingController.routes());

    // Quotation management routes
    router.use('/quotations', QuotationController.routes());

    return router;
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(ErrorHandler.handle);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await database.connect();
      logger.info('Database connected successfully');

      // Connect to Redis Service
      await this.redisService.connect();
      logger.info('Redis service connected successfully');

      // Start server
      this.server = this.app.listen(config.server.port, () => {
        logger.info(`Hall Management Service started`, {
          port: config.server.port,
          environment: config.server.nodeEnv,
          service: config.server.serviceName,
          version: config.server.serviceVersion,
        });
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start Hall Management Service:', { error: (error as any)?.message, stack: (error as any)?.stack });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');

          try {
            // Close database connection
            await database.disconnect();
            logger.info('Database disconnected');

            // Close Redis service connection
            await this.redisService.disconnect();
            logger.info('Redis service disconnected');

            logger.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown:', error);
            process.exit(1);
          }
        });
      }

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: (error as any)?.message, stack: (error as any)?.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason: (reason as any)?.message ?? String(reason) });
      gracefulShutdown('unhandledRejection');
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }
}

// Start the service
const hallService = new HallService();

// Handle startup errors
hallService.start().catch((error) => {
  logger.error('Failed to start service:', { error: (error as any)?.message, stack: (error as any)?.stack });
  process.exit(1);
});

export default hallService;
