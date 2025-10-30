import mongoose from 'mongoose';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected) return;

      await mongoose.connect(config.database.url, {
        autoIndex: true,
        serverSelectionTimeoutMS: 30000,
      } as any);

      this.isConnected = true;
      logger.info('Database connected successfully', {
        service: config.server.serviceName,
        database: 'MongoDB (Mongoose)',
      });
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) return;
      await mongoose.disconnect();
      this.isConnected = false;
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
      const state = mongoose.connection.readyState; // 1 = connected
      return state === 1;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const database = DatabaseConnection.getInstance();
export default database;
