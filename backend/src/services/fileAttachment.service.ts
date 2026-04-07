import { ApiResponse } from '../types/index.js';
import { FileAttachment } from '../models/fileAttachment.model.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (safe - no database changes)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class FileAttachmentService {
  
  // Upload file to Cloudinary (safe operation)
  async uploadFile(file: Buffer, originalName: string, mimeType: string, uploadedBy: string): Promise<ApiResponse> {
    try {
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'company-documents',
            public_id: `doc_${Date.now()}_${originalName}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file);
      });

      const cloudinaryResult = result as any;

      // Save file metadata to database (NEW collection - safe)
      const fileAttachment = new FileAttachment({
        _id: `file_${Date.now()}`,
        originalName,
        fileName: cloudinaryResult.public_id,
        mimeType,
        size: file.length,
        url: cloudinaryResult.secure_url,
        uploadedBy,
        attachedTo: 'Task', // Default, can be updated later
        attachedToId: '', // Will be set when attached to specific item
        uploadedAt: Date.now(),
      });

      await fileAttachment.save();

      return {
        success: true,
        data: {
          fileId: fileAttachment._id,
          url: cloudinaryResult.secure_url,
          originalName,
          size: file.length,
          mimeType
        },
        message: 'File uploaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File upload failed'
      };
    }
  }

  // Get files by user (safe - read-only)
  async getFilesByUser(uploadedBy: string, page = 1, limit = 10): Promise<ApiResponse> {
    try {
      const skip = (page - 1) * limit;
      
      const files = await FileAttachment.find({
        uploadedBy,
        isDeleted: false
      })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('originalName fileName url size mimeType uploadedAt attachedTo')
      .exec();

      const total = await FileAttachment.countDocuments({
        uploadedBy,
        isDeleted: false
      });

      return {
        success: true,
        data: {
          files,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get files'
      };
    }
  }

  // Attach file to existing item (safe - adds reference only)
  async attachToFile(fileId: string, attachedTo: string, attachedToId: string): Promise<ApiResponse> {
    try {
      await FileAttachment.updateOne(
        { _id: fileId, isDeleted: false },
        { 
          attachedTo,
          attachedToId,
          updatedAt: Date.now()
        }
      );

      return {
        success: true,
        message: 'File attached successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to attach file'
      };
    }
  }

  // Soft delete file (safe - doesn't lose data)
  async softDeleteFile(fileId: string, userId: string): Promise<ApiResponse> {
    try {
      await FileAttachment.updateOne(
        { _id: fileId, uploadedBy: userId },
        { 
          isDeleted: true,
          deletedAt: Date.now()
        }
      );

      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file'
      };
    }
  }

  // Get files attached to specific item (safe - read-only)
  async getFilesByItem(attachedTo: string, attachedToId: string): Promise<ApiResponse> {
    try {
      const files = await FileAttachment.find({
        attachedTo,
        attachedToId,
        isDeleted: false
      })
      .sort({ uploadedAt: -1 })
      .select('originalName url size mimeType uploadedBy uploadedAt')
      .exec();

      return {
        success: true,
        data: files
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get attached files'
      };
    }
  }

  // Delete file from Cloudinary (safe - removes orphaned files only)
  async deleteFromCloudinary(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      return false;
    }
  }
}
