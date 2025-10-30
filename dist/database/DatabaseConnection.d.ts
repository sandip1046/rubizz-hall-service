declare class DatabaseConnection {
    private static instance;
    private isConnected;
    private constructor();
    static getInstance(): DatabaseConnection;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
}
export declare const database: DatabaseConnection;
export default database;
//# sourceMappingURL=DatabaseConnection.d.ts.map