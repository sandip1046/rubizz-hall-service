import { Request, Response } from 'express';
import { database } from '@/database/DatabaseConnection';
import { redis } from '@/database/RedisConnection';
import { logger } from '@/utils/logger';
import { config } from '@/config/config';
import { ApiResponse } from '@/types';

export class HealthController {
  /**
   * Basic health check endpoint
   */
  public static async health(req: Request, res: Response): Promise<void> {
    try {
      const response: ApiResponse = {
        success: true,
        message: 'Hall Management Service is healthy',
        data: {
          service: config.server.serviceName,
          version: config.server.serviceVersion,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.server.nodeEnv,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Health check failed:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Detailed health check with dependencies
   */
  public static async healthDetailed(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      const healthChecks = await Promise.allSettled([
        HealthController.checkDatabase(),
        HealthController.checkRedis(),
        HealthController.checkExternalServices(),
      ]);

      const duration = Date.now() - startTime;
      const isHealthy = healthChecks.every(check => check.status === 'fulfilled');

      const response: ApiResponse = {
        success: isHealthy,
        message: isHealthy ? 'All systems operational' : 'Some systems are down',
        data: {
          service: config.server.serviceName,
          version: config.server.serviceVersion,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.server.nodeEnv,
          duration: `${duration}ms`,
          checks: {
            database: healthChecks[0].status === 'fulfilled' 
              ? { status: 'healthy', ...healthChecks[0].value }
              : { status: 'unhealthy', error: healthChecks[0].reason?.message },
            redis: healthChecks[1].status === 'fulfilled'
              ? { status: 'healthy', ...healthChecks[1].value }
              : { status: 'unhealthy', error: healthChecks[1].reason?.message },
            externalServices: healthChecks[2].status === 'fulfilled'
              ? { status: 'healthy', ...healthChecks[2].value }
              : { status: 'unhealthy', error: healthChecks[2].reason?.message },
          },
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(isHealthy ? 200 : 503).json(response);
    } catch (error) {
      logger.error('Detailed health check failed:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Readiness probe for Kubernetes
   */
  public static async ready(req: Request, res: Response): Promise<void> {
    try {
      // Check if service is ready to accept traffic
      const isReady = await HealthController.isServiceReady();

      if (isReady) {
        const response: ApiResponse = {
          success: true,
          message: 'Service is ready',
          data: {
            service: config.server.serviceName,
            version: config.server.serviceVersion,
            timestamp: new Date().toISOString(),
            ready: true,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };

        res.status(200).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          message: 'Service is not ready',
          data: {
            service: config.server.serviceName,
            version: config.server.serviceVersion,
            timestamp: new Date().toISOString(),
            ready: false,
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };

        res.status(503).json(response);
      }
    } catch (error) {
      logger.error('Readiness check failed:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Readiness check failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Liveness probe for Kubernetes
   */
  public static async live(req: Request, res: Response): Promise<void> {
    try {
      const response: ApiResponse = {
        success: true,
        message: 'Service is alive',
        data: {
          service: config.server.serviceName,
          version: config.server.serviceVersion,
          timestamp: new Date().toISOString(),
          alive: true,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error('Liveness check failed:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Liveness check failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Metrics endpoint
   */
  public static async metrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = {
        service: config.server.serviceName,
        version: config.server.serviceVersion,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss,
        },
        cpu: process.cpuUsage(),
        platform: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
        },
        environment: config.server.nodeEnv,
      };

      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Metrics collection failed:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Metrics collection failed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(500).json(response);
    }
  }

  /**
   * Check database health
   */
  private static async checkDatabase(): Promise<{
    status: string;
    responseTime: number;
    version?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await database.healthCheck();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        // Get database version
        const result = await database.getPrisma().$queryRaw`SELECT version() as version`;
        const version = (result as any)[0]?.version;

        return {
          status: 'healthy',
          responseTime,
          version,
        };
      } else {
        throw new Error('Database health check failed');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      throw new Error(`Database check failed: ${error.message} (${responseTime}ms)`);
    }
  }

  /**
   * Check Redis health
   */
  private static async checkRedis(): Promise<{
    status: string;
    responseTime: number;
    version?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await redis.healthCheck();
      const responseTime = Date.now() - startTime;

      if (isHealthy) {
        // Get Redis version
        const version = await redis.getClient().info('server');
        const redisVersion = version.match(/redis_version:([^\r\n]+)/)?.[1];

        return {
          status: 'healthy',
          responseTime,
          version: redisVersion,
        };
      } else {
        throw new Error('Redis health check failed');
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      throw new Error(`Redis check failed: ${error.message} (${responseTime}ms)`);
    }
  }

  /**
   * Check external services health
   */
  private static async checkExternalServices(): Promise<{
    status: string;
    services: Record<string, { status: string; responseTime: number; error?: string }>;
  }> {
    const services = {
      auth: config.services.auth,
      user: config.services.user,
      customer: config.services.customer,
      notification: config.services.notification,
    };

    const serviceChecks = await Promise.allSettled(
      Object.entries(services).map(async ([name, url]) => {
        const startTime = Date.now();
        try {
          const response = await fetch(`${url}/health`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Gateway-Secret': config.apiGateway.secret,
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            return {
              name,
              status: 'healthy',
              responseTime,
            };
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          const responseTime = Date.now() - startTime;
          return {
            name,
            status: 'unhealthy',
            responseTime,
            error: error.message,
          };
        }
      })
    );

    const results: Record<string, { status: string; responseTime: number; error?: string }> = {};
    
    serviceChecks.forEach((check, index) => {
      const serviceName = Object.keys(services)[index];
      if (check.status === 'fulfilled') {
        results[serviceName] = check.value;
      } else {
        results[serviceName] = {
          status: 'unhealthy',
          responseTime: 0,
          error: check.reason?.message || 'Unknown error',
        };
      }
    });

    const allHealthy = Object.values(results).every(service => service.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services: results,
    };
  }

  /**
   * Check if service is ready to accept traffic
   */
  private static async isServiceReady(): Promise<boolean> {
    try {
      // Check critical dependencies
      const [dbHealthy, redisHealthy] = await Promise.all([
        database.healthCheck(),
        redis.healthCheck(),
      ]);

      return dbHealthy && redisHealthy;
    } catch (error) {
      logger.error('Service readiness check failed:', error);
      return false;
    }
  }
}

export default HealthController;
