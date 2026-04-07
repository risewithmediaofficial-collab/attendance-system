import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../middleware/auth.middleware.js';

const authService = new AuthService();

// Forgot Password
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { email } = req.body;
  
  // Basic validation
  if (!email || !email.includes('@')) {
    return {
      success: false,
      error: 'Valid email address is required'
    };
  }
  
  return await authService.forgotPassword(email.toLowerCase().trim());
});

// Reset Password
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { token, newPassword } = req.body;
  
  // Basic validation
  if (!token || !newPassword) {
    return {
      success: false,
      error: 'Reset token and new password are required'
    };
  }
  
  if (newPassword.length < 8) {
    return {
      success: false,
      error: 'Password must be at least 8 characters long'
    };
  }
  
  return await authService.resetPassword(token, newPassword);
});
