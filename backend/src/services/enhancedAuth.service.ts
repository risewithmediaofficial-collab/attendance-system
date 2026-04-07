import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ApiResponse, JwtPayload } from '../types/index.js';
import { EmailService } from './email.service.js';
import { User, CompanySettings } from '../models/enhancedModels.js';

export class EnhancedAuthService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // Register user with email verification
  async register(userData: {
    username: string;
    email: string;
    password: string;
    memberId: string;
  }): Promise<ApiResponse> {
    try {
      // Check if user exists
      const existingUser = await User.findOne({
        $or: [{ email: userData.email }, { username: userData.username }]
      });

      if (existingUser) {
        return {
          success: false,
          error: existingUser.email === userData.email ? 'Email already exists' : 'Username already exists'
        };
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      // Generate verification token
      const { token, expiry } = this.emailService.generateToken();

      // Create user
      const user = new User({
        _id: `user_${Date.now()}`,
        ...userData,
        passwordHash,
        emailVerificationToken: token,
        emailVerificationExpires: expiry,
        isEmailVerified: false,
      });

      await user.save();

      // Send verification email
      await this.emailService.sendEmailVerification(userData.email, token);

      return {
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        data: {
          userId: user._id,
          email: user.email,
          isEmailVerified: false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired verification token'
        };
      }

      // Mark as verified
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email verification failed'
      };
    }
  }

  // Login with email verification check
  async login(email: string, password: string): Promise<ApiResponse> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Check if user has email set up
      if (!user.email || user.email.trim() === '') {
        return {
          success: false,
          error: 'EMAIL_NOT_SET_UP',
          message: 'Your account does not have an email address set. Please contact your administrator to set up your email.'
        };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return {
          success: false,
          error: 'Please verify your email before logging in'
        };
      }

      // Check account lock
      if (user.lockUntil && user.lockUntil > Date.now()) {
        return {
          success: false,
          error: 'Account temporarily locked. Try again later.'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);

      if (!isValidPassword) {
        // Increment login attempts
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        
        // Lock account after 5 attempts
        if (user.loginAttempts >= 5) {
          user.lockUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
        }
        
        await user.save();
        
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Reset login attempts on successful login
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      // Generate JWT tokens
      const payload: JwtPayload = {
        userId: user._id,
        username: user.username,
        role: 'user', // Get from member data
        iat: Math.floor(Date.now() / 1000)
      };

      const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '15m'
      });

      const refreshToken = jwt.sign(
        { userId: user._id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            isEmailVerified: user.isEmailVerified
          },
          accessToken,
          refreshToken,
          expiresIn: 900
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

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        // Don't reveal if email exists or not
        return {
          success: false,
          error: 'No user account found with this email'
        };
      }

      // Check if user has email set up
      if (!user.email || user.email.trim() === '') {
        return {
          success: false,
          error: 'EMAIL_NOT_SET_UP',
          message: 'Your account does not have an email address. Please add your email address first to reset your password.'
        };
      }

      // Generate reset token (1 hour expiry)
      const { token, expiry } = this.emailService.generateToken();
      const resetExpiry = expiry - (23 * 60 * 60 * 1000); // 1 hour instead of 24 hours

      user.passwordResetToken = token;
      user.passwordResetExpires = resetExpiry;
      await user.save();

      // Send reset email
      await this.emailService.sendPasswordReset(email, token);

      return {
        success: true,
        message: 'Password reset link sent to your email'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send reset email'
      };
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired reset token'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      user.passwordHash = passwordHash;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.lastPasswordReset = Date.now();
      await user.save();

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  // Change password (logged-in user)
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Verify old password
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.passwordHash);

      if (!isValidOldPassword) {
        return {
          success: false,
          error: 'Current password is incorrect'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.passwordHash = passwordHash;
      user.lastPasswordReset = Date.now();
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed'
      };
    }
  }

  // Check if user has email set up
  async checkEmailStatus(userId: string): Promise<ApiResponse> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      const hasEmail = user.email && user.email.trim() !== '';

      return {
        success: true,
        data: {
          userId,
          hasEmail,
          email: hasEmail ? user.email : null,
          isEmailVerified: user.isEmailVerified || false,
          message: hasEmail ? 'Email is set up' : 'Email is not set up for this account'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check email status'
      };
    }
  }

  // Update or add email address for user
  async updateEmail(userId: string, newEmail: string): Promise<ApiResponse> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Check if email is already in use by another user
      const existingUser = await User.findOne({ 
        email: newEmail.trim().toLowerCase(),
        _id: { $ne: userId }
      });

      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered to another account'
        };
      }

      // Generate new verification token
      const { token, expiry } = this.emailService.generateToken();

      // Update email and reset verification
      user.email = newEmail.trim().toLowerCase();
      user.isEmailVerified = false;
      user.emailVerificationToken = token;
      user.emailVerificationExpires = expiry;
      await user.save();

      // Send verification email
      await this.emailService.sendEmailVerification(newEmail.trim().toLowerCase(), token);

      return {
        success: true,
        message: 'Email updated successfully. Please check your email to verify.'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update email'
      };
    }
  }
}
