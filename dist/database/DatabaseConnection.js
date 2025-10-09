"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
class DatabaseConnection {
    constructor() {
        this.prisma = new client_1.PrismaClient({
            datasources: {
                db: {
                    url: config_1.config.database.url,
                },
            },
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'event',
                    level: 'error',
                },
                {
                    emit: 'event',
                    level: 'info',
                },
                {
                    emit: 'event',
                    level: 'warn',
                },
            ],
        });
        this.setupLogging();
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    getPrisma() {
        return this.prisma;
    }
    setupLogging() {
        if (config_1.config.server.nodeEnv === 'development') {
            logger_1.logger.debug('Database logging disabled for MongoDB');
        }
    }
    async connect() {
        try {
            await this.prisma.$connect();
            logger_1.logger.info('Database connected successfully', {
                service: config_1.config.server.serviceName,
                database: 'MongoDB',
            });
        }
        catch (error) {
            logger_1.logger.error('Database connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await this.prisma.$disconnect();
            logger_1.logger.info('Database disconnected successfully', {
                service: config_1.config.server.serviceName,
            });
        }
        catch (error) {
            logger_1.logger.error('Database disconnection failed:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            await this.prisma.hall.findFirst();
            return true;
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            return false;
        }
    }
    async transaction(fn) {
        return await fn(this.prisma);
    }
}
exports.database = DatabaseConnection.getInstance();
exports.default = exports.database;
//# sourceMappingURL=DatabaseConnection.js.map