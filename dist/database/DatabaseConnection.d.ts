import { PrismaClient } from '@prisma/client';
declare class DatabaseConnection {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): DatabaseConnection;
    getPrisma(): PrismaClient;
    private setupLogging;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
    transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;
}
export declare const database: DatabaseConnection;
export default database;
//# sourceMappingURL=DatabaseConnection.d.ts.map