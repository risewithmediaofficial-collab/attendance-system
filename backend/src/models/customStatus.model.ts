import mongoose from "mongoose";

// Custom Status Schema - NEW collection (won't affect existing data)
const CustomStatusSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true }, // Hex color code
    type: { 
      type: String, 
      enum: ['Task', 'Project', 'Attendance'],
      required: true 
    },
    createdBy: { type: String, required: true, ref: 'User' },
    isDefault: { type: Boolean, default: false }, // System default statuses
    isActive: { type: Boolean, default: true },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
  },
  { _id: false },
);

// Performance indexes for CustomStatus
CustomStatusSchema.index({ type: 1, isActive: 1 });
CustomStatusSchema.index({ createdBy: 1 });
CustomStatusSchema.index({ name: 1 });

export const CustomStatus = mongoose.model("CustomStatus", CustomStatusSchema);
