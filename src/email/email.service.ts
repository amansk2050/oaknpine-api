import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress = 'noreply@pinezone.com';

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');
    const from = this.configService.get<string>('SMTP_FROM');

    if (from) {
      this.fromAddress = from;
    }

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log(`SMTP Email Transporter configured: ${host}:${port}`);
    } else {
      this.logger.log(
        'SMTP config missing. Email Service running in Dev/Log fallback mode.',
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<boolean> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          text,
          html: html || text,
        });
        this.logger.log(`Email successfully sent to ${to}: "${subject}"`);
        return true;
      } catch (err) {
        this.logger.error(
          `Failed to send email to ${to}: ${err.message}`,
          err.stack,
        );
        return false;
      }
    } else {
      this.logger.log(`[DEV EMAIL SENT]
To: ${to}
Subject: ${subject}
Content: ${text}`);
      return true;
    }
  }

  async sendBookingConfirmation(
    toEmail: string,
    guestName: string,
    bookingRef: string,
    checkIn: string,
    checkOut: string,
    homestayName: string,
  ): Promise<boolean> {
    const subject = `Booking Confirmation - ${bookingRef}`;
    const text = `Dear ${guestName},

Thank you for booking with us!
Your booking at ${homestayName} has been confirmed.

Booking Reference: ${bookingRef}
Check-in Date: ${checkIn}
Check-out Date: ${checkOut}

We look forward to hosting you.

Warm regards,
The ${homestayName} Team`;

    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">Booking Confirmed!</h2>
        <p>Dear <strong>${guestName}</strong>,</p>
        <p>Thank you for choosing <strong>${homestayName}</strong>. Your reservation has been successfully processed.</p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #f3f4f6;">
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Booking Reference</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-family: monospace; font-weight: bold; color: #4f46e5;">${bookingRef}</td>
          </tr>
          <tr>
            <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Homestay</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${homestayName}</td>
          </tr>
          <tr style="background-color: #f9fafb;">
            <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Check-in Date</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${checkIn}</td>
          </tr>
          <tr>
            <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Check-out Date</th>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${checkOut}</td>
          </tr>
        </table>
        
        <p>If you have any questions or need to make adjustments, please contact us.</p>
        <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #9ca3af;">
          This is an automated confirmation email.
        </p>
      </div>
    `;

    return this.sendEmail(toEmail, subject, text, html);
  }

  async sendPasswordResetLink(
    toEmail: string,
    resetUrl: string,
  ): Promise<boolean> {
    const subject = 'Reset Your Password - PineZone CRM';
    const text = `Hello,

You requested a password reset. Please use the following link to reset your password. This link is valid for 1 hour:

${resetUrl}

If you did not request this, you can safely ignore this email.

Best regards,
PineZone CRM Team`;

    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset the password for your account. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #4f46e5;"><a href="${resetUrl}">${resetUrl}</a></p>
        
        <p>This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        
        <p style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; font-size: 12px; color: #9ca3af;">
          This is an automated security email.
        </p>
      </div>
    `;

    return this.sendEmail(toEmail, subject, text, html);
  }
}
