import { PrismaClient } from '@prisma/client';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: config.database.url,
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

    // Set up logging
    this.setupLogging();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getPrisma(): PrismaClient {
    return this.prisma;
  }

  private setupLogging(): void {
    this.prisma.$on('query', (e) => {
      if (config.server.nodeEnv === 'development') {
        logger.debug('Database Query:', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      }
    });

    this.prisma.$on('error', (e) => {
      logger.error('Database Error:', e);
    });

    this.prisma.$on('info', (e) => {
      logger.info('Database Info:', e);
    });

    this.prisma.$on('warn', (e) => {
      logger.warn('Database Warning:', e);
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connected successfully', {
        service: config.server.serviceName,
        database: config.database.name,
      });
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database disconnected successfully', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Database disconnection failed:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await this.prisma.$transaction(fn);
  }
}

export const database = DatabaseConnection.getInstance();
export default database;
