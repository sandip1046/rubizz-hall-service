import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  // Server Configuration
  PORT: Joi.number().default(3007),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  SERVICE_NAME: Joi.string().default('rubizz-hall-service'),
  SERVICE_VERSION: Joi.string().default('1.0.0'),

  // Database Configuration
  DATABASE_URL: Joi.string().required(),

  // Redis Service Configuration
  REDIS_SERVICE_URL: Joi.string().uri().default('http://localhost:3000/api/v1/redis'),
  REDIS_SERVICE_TIMEOUT: Joi.number().default(30000),
  REDIS_SERVICE_RETRIES: Joi.number().default(3),
  REDIS_SERVICE_RETRY_DELAY: Joi.number().default(1000),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // API Gateway Configuration
  API_GATEWAY_URL: Joi.string().uri().default('http://localhost:3000'),
  API_GATEWAY_SECRET: Joi.string().min(16).required(),

  // External Services
  AUTH_SERVICE_URL: Joi.string().uri().default('http://localhost:3001'),
  USER_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),
  CUSTOMER_SERVICE_URL: Joi.string().uri().default('http://localhost:3003'),
  NOTIFICATION_SERVICE_URL: Joi.string().uri().default('http://localhost:3010'),

  // Email Configuration
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().email().default('your-email@gmail.com'),
  SMTP_PASS: Joi.string().default('your-app-password'),

  // Brevo SMTP Configuration
  BREVO_SMTP_HOST: Joi.string().default('smtp-relay.brevo.com'),
  BREVO_SMTP_PORT: Joi.number().default(587),
  BREVO_SMTP_USER: Joi.string().email().default('your-email@brevo.com'),
  BREVO_SMTP_PASS: Joi.string().default('your-brevo-password'),

  FROM_EMAIL: Joi.string().email().default('noreply@rubizzhotel.com'),
  FROM_NAME: Joi.string().default('Rubizz Hotel Inn'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/hall-service.log'),

  // Business Configuration
  DEFAULT_CURRENCY: Joi.string().default('INR'),
  DEFAULT_TIMEZONE: Joi.string().default('Asia/Kolkata'),
  BOOKING_ADVANCE_DAYS: Joi.number().default(30),
  CANCELLATION_HOURS: Joi.number().default(24),
  DEPOSIT_PERCENTAGE: Joi.number().default(20),

  // Cost Calculator Configuration
  BASE_HALL_RATE: Joi.number().default(5000),
  CHAIR_RATE: Joi.number().default(50),
  DECORATION_RATE: Joi.number().default(2000),
  LIGHTING_RATE: Joi.number().default(1000),
  AV_RATE: Joi.number().default(3000),
  CATERING_RATE_PER_PERSON: Joi.number().default(300),
  SECURITY_RATE: Joi.number().default(1000),
  GENERATOR_RATE: Joi.number().default(2000),
  TAX_PERCENTAGE: Joi.number().default(18),

  // File Upload
  MAX_FILE_SIZE: Joi.number().default(5242880),
  ALLOWED_FILE_TYPES: Joi.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  UPLOAD_PATH: Joi.string().default('uploads/hall'),

  // Monitoring
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
  METRICS_ENABLED: Joi.boolean().default(true),
  TRACING_ENABLED: Joi.boolean().default(true),
});

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env, {
  allowUnknown: true,
  stripUnknown: true,
});

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Export configuration
export const config = {
  // Server
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    serviceName: env.SERVICE_NAME,
    serviceVersion: env.SERVICE_VERSION,
  },

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Redis Service Configuration
  redisService: {
    url: env.REDIS_SERVICE_URL || 'http://localhost:3000/api/v1/redis',
    timeout: parseInt(env.REDIS_SERVICE_TIMEOUT || '30000', 10),
    retries: parseInt(env.REDIS_SERVICE_RETRIES || '3', 10),
    retryDelay: parseInt(env.REDIS_SERVICE_RETRY_DELAY || '1000', 10),
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // API Gateway
  apiGateway: {
    url: env.API_GATEWAY_URL,
    secret: env.API_GATEWAY_SECRET,
  },

  // External Services
  services: {
    auth: env.AUTH_SERVICE_URL,
    user: env.USER_SERVICE_URL,
    customer: env.CUSTOMER_SERVICE_URL,
    notification: env.NOTIFICATION_SERVICE_URL,
  },

  // Email
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    },
    brevo: {
      host: env.BREVO_SMTP_HOST,
      port: env.BREVO_SMTP_PORT,
      auth: {
        user: env.BREVO_SMTP_USER,
        pass: env.BREVO_SMTP_PASS,
      },
    },
    from: {
      email: env.FROM_EMAIL,
      name: env.FROM_NAME,
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },

  // Business Configuration
  business: {
    currency: env.DEFAULT_CURRENCY,
    timezone: env.DEFAULT_TIMEZONE,
    bookingAdvanceDays: env.BOOKING_ADVANCE_DAYS,
    cancellationHours: env.CANCELLATION_HOURS,
    depositPercentage: env.DEPOSIT_PERCENTAGE,
  },

  // Cost Calculator
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

  // File Upload
  upload: {
    maxFileSize: env.MAX_FILE_SIZE,
    allowedTypes: env.ALLOWED_FILE_TYPES.split(','),
    uploadPath: env.UPLOAD_PATH,
  },

  // Monitoring
  monitoring: {
    healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
    metricsEnabled: env.METRICS_ENABLED,
    tracingEnabled: env.TRACING_ENABLED,
  },
};

export default config;
