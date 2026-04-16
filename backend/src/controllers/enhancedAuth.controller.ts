import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { EnhancedAuthService } from '../services/enhancedAuth.service.js';
import { asyncHandler, authenticateToken } from '../middleware/auth.middleware.js';

const authService = new EnhancedAuthService();

// Register with email verification
export const register = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { username, email, password, memberId } = req.body;
  
  return await authService.register({
    username,
    email,
    password,
    memberId
  });
});

// Verify email
export const verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { token } = req.query;
  
  if (!token || typeof token !== 'string') {
    return {
      success: false,
      error: 'Verification token is required'
    };
  }
  
  return await authService.verifyEmail(token);
});

// Login
export const login = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { email, password } = req.body;
  
  return await authService.login(email, password);
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { email } = req.body;
  
  return await authService.forgotPassword(email);
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { token, newPassword } = req.body;
  
  return await authService.resetPassword(token, newPassword);
});

// Change password (authenticated user)
export const changePassword = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const { oldPassword, newPassword } = req.body;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  return await authService.changePassword(userId, oldPassword, newPassword);
});

// Check if user has email set up
export const checkEmailStatus = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  return await authService.checkEmailStatus(userId);
});

// Update email address
export const updateEmail = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const { email } = req.body;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: 'Invalid email address'
    };
  }
  
  return await authService.updateEmail(userId, email);
});

// Send verification email (resend for already added email)
export const sendVerificationEmail = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return {
      success: false,
      error: 'User not authenticated'
    };
  }
  
  return await authService.sendVerificationEmail(userId);
});
