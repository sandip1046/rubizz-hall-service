"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
class DatabaseConnection {
    constructor() {
        this.isConnected = false;
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async connect() {
        try {
            if (this.isConnected)
                return;
            await mongoose_1.default.connect(config_1.config.database.url, {
                autoIndex: true,
                serverSelectionTimeoutMS: 30000,
            });
            this.isConnected = true;
            logger_1.logger.info('Database connected successfully', {
                service: config_1.config.server.serviceName,
                database: 'MongoDB (Mongoose)',
            });
        }
        catch (error) {
            logger_1.logger.error('Database connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (!this.isConnected)
                return;
            await mongoose_1.default.disconnect();
            this.isConnected = false;
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
            const state = mongoose_1.default.connection.readyState;
            return state === 1;
        }
        catch (error) {
            logger_1.logger.error('Database health check failed:', error);
            return false;
        }
    }
}
exports.database = DatabaseConnection.getInstance();
exports.default = exports.database;
//# sourceMappingURL=DatabaseConnection.js.map