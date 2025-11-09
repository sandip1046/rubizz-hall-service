import axios, { AxiosInstance } from 'axios';
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
  private mailServiceClient: AxiosInstance;

  private constructor() {
    this.mailServiceClient = axios.create({
      baseURL: config.services.mailService,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const recipients = Array.isArray(options.to) ? options.to : [options.to];

      for (const recipient of recipients) {
        const response = await this.mailServiceClient.post('/api/v1/mail/send', {
          to: recipient,
          subject: options.subject,
          htmlContent: options.html,
          textContent: options.text,
        });

        if (response.data.success) {
          logger.info('Email sent successfully via mail-service', {
            emailId: response.data.data?.emailId,
            to: recipient,
            subject: options.subject,
          });
        } else {
          logger.error('Failed to send email via mail-service', {
            to: recipient,
            subject: options.subject,
            error: response.data.error?.message,
          });
          return false;
        }
      }

      return true;
    } catch (error: any) {
      logger.error('Error sending email via mail-service:', error, {
        to: options.to,
        subject: options.subject,
        errorMessage: error.response?.data?.error?.message || error.message,
      });
      return false;
    }
  }

  public async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
        templateName: 'hall_welcome',
        to,
        variables: {
          name,
        },
      });

      if (response.data.success) {
        logger.info('Welcome email sent successfully via mail-service', {
          to,
          emailId: response.data.data?.emailId,
        });
        return true;
      } else {
        logger.error('Failed to send welcome email via mail-service', {
          to,
          error: response.data.error?.message,
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Error sending welcome email:', error, {
        to,
        errorMessage: error.response?.data?.error?.message || error.message,
      });
      return false;
    }
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
    try {
      const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
        templateName: 'hall_booking_confirmation',
        to,
        variables: {
          bookingType: bookingDetails.type.toUpperCase(),
          bookingId: bookingDetails.bookingId,
          date: bookingDetails.date,
          time: bookingDetails.time || '',
          amount: bookingDetails.amount.toFixed(2),
          hasTime: bookingDetails.time ? 'true' : 'false',
        },
      });

      if (response.data.success) {
        logger.info('Booking confirmation email sent successfully via mail-service', {
          to,
          bookingId: bookingDetails.bookingId,
          emailId: response.data.data?.emailId,
        });
        return true;
      } else {
        logger.error('Failed to send booking confirmation email via mail-service', {
          to,
          bookingId: bookingDetails.bookingId,
          error: response.data.error?.message,
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Error sending booking confirmation email:', error, {
        to,
        bookingId: bookingDetails.bookingId,
        errorMessage: error.response?.data?.error?.message || error.message,
      });
      return false;
    }
  }

  public async sendCancellationNotification(
    to: string,
    cancellationDetails: {
      type: 'room' | 'table' | 'hall';
      bookingId: string;
      refundAmount?: number;
    }
  ): Promise<boolean> {
    try {
      const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
        templateName: 'hall_booking_cancellation',
        to,
        variables: {
          bookingType: cancellationDetails.type.toUpperCase(),
          bookingId: cancellationDetails.bookingId,
          refundAmount: cancellationDetails.refundAmount?.toFixed(2) || '0',
          hasRefund: cancellationDetails.refundAmount ? 'true' : 'false',
        },
      });

      if (response.data.success) {
        logger.info('Cancellation notification email sent successfully via mail-service', {
          to,
          bookingId: cancellationDetails.bookingId,
          emailId: response.data.data?.emailId,
        });
        return true;
      } else {
        logger.error('Failed to send cancellation notification email via mail-service', {
          to,
          bookingId: cancellationDetails.bookingId,
          error: response.data.error?.message,
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Error sending cancellation notification email:', error, {
        to,
        bookingId: cancellationDetails.bookingId,
        errorMessage: error.response?.data?.error?.message || error.message,
      });
      return false;
    }
  }

  public async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    try {
      const resetUrl = `${config.apiGateway.url}/reset-password?token=${resetToken}`;

      const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
        templateName: 'hall_password_reset',
        to,
        variables: {
          resetUrl,
        },
      });

      if (response.data.success) {
        logger.info('Password reset email sent successfully via mail-service', {
          to,
          emailId: response.data.data?.emailId,
        });
        return true;
      } else {
        logger.error('Failed to send password reset email via mail-service', {
          to,
          error: response.data.error?.message,
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Error sending password reset email:', error, {
        to,
        errorMessage: error.response?.data?.error?.message || error.message,
      });
      return false;
    }
  }

  public async sendOTPEmail(to: string, otp: string): Promise<boolean> {
    try {
      const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
        templateName: 'hall_otp_verification',
        to,
        variables: {
          otp,
        },
      });

      if (response.data.success) {
        logger.info('OTP email sent successfully via mail-service', {
          to,
          emailId: response.data.data?.emailId,
        });
        return true;
      } else {
        logger.error('Failed to send OTP email via mail-service', {
          to,
          error: response.data.error?.message,
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Error sending OTP email:', error, {
        to,
        errorMessage: error.response?.data?.error?.message || error.message,
      });
      return false;
    }
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      const response = await this.mailServiceClient.get('/health');
      logger.info('Mail service connection verified successfully');
      return response.status === 200;
    } catch (error) {
      logger.error('Mail service connection verification failed:', error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();
export default emailService;
