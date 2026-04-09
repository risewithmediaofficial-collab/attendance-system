import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { ApiResponse } from '../types/index.js';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  private getFrontendBaseUrl(): string {
    const configured = process.env.FRONTEND_URL?.trim();
    if (configured) {
      return configured.replace(/\/$/, '');
    }

    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    if (corsOrigin && corsOrigin !== '*') {
      return corsOrigin.replace(/\/$/, '');
    }

    return 'http://localhost:5173';
  }

  // Generate secure token with expiry
  generateToken(): { token: string; hashedToken: string; expiry: number } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    return { token, hashedToken, expiry };
  }

  // Hash a token for comparison
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Send email verification
  async sendEmailVerification(email: string, token: string): Promise<ApiResponse> {
    try {
      const verificationUrl = `${this.getFrontendBaseUrl()}/verify-email?token=${token}`;
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@risewithmedia.com',
        to: email,
        subject: 'Verify Your Email - RISE WITH MEDIA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Welcome to RISE WITH MEDIA!</h2>
            <p>Please verify your email address to complete your registration.</p>
            <a href="${verificationUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Verify Email
            </a>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 24 hours.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
        `,
      });

      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification email'
      };
    }
  }

  // Send password reset email
  async sendPasswordReset(email: string, token: string): Promise<ApiResponse> {
    try {
      const resetUrl = `${this.getFrontendBaseUrl()}/reset-password?token=${token}`;
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@risewithmedia.com',
        to: email,
        subject: 'Reset Your Password - RISE WITH MEDIA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Password Reset Request</h2>
            <p>You requested to reset your password. Click the link below to set a new password.</p>
            <a href="${resetUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour.<br>
              If you didn't request this, please secure your account immediately.
            </p>
          </div>
        `,
      });

      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send password reset email'
      };
    }
  }

  // Test email configuration
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }
}
