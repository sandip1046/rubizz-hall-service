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
    customerName: string,
    bookingDetails: {
      type: 'room' | 'table' | 'hall';
      bookingId: string;
      date: string;
      time?: string;
      amount: number;
      tableNumber?: string;
      hallName?: string;
      partySize?: number;
      eventType?: string;
      guestCount?: number;
    }
  ): Promise<boolean> {
    // Determine template based on booking type
    let templateName: string = '';
    let variables: Record<string, any> = {
      customerName,
      customerEmail: to,
      bookingNumber: bookingDetails.bookingId,
      bookingDate: bookingDetails.date,
      totalAmount: bookingDetails.amount,
    };

    try {
      if (bookingDetails.type === 'hall') {
        templateName = 'customer_hall_booking_confirmation';
        variables = {
          ...variables,
          hallName: bookingDetails.hallName || 'Hall',
          eventDate: bookingDetails.date,
          eventTime: bookingDetails.time || '',
          eventType: bookingDetails.eventType || 'Event',
          guestCount: bookingDetails.guestCount || 0,
        };
      } else if (bookingDetails.type === 'table') {
        templateName = 'customer_table_booking_confirmation';
        variables = {
          ...variables,
          tableNumber: bookingDetails.tableNumber || '',
          bookingTime: bookingDetails.time || '',
          partySize: bookingDetails.partySize || 1,
        };
      } else {
        // For room bookings, use the generic hall template (or could use customer_room_booking_confirmation)
        templateName = 'customer_hall_booking_confirmation';
        variables = {
          ...variables,
          hallName: 'Room',
          eventDate: bookingDetails.date,
          eventTime: bookingDetails.time || '',
          eventType: 'Room Booking',
          guestCount: bookingDetails.guestCount || 1,
        };
      }

      const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
        templateName,
        to,
        variables,
      });

      if (response.data.success) {
        logger.info('Booking confirmation email sent successfully via mail-service', {
          to,
          bookingId: bookingDetails.bookingId,
          templateName,
          emailId: response.data.data?.emailId,
        });
        return true;
      } else {
        logger.error('Failed to send booking confirmation email via mail-service', {
          to,
          bookingId: bookingDetails.bookingId,
          templateName,
          error: response.data.error?.message,
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Error sending booking confirmation email:', error, {
        to,
        bookingId: bookingDetails.bookingId,
        templateName,
        errorMessage: error.response?.data?.error?.message || error.message,
      });
      return false;
    }
  }

  public async sendCancellationNotification(
    to: string,
    customerName: string,
    cancellationDetails: {
      type: 'room' | 'table' | 'hall';
      bookingId: string;
      refundAmount?: number;
      cancellationReason?: string;
      tableNumber?: string;
      hallName?: string;
      roomNumber?: string;
    }
  ): Promise<boolean> {
    // Determine template based on cancellation type
    let templateName: string = '';
    let variables: Record<string, any> = {
      customerName,
      customerEmail: to,
      bookingNumber: cancellationDetails.bookingId,
      cancellationReason: cancellationDetails.cancellationReason || 'Customer request',
      refundAmount: cancellationDetails.refundAmount || 0,
      hasRefund: cancellationDetails.refundAmount ? 'true' : 'false',
    };

    try {
      if (cancellationDetails.type === 'hall') {
        templateName = 'customer_hall_booking_cancellation';
        variables = {
          ...variables,
          hallName: cancellationDetails.hallName || 'Hall',
        };
      } else if (cancellationDetails.type === 'table') {
        templateName = 'customer_table_booking_cancellation';
        variables = {
          ...variables,
          tableNumber: cancellationDetails.tableNumber || '',
        };
      } else {
        // For room cancellations
        templateName = 'customer_room_booking_cancellation';
        variables = {
          ...variables,
          roomNumber: cancellationDetails.roomNumber || '',
        };
      }

      const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
        templateName,
        to,
        variables,
      });

      if (response.data.success) {
        logger.info('Cancellation notification email sent successfully via mail-service', {
          to,
          bookingId: cancellationDetails.bookingId,
          templateName,
          emailId: response.data.data?.emailId,
        });
        return true;
      } else {
        logger.error('Failed to send cancellation notification email via mail-service', {
          to,
          bookingId: cancellationDetails.bookingId,
          templateName,
          error: response.data.error?.message,
        });
        return false;
      }
    } catch (error: any) {
      logger.error('Error sending cancellation notification email:', error, {
        to,
        bookingId: cancellationDetails.bookingId,
        templateName,
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
