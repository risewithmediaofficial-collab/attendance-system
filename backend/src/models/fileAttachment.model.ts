import mongoose from "mongoose";

// File Attachment Schema - NEW collection (won't affect existing data)
const FileAttachmentSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: String, required: true, ref: 'User' },
    attachedTo: { 
      type: { 
        type: String, 
        enum: ['Task', 'Attendance', 'Report', 'Member'],
        required: true 
      } 
    },
    attachedToId: { type: String, required: true },
    uploadedAt: { type: Number, required: true },
    isDeleted: { type: Boolean, default: false }, // Soft delete
  },
  { _id: false },
);

// Performance indexes for FileAttachment
FileAttachmentSchema.index({ uploadedBy: 1, uploadedAt: -1 });
FileAttachmentSchema.index({ attachedTo: 1, attachedToId: 1 });
FileAttachmentSchema.index({ isDeleted: 1 }); // For soft delete queries

export const FileAttachment = mongoose.model("FileAttachment", FileAttachmentSchema);
