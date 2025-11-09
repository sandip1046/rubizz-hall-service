"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
class EmailService {
    constructor() {
        this.mailServiceClient = axios_1.default.create({
            baseURL: config_1.config.services.mailService,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    async sendEmail(options) {
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
                    logger_1.logger.info('Email sent successfully via mail-service', {
                        emailId: response.data.data?.emailId,
                        to: recipient,
                        subject: options.subject,
                    });
                }
                else {
                    logger_1.logger.error('Failed to send email via mail-service', {
                        to: recipient,
                        subject: options.subject,
                        error: response.data.error?.message,
                    });
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error sending email via mail-service:', error, {
                to: options.to,
                subject: options.subject,
                errorMessage: error.response?.data?.error?.message || error.message,
            });
            return false;
        }
    }
    async sendWelcomeEmail(to, name) {
        try {
            const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
                templateName: 'hall_welcome',
                to,
                variables: {
                    name,
                },
            });
            if (response.data.success) {
                logger_1.logger.info('Welcome email sent successfully via mail-service', {
                    to,
                    emailId: response.data.data?.emailId,
                });
                return true;
            }
            else {
                logger_1.logger.error('Failed to send welcome email via mail-service', {
                    to,
                    error: response.data.error?.message,
                });
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending welcome email:', error, {
                to,
                errorMessage: error.response?.data?.error?.message || error.message,
            });
            return false;
        }
    }
    async sendBookingConfirmation(to, bookingDetails) {
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
                logger_1.logger.info('Booking confirmation email sent successfully via mail-service', {
                    to,
                    bookingId: bookingDetails.bookingId,
                    emailId: response.data.data?.emailId,
                });
                return true;
            }
            else {
                logger_1.logger.error('Failed to send booking confirmation email via mail-service', {
                    to,
                    bookingId: bookingDetails.bookingId,
                    error: response.data.error?.message,
                });
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending booking confirmation email:', error, {
                to,
                bookingId: bookingDetails.bookingId,
                errorMessage: error.response?.data?.error?.message || error.message,
            });
            return false;
        }
    }
    async sendCancellationNotification(to, cancellationDetails) {
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
                logger_1.logger.info('Cancellation notification email sent successfully via mail-service', {
                    to,
                    bookingId: cancellationDetails.bookingId,
                    emailId: response.data.data?.emailId,
                });
                return true;
            }
            else {
                logger_1.logger.error('Failed to send cancellation notification email via mail-service', {
                    to,
                    bookingId: cancellationDetails.bookingId,
                    error: response.data.error?.message,
                });
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending cancellation notification email:', error, {
                to,
                bookingId: cancellationDetails.bookingId,
                errorMessage: error.response?.data?.error?.message || error.message,
            });
            return false;
        }
    }
    async sendPasswordResetEmail(to, resetToken) {
        try {
            const resetUrl = `${config_1.config.apiGateway.url}/reset-password?token=${resetToken}`;
            const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
                templateName: 'hall_password_reset',
                to,
                variables: {
                    resetUrl,
                },
            });
            if (response.data.success) {
                logger_1.logger.info('Password reset email sent successfully via mail-service', {
                    to,
                    emailId: response.data.data?.emailId,
                });
                return true;
            }
            else {
                logger_1.logger.error('Failed to send password reset email via mail-service', {
                    to,
                    error: response.data.error?.message,
                });
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending password reset email:', error, {
                to,
                errorMessage: error.response?.data?.error?.message || error.message,
            });
            return false;
        }
    }
    async sendOTPEmail(to, otp) {
        try {
            const response = await this.mailServiceClient.post('/api/v1/mail/send-template', {
                templateName: 'hall_otp_verification',
                to,
                variables: {
                    otp,
                },
            });
            if (response.data.success) {
                logger_1.logger.info('OTP email sent successfully via mail-service', {
                    to,
                    emailId: response.data.data?.emailId,
                });
                return true;
            }
            else {
                logger_1.logger.error('Failed to send OTP email via mail-service', {
                    to,
                    error: response.data.error?.message,
                });
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending OTP email:', error, {
                to,
                errorMessage: error.response?.data?.error?.message || error.message,
            });
            return false;
        }
    }
    async verifyConnection() {
        try {
            const response = await this.mailServiceClient.get('/health');
            logger_1.logger.info('Mail service connection verified successfully');
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Mail service connection verification failed:', error);
            return false;
        }
    }
}
exports.emailService = EmailService.getInstance();
exports.default = exports.emailService;
//# sourceMappingURL=EmailService.js.map