import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { FileAttachmentService } from '../services/fileAttachment.service.js';
import { asyncHandler, authenticateToken } from '../middleware/auth.middleware.js';

const fileService = new FileAttachmentService();

// Upload file (safe - creates new records only)
export const uploadFile = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  
  if (!userId) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  if (!req.file) {
    return {
      success: false,
      error: 'No file provided'
    };
  }

  return await fileService.uploadFile(
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    userId
  );
});

// Get user's files (safe - read-only)
export const getUserFiles = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (!userId) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  return await fileService.getFilesByUser(userId, page, limit);
});

// Attach file to existing item (safe - adds reference only)
export const attachFile = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const { fileId, attachedTo, attachedToId } = req.body;
  
  if (!userId) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  if (!fileId || !attachedTo || !attachedToId) {
    return {
      success: false,
      error: 'File ID, attachment type, and attachment ID are required'
    };
  }

  return await fileService.attachToFile(fileId, attachedTo, attachedToId);
});

// Get files attached to specific item (safe - read-only)
export const getItemFiles = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const { attachedTo, attachedToId } = req.params;
  
  if (!attachedTo || !attachedToId) {
    return {
      success: false,
      error: 'Attachment type and ID are required'
    };
  }

  return await fileService.getFilesByItem(attachedTo, attachedToId);
});

// Soft delete file (safe - doesn't remove data)
export const deleteFile = asyncHandler(async (req: Request, res: Response): Promise<ApiResponse> => {
  const userId = req.user?.userId;
  const { fileId } = req.params;
  
  if (!userId) {
    return {
      success: false,
      error: 'Authentication required'
    };
  }

  if (!fileId) {
    return {
      success: false,
      error: 'File ID is required'
    };
  }

  return await fileService.softDeleteFile(fileId, userId);
});
