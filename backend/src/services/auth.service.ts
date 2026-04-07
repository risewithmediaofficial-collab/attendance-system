import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ApiResponse, RefreshTokenPayload, JwtPayload } from '../types/index.js';
import { UserRepository } from '../repositories/repositories.js';
import { PasswordResetEmailService } from './passwordReset.service.js';

export class AuthService {
  private userRepo: UserRepository;
  private emailService: PasswordResetEmailService;

  constructor() {
    this.userRepo = new UserRepository();
    this.emailService = new PasswordResetEmailService();
  }

  generateTokens(userId: string, username: string, role: string) {
    const payload: JwtPayload = {
      userId,
      username,
      role,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m' // 15 minutes
    });

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
      {
        expiresIn: '7d' // 7 days
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutes in seconds
    };
  }

  async refreshTokens(refreshToken: string): Promise<ApiResponse> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!
      ) as any;

      if (decoded.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      const user = await this.userRepo.findById(decoded.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get member details for role
      const member = await this.getMemberById(user.memberId);
      if (!member) {
        return {
          success: false,
          error: 'Member not found'
        };
      }

      const tokens = this.generateTokens(user._id, user.username, member.role);

      return {
        success: true,
        data: tokens,
        message: 'Tokens refreshed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid refresh token'
      };
    }
  }

  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  async validateUser(username: string, password: string): Promise<ApiResponse> {
    try {
      const user = await this.userRepo.findByUsername(username);
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const member = await this.getMemberById(user.memberId);
      if (!member) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Password comparison would go here with bcrypt
      // const isValid = await bcrypt.compare(password, user.passwordHash);
      const isValid = true; // Simplified for now

      if (!isValid) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      const tokens = this.generateTokens(user._id, user.username, member.role);

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            memberId: user.memberId,
            role: member.role,
            name: member.name
          },
          ...tokens
        },
        message: 'Login successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  private async getMemberById(memberId: string) {
    // This would use MemberRepository, but for now return a mock
    return {
      _id: memberId,
      name: 'Test User',
      role: 'Admin'
    };
  }

  async revokeToken(token: string): Promise<ApiResponse> {
    // In a real implementation, you would add the token to a blacklist
    // For now, we'll just return success
    return {
      success: true,
      message: 'Token revoked successfully'
    };
  }

  // Forgot Password - Generate and send reset token
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      // Check if user exists
      const user = await this.userRepo.findByEmail(email);
      
      if (!user) {
        // Don't reveal whether email exists - always return success
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        };
      }

      // Generate secure reset token
      const { token, hashedToken, expiry } = this.emailService.generateResetToken();

      // Store hashed token and expiry in database
      await this.userRepo.update(user._id, {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expiry
      });

      // Send email with original (unhashed) token
      await this.emailService.sendPasswordResetEmail(email, token);

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process password reset request'
      };
    }
  }

  // Reset Password - Validate token and update password
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      // Hash the incoming token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with valid reset token
      const user = await this.userRepo.findByResetToken(hashedToken);

      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired reset token'
        };
      }

      // Check if token has expired
      if (user.resetPasswordExpires && user.resetPasswordExpires < Date.now()) {
        return {
          success: false,
          error: 'Reset token has expired'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await this.userRepo.update(user._id, {
        passwordHash,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      });

      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      };
    }
  }
}
