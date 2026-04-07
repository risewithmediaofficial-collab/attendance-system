import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { ApiResponse } from '../types/index.js';

export class PasswordResetEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Generate secure reset token
  generateResetToken(): { token: string; hashedToken: string; expiry: number } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = Date.now() + (30 * 60 * 1000); // 30 minutes
    
    return { token, hashedToken, expiry };
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<ApiResponse> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@risewithmedia.com',
        to: email,
        subject: 'Password Reset Request - RISE WITH MEDIA',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
              <h1 style="color: #3b82f6; margin-bottom: 20px;">🔐 Password Reset</h1>
              <p style="color: #495057; font-size: 16px; margin-bottom: 25px;">
                You requested to reset your password. Click the button below to set a new password.
              </p>
              <a href="${resetUrl}" 
                 style="background-color: #3b82f6; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 8px; font-size: 16px; 
                        font-weight: bold; display: inline-block; margin: 20px 0;">
                Reset Password
              </a>
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; 
                          padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>⚠️ Security Notice:</strong><br>
                  • This link will expire in 30 minutes<br>
                  • If you didn't request this, please ignore this email<br>
                  • Never share this link with anyone
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px; color: #6c757d; font-size: 12px;">
              <p>© 2024 RISE WITH MEDIA. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        `,
      });

      return { success: true, message: 'Password reset email sent successfully' };
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
