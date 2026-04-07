/**
 * Validation Middleware
 * Express middleware for validating requests using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types/index.js';

/**
 * Validates request body against a Zod schema
 * If validation fails, returns 400 with error details
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: { errors: formattedErrors }
        };

        return res.status(400).json(response);
      }

      return res.status(400).json({
        success: false,
        error: 'Validation error'
      });
    }
  };
};

/**
 * Validates request query parameters against a Zod schema
 * If validation fails, returns 400 with error details
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: { errors: formattedErrors }
        };

        return res.status(400).json(response);
      }

      return res.status(400).json({
        success: false,
        error: 'Validation error'
      });
    }
  };
};

/**
 * Validates request parameters against a Zod schema
 * If validation fails, returns 400 with error details
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: { errors: formattedErrors }
        };

        return res.status(400).json(response);
      }

      return res.status(400).json({
        success: false,
        error: 'Validation error'
      });
    }
  };
};
