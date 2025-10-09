import nodemailer, { Transporter } from 'nodemailer';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

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

class EmailService {
  private static instance: EmailService;
  private smtpTransporter: Transporter;
  private brevoTransporter: Transporter;

  private constructor() {
    // Initialize SMTP transporter
    this.smtpTransporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });

    // Initialize Brevo transporter
    this.brevoTransporter = nodemailer.createTransport({
      host: config.email.brevo.host,
      port: config.email.brevo.port,
      secure: false, // true for 465, false for other ports
      auth: {
        user: config.email.brevo.auth.user,
        pass: config.email.brevo.auth.pass,
      },
    });

    this.setupEventHandlers();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private setupEventHandlers(): void {
    // SMTP transporter event handlers
    this.smtpTransporter.on('token', (token: any) => {
      logger.debug('SMTP OAuth2 token generated:', token);
    });

    // Brevo transporter event handlers
    this.brevoTransporter.on('token', (token: any) => {
      logger.debug('Brevo OAuth2 token generated:', token);
    });
  }

  public async sendEmail(options: EmailOptions, useBrevo: boolean = true): Promise<boolean> {
    const transporter = useBrevo ? this.brevoTransporter : this.smtpTransporter;
    const provider = useBrevo ? 'Brevo' : 'SMTP';

    try {
      const mailOptions = {
        from: {
          name: config.email.from.name,
          address: config.email.from.email,
        },
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        provider,
        messageId: info.messageId,
        to: options.to,
        subject: options.subject,
      });

      return true;
    } catch (error) {
      logger.error(`Email sending failed via ${provider}:`, error);
      return false;
    }
  }

  public async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    const subject = 'Welcome to Rubizz Hotel Inn';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #cb9c03;">Welcome to Rubizz Hotel Inn!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for choosing Rubizz Hotel Inn. We're excited to have you as our guest.</p>
        <p>You can now book rooms, reserve tables, order food, and book event halls through our platform.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Rubizz Hotel Inn Team</p>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async sendBookingConfirmation(
    to: string,
    bookingDetails: {
      type: 'room' | 'table' | 'hall';
      bookingId: string;
      date: string;
      time?: string;
      amount: number;
    }
  ): Promise<boolean> {
    const subject = `Booking Confirmation - ${bookingDetails.type.toUpperCase()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #cb9c03;">Booking Confirmation</h2>
        <p>Dear Customer,</p>
        <p>Your ${bookingDetails.type} booking has been confirmed!</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          <p><strong>Type:</strong> ${bookingDetails.type.toUpperCase()}</p>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          ${bookingDetails.time ? `<p><strong>Time:</strong> ${bookingDetails.time}</p>` : ''}
          <p><strong>Amount:</strong> ₹${bookingDetails.amount}</p>
        </div>
        <p>Thank you for choosing Rubizz Hotel Inn!</p>
        <p>Best regards,<br>Rubizz Hotel Inn Team</p>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async sendCancellationNotification(
    to: string,
    cancellationDetails: {
      type: 'room' | 'table' | 'hall';
      bookingId: string;
      refundAmount?: number;
    }
  ): Promise<boolean> {
    const subject = `Booking Cancelled - ${cancellationDetails.type.toUpperCase()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #cb9c03;">Booking Cancelled</h2>
        <p>Dear Customer,</p>
        <p>Your ${cancellationDetails.type} booking has been cancelled.</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
          <h3>Cancellation Details:</h3>
          <p><strong>Booking ID:</strong> ${cancellationDetails.bookingId}</p>
          <p><strong>Type:</strong> ${cancellationDetails.type.toUpperCase()}</p>
          ${cancellationDetails.refundAmount ? `<p><strong>Refund Amount:</strong> ₹${cancellationDetails.refundAmount}</p>` : ''}
        </div>
        <p>If you have any questions, please contact us.</p>
        <p>Best regards,<br>Rubizz Hotel Inn Team</p>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const subject = 'Password Reset - Rubizz Hotel Inn';
    const resetUrl = `${config.apiGateway.url}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #cb9c03;">Password Reset Request</h2>
        <p>Dear Customer,</p>
        <p>You have requested to reset your password. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #cb9c03; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>Rubizz Hotel Inn Team</p>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async sendOTPEmail(to: string, otp: string): Promise<boolean> {
    const subject = 'OTP Verification - Rubizz Hotel Inn';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #cb9c03;">OTP Verification</h2>
        <p>Dear Customer,</p>
        <p>Your OTP for verification is:</p>
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center;">
          <h1 style="color: #cb9c03; font-size: 32px; margin: 0;">${otp}</h1>
        </div>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p>Best regards,<br>Rubizz Hotel Inn Team</p>
      </div>
    `;

    return await this.sendEmail({
      to,
      subject,
      html,
    });
  }

  public async verifyConnection(useBrevo: boolean = true): Promise<boolean> {
    const transporter = useBrevo ? this.brevoTransporter : this.smtpTransporter;
    const provider = useBrevo ? 'Brevo' : 'SMTP';

    try {
      await transporter.verify();
      logger.info(`${provider} email connection verified successfully`);
      return true;
    } catch (error) {
      logger.error(`${provider} email connection verification failed:`, error);
      return false;
    }
  }

  public async closeConnections(): Promise<void> {
    try {
      await Promise.all([
        this.smtpTransporter.close(),
        this.brevoTransporter.close(),
      ]);
      logger.info('Email connections closed successfully');
    } catch (error) {
      logger.error('Error closing email connections:', error);
    }
  }
}

export const emailService = EmailService.getInstance();
export default emailService;
