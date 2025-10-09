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
    // MongoDB with Prisma doesn't support query logging in the same way
    // We'll skip the logging setup for now
    if (config.server.nodeEnv === 'development') {
      logger.debug('Database logging disabled for MongoDB');
    }
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connected successfully', {
        service: config.server.serviceName,
        database: 'MongoDB',
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
      // For MongoDB, we can use a simple findOne operation
      await this.prisma.hall.findFirst();
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    // For MongoDB, we'll use a simple execution without transaction
    // MongoDB transactions require replica sets which might not be available
    return await fn(this.prisma);
  }
}

export const database = DatabaseConnection.getInstance();
export default database;
