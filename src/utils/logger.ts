import winston from 'winston';
import { config } from '@/config/config';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: config.server.serviceName,
    version: config.server.serviceVersion,
  },
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
    
    // Separate file for error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

// Add console transport for development
if (config.server.nodeEnv === 'development') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Add console transport for production errors
if (config.server.nodeEnv === 'production') {
  logger.add(
    new winston.transports.Console({
      level: 'error',
      format: consoleFormat,
    })
  );
}

// Create a stream for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Utility functions for structured logging
export const logRequest = (req: any, res: any, responseTime: number) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    context,
  });
};

export const logDatabaseQuery = (query: string, params: any, duration: number) => {
  logger.debug('Database Query', {
    query,
    params,
    duration: `${duration}ms`,
  });
};

export const logBusinessEvent = (event: string, data: any) => {
  logger.info('Business Event', {
    event,
    data,
  });
};

export const logSecurityEvent = (event: string, data: any) => {
  logger.warn('Security Event', {
    event,
    data,
  });
};

export const logPerformanceMetric = (metric: string, value: number, unit: string = 'ms') => {
  logger.info('Performance Metric', {
    metric,
    value,
    unit,
  });
};

export default logger;
