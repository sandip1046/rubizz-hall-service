import { config } from '@/config/config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_hall_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
process.env.API_GATEWAY_SECRET = 'test-api-gateway-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  morganStream: {
    write: jest.fn(),
  },
}));

// Mock database connections
jest.mock('@/database/DatabaseConnection', () => ({
  database: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    getPrisma: jest.fn(() => ({
      hall: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      hallBooking: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      hallQuotation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      hallLineItem: {
        create: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      hallPayment: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      hallAvailability: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
    })),
    transaction: jest.fn(),
  },
}));

// Mock Redis connection
jest.mock('@/database/RedisConnection', () => ({
  redis: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    healthCheck: jest.fn().mockResolvedValue(true),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    getClient: jest.fn(() => ({
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn(),
    })),
  },
}));

// Mock external services
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);
