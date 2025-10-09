"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPerformanceMetric = exports.logSecurityEvent = exports.logBusinessEvent = exports.logDatabaseQuery = exports.logError = exports.logRequest = exports.morganStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("@/config/config");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logsDir = path_1.default.dirname(config_1.config.logging.file);
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss',
}), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
}));
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: {
        service: config_1.config.server.serviceName,
        version: config_1.config.server.serviceVersion,
    },
    transports: [
        new winston_1.default.transports.File({
            filename: config_1.config.logging.file,
            maxsize: 5242880,
            maxFiles: 5,
            tailable: true,
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
            tailable: true,
        }),
    ],
});
if (config_1.config.server.nodeEnv === 'development') {
    exports.logger.add(new winston_1.default.transports.Console({
        format: consoleFormat,
    }));
}
if (config_1.config.server.nodeEnv === 'production') {
    exports.logger.add(new winston_1.default.transports.Console({
        level: 'error',
        format: consoleFormat,
    }));
}
exports.morganStream = {
    write: (message) => {
        exports.logger.info(message.trim());
    },
};
const logRequest = (req, res, responseTime) => {
    exports.logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
    });
};
exports.logRequest = logRequest;
const logError = (error, context) => {
    exports.logger.error('Application Error', {
        message: error.message,
        stack: error.stack,
        context,
    });
};
exports.logError = logError;
const logDatabaseQuery = (query, params, duration) => {
    exports.logger.debug('Database Query', {
        query,
        params,
        duration: `${duration}ms`,
    });
};
exports.logDatabaseQuery = logDatabaseQuery;
const logBusinessEvent = (event, data) => {
    exports.logger.info('Business Event', {
        event,
        data,
    });
};
exports.logBusinessEvent = logBusinessEvent;
const logSecurityEvent = (event, data) => {
    exports.logger.warn('Security Event', {
        event,
        data,
    });
};
exports.logSecurityEvent = logSecurityEvent;
const logPerformanceMetric = (metric, value, unit = 'ms') => {
    exports.logger.info('Performance Metric', {
        metric,
        value,
        unit,
    });
};
exports.logPerformanceMetric = logPerformanceMetric;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map