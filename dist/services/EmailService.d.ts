export interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}
declare class EmailService {
    private static instance;
    private smtpTransporter;
    private brevoTransporter;
    private constructor();
    static getInstance(): EmailService;
    private setupEventHandlers;
    sendEmail(options: EmailOptions, useBrevo?: boolean): Promise<boolean>;
    sendWelcomeEmail(to: string, name: string): Promise<boolean>;
    sendBookingConfirmation(to: string, bookingDetails: {
        type: 'room' | 'table' | 'hall';
        bookingId: string;
        date: string;
        time?: string;
        amount: number;
    }): Promise<boolean>;
    sendCancellationNotification(to: string, cancellationDetails: {
        type: 'room' | 'table' | 'hall';
        bookingId: string;
        refundAmount?: number;
    }): Promise<boolean>;
    sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean>;
    sendOTPEmail(to: string, otp: string): Promise<boolean>;
    verifyConnection(useBrevo?: boolean): Promise<boolean>;
    closeConnections(): Promise<void>;
}
export declare const emailService: EmailService;
export default emailService;
//# sourceMappingURL=EmailService.d.ts.map