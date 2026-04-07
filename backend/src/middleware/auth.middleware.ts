import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<ApiResponse>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next))
      .then((result) => {
        res.status(200).json(result);
      })
      .catch((error) => {
        const response: ApiResponse = {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error'
        };
        res.status(500).json(response);
      });
  };
};

export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const response: ApiResponse = {
        success: false,
        error: error.details[0].message
      };
      return res.status(400).json(response);
    }
    next();
  };
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    const response: ApiResponse = {
      success: false,
      error: 'Access token required'
    };
    return res.status(401).json(response);
  }

  // JWT verification will be implemented here
  // For now, just pass through
  next();
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Role checking will be implemented here
    // For now, just pass through
    next();
  };
};
