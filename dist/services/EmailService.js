"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
class EmailService {
    constructor() {
        this.smtpTransporter = nodemailer_1.default.createTransport({
            host: config_1.config.email.smtp.host,
            port: config_1.config.email.smtp.port,
            secure: false,
            auth: {
                user: config_1.config.email.smtp.auth.user,
                pass: config_1.config.email.smtp.auth.pass,
            },
        });
        this.brevoTransporter = nodemailer_1.default.createTransport({
            host: config_1.config.email.brevo.host,
            port: config_1.config.email.brevo.port,
            secure: false,
            auth: {
                user: config_1.config.email.brevo.auth.user,
                pass: config_1.config.email.brevo.auth.pass,
            },
        });
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    setupEventHandlers() {
        this.smtpTransporter.on('token', (token) => {
            logger_1.logger.debug('SMTP OAuth2 token generated:', token);
        });
        this.brevoTransporter.on('token', (token) => {
            logger_1.logger.debug('Brevo OAuth2 token generated:', token);
        });
    }
    async sendEmail(options, useBrevo = true) {
        const transporter = useBrevo ? this.brevoTransporter : this.smtpTransporter;
        const provider = useBrevo ? 'Brevo' : 'SMTP';
        try {
            const mailOptions = {
                from: {
                    name: config_1.config.email.from.name,
                    address: config_1.config.email.from.email,
                },
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments,
            };
            const info = await transporter.sendMail(mailOptions);
            logger_1.logger.info('Email sent successfully', {
                provider,
                messageId: info.messageId,
                to: options.to,
                subject: options.subject,
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error(`Email sending failed via ${provider}:`, error);
            return false;
        }
    }
    async sendWelcomeEmail(to, name) {
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
    async sendBookingConfirmation(to, bookingDetails) {
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
    async sendCancellationNotification(to, cancellationDetails) {
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
    async sendPasswordResetEmail(to, resetToken) {
        const subject = 'Password Reset - Rubizz Hotel Inn';
        const resetUrl = `${config_1.config.apiGateway.url}/reset-password?token=${resetToken}`;
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
    async sendOTPEmail(to, otp) {
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
    async verifyConnection(useBrevo = true) {
        const transporter = useBrevo ? this.brevoTransporter : this.smtpTransporter;
        const provider = useBrevo ? 'Brevo' : 'SMTP';
        try {
            await transporter.verify();
            logger_1.logger.info(`${provider} email connection verified successfully`);
            return true;
        }
        catch (error) {
            logger_1.logger.error(`${provider} email connection verification failed:`, error);
            return false;
        }
    }
    async closeConnections() {
        try {
            await Promise.all([
                this.smtpTransporter.close(),
                this.brevoTransporter.close(),
            ]);
            logger_1.logger.info('Email connections closed successfully');
        }
        catch (error) {
            logger_1.logger.error('Error closing email connections:', error);
        }
    }
}
exports.emailService = EmailService.getInstance();
exports.default = exports.emailService;
//# sourceMappingURL=EmailService.js.map