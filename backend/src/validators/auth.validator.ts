/**
 * Authentication Validation Schemas
 * Provides Zod schemas for request validation
 */

import { z } from 'zod';

// Common password pattern: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/;

/**
 * Register Request Validation
 * Validates: username, email, password, memberId
 */
export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and dashes'),
  
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase(),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordPattern, 'Password must contain uppercase, lowercase, number, and special character'),
  
  memberId: z
    .string()
    .min(1, 'Member ID is required')
});

export type RegisterRequest = z.infer<typeof RegisterSchema>;

/**
 * Email Verification Request Validation
 * Validates: token
 */
export const VerifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .min(64, 'Invalid token format')
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailSchema>;

/**
 * Login Request Validation
 * Validates: email, password
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase(),
  
  password: z
    .string()
    .min(1, 'Password is required')
});

export type LoginRequest = z.infer<typeof LoginSchema>;

/**
 * Forgot Password Request Validation
 * Validates: email
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset Password Request Validation
 * Validates: token, newPassword
 */
export const ResetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required')
    .min(64, 'Invalid token format'),
  
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordPattern, 'Password must contain uppercase, lowercase, number, and special character')
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;

/**
 * Change Password Request Validation
 * Validates: oldPassword, newPassword
 */
export const ChangePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(1, 'Current password is required'),
  
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(passwordPattern, 'Password must contain uppercase, lowercase, number, and special character')
}).refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword']
  }
);

export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;

/**
 * Refresh Token Request Validation
 * Validates: refreshToken
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required')
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;
