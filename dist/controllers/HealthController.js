"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const DatabaseConnection_1 = require("@/database/DatabaseConnection");
const RedisConnection_1 = require("@/database/RedisConnection");
const logger_1 = require("@/utils/logger");
const config_1 = require("@/config/config");
class HealthController {
    static async health(req, res) {
        try {
            const response = {
                success: true,
                message: 'Hall Management Service is healthy',
                data: {
                    service: config_1.config.server.serviceName,
                    version: config_1.config.server.serviceVersion,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    environment: config_1.config.server.nodeEnv,
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            };
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Health check failed:', error);
            const response = {
                success: false,
                message: 'Health check failed',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            };
            res.status(500).json(response);
        }
    }
    static async healthDetailed(req, res) {
        try {
            const startTime = Date.now();
            const healthChecks = await Promise.allSettled([
                HealthController.checkDatabase(),
                HealthController.checkRedis(),
                HealthController.checkExternalServices(),
            ]);
            const duration = Date.now() - startTime;
            const isHealthy = healthChecks.every(check => check.status === 'fulfilled');
            const response = {
                success: isHealthy,
                message: isHealthy ? 'All systems operational' : 'Some systems are down',
                data: {
                    service: config_1.config.server.serviceName,
                    version: config_1.config.server.serviceVersion,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                    environment: config_1.config.server.nodeEnv,
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
                requestId: req.headers['x-request-id'],
            };
            res.status(isHealthy ? 200 : 503).json(response);
        }
        catch (error) {
            logger_1.logger.error('Detailed health check failed:', error);
            const response = {
                success: false,
                message: 'Health check failed',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            };
            res.status(500).json(response);
        }
    }
    static async ready(req, res) {
        try {
            const isReady = await HealthController.isServiceReady();
            if (isReady) {
                const response = {
                    success: true,
                    message: 'Service is ready',
                    data: {
                        service: config_1.config.server.serviceName,
                        version: config_1.config.server.serviceVersion,
                        timestamp: new Date().toISOString(),
                        ready: true,
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    success: false,
                    message: 'Service is not ready',
                    data: {
                        service: config_1.config.server.serviceName,
                        version: config_1.config.server.serviceVersion,
                        timestamp: new Date().toISOString(),
                        ready: false,
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(503).json(response);
            }
        }
        catch (error) {
            logger_1.logger.error('Readiness check failed:', error);
            const response = {
                success: false,
                message: 'Readiness check failed',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            };
            res.status(500).json(response);
        }
    }
    static async live(req, res) {
        try {
            const response = {
                success: true,
                message: 'Service is alive',
                data: {
                    service: config_1.config.server.serviceName,
                    version: config_1.config.server.serviceVersion,
                    timestamp: new Date().toISOString(),
                    alive: true,
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage(),
                },
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            };
            res.status(200).json(response);
        }
        catch (error) {
            logger_1.logger.error('Liveness check failed:', error);
            const response = {
                success: false,
                message: 'Liveness check failed',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            };
            res.status(500).json(response);
        }
    }
    static async metrics(req, res) {
        try {
            const metrics = {
                service: config_1.config.server.serviceName,
                version: config_1.config.server.serviceVersion,
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
                environment: config_1.config.server.nodeEnv,
            };
            res.status(200).json(metrics);
        }
        catch (error) {
            logger_1.logger.error('Metrics collection failed:', error);
            const response = {
                success: false,
                message: 'Metrics collection failed',
                timestamp: new Date().toISOString(),
                requestId: req.headers['x-request-id'],
            };
            res.status(500).json(response);
        }
    }
    static async checkDatabase() {
        const startTime = Date.now();
        try {
            const isHealthy = await DatabaseConnection_1.database.healthCheck();
            const responseTime = Date.now() - startTime;
            if (isHealthy) {
                const version = 'MongoDB';
                return {
                    status: 'healthy',
                    responseTime,
                    version,
                };
            }
            else {
                throw new Error('Database health check failed');
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Database check failed: ${errorMessage} (${responseTime}ms)`);
        }
    }
    static async checkRedis() {
        const startTime = Date.now();
        try {
            const isHealthy = await RedisConnection_1.redis.healthCheck();
            const responseTime = Date.now() - startTime;
            if (isHealthy) {
                const version = await RedisConnection_1.redis.getClient().info('server');
                const redisVersion = version.match(/redis_version:([^\r\n]+)/)?.[1];
                return {
                    status: 'healthy',
                    responseTime,
                    version: redisVersion || 'Unknown',
                };
            }
            else {
                throw new Error('Redis health check failed');
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Redis check failed: ${errorMessage} (${responseTime}ms)`);
        }
    }
    static async checkExternalServices() {
        const services = {
            auth: config_1.config.services.auth,
            user: config_1.config.services.user,
            customer: config_1.config.services.customer,
            notification: config_1.config.services.notification,
        };
        const serviceChecks = await Promise.allSettled(Object.entries(services).map(async ([name, url]) => {
            const startTime = Date.now();
            try {
                const response = await fetch(`${url}/health`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Gateway-Secret': config_1.config.apiGateway.secret,
                    },
                    signal: AbortSignal.timeout(5000),
                });
                const responseTime = Date.now() - startTime;
                if (response.ok) {
                    return {
                        name,
                        status: 'healthy',
                        responseTime,
                    };
                }
                else {
                    throw new Error(`HTTP ${response.status}`);
                }
            }
            catch (error) {
                const responseTime = Date.now() - startTime;
                return {
                    name,
                    status: 'unhealthy',
                    responseTime,
                    error: error instanceof Error ? error.message : 'Unknown error',
                };
            }
        }));
        const results = {};
        serviceChecks.forEach((check, index) => {
            const serviceName = Object.keys(services)[index];
            if (serviceName) {
                if (check.status === 'fulfilled') {
                    results[serviceName] = check.value;
                }
                else {
                    results[serviceName] = {
                        status: 'unhealthy',
                        responseTime: 0,
                        error: check.reason?.message || 'Unknown error',
                    };
                }
            }
        });
        const allHealthy = Object.values(results).every(service => service.status === 'healthy');
        return {
            status: allHealthy ? 'healthy' : 'degraded',
            services: results,
        };
    }
    static async isServiceReady() {
        try {
            const [dbHealthy, redisHealthy] = await Promise.all([
                DatabaseConnection_1.database.healthCheck(),
                RedisConnection_1.redis.healthCheck(),
            ]);
            return dbHealthy && redisHealthy;
        }
        catch (error) {
            logger_1.logger.error('Service readiness check failed:', error);
            return false;
        }
    }
}
exports.HealthController = HealthController;
exports.default = HealthController;
//# sourceMappingURL=HealthController.js.map