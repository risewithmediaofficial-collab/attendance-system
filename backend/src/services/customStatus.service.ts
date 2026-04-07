import { ApiResponse } from '../types/index.js';
import { CustomStatus } from '../models/customStatus.model.js';

export class CustomStatusService {
  
  // Create custom status (safe - adds new records only)
  async createCustomStatus(statusData: {
    name: string;
    color: string;
    type: 'Task' | 'Project' | 'Attendance';
    createdBy: string;
  }): Promise<ApiResponse> {
    try {
      const customStatus = new CustomStatus({
        _id: `status_${Date.now()}`,
        ...statusData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await customStatus.save();

      return {
        success: true,
        data: customStatus,
        message: 'Custom status created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create custom status'
      };
    }
  }

  // Get custom statuses by type (safe - read-only)
  async getCustomStatuses(type: string, userId?: string): Promise<ApiResponse> {
    try {
      const filter: any = { type, isActive: true };
      
      // If userId provided, get user's statuses + default statuses
      if (userId) {
        filter.$or = [
          { createdBy: userId },
          { isDefault: true }
        ];
      } else {
        filter.createdBy = userId; // Only get specific user's statuses
      }

      const statuses = await CustomStatus.find(filter)
        .sort({ isDefault: -1, createdAt: -1 }) // Default statuses first
        .select('name color type isDefault createdBy createdAt')
        .exec();

      return {
        success: true,
        data: statuses
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get custom statuses'
      };
    }
  }

  // Update custom status (safe - modifies only specific record)
  async updateCustomStatus(statusId: string, userId: string, updateData: {
    name?: string;
    color?: string;
  }): Promise<ApiResponse> {
    try {
      // Ensure user can only update their own statuses (not default ones)
      const result = await CustomStatus.updateOne(
        { 
          _id: statusId, 
          createdBy: userId,
          isDefault: false 
        },
        {
          ...updateData,
          updatedAt: Date.now()
        }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Status not found or cannot be updated'
        };
      }

      return {
        success: true,
        message: 'Custom status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update custom status'
      };
    }
  }

  // Soft delete custom status (safe - doesn't remove data)
  async softDeleteCustomStatus(statusId: string, userId: string): Promise<ApiResponse> {
    try {
      // Cannot delete default statuses
      const result = await CustomStatus.updateOne(
        { 
          _id: statusId, 
          createdBy: userId,
          isDefault: false 
        },
        {
          isActive: false,
          updatedAt: Date.now()
        }
      );

      if (result.matchedCount === 0) {
        return {
          success: false,
          error: 'Status not found or cannot be deleted'
        };
      }

      return {
        success: true,
        message: 'Custom status deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete custom status'
      };
    }
  }

  // Initialize default custom statuses (safe - only if they don't exist)
  async initializeDefaultStatuses(): Promise<void> {
    try {
      const defaultStatuses = [
        // Task statuses
        { name: 'To Do', color: '#6B7280', type: 'Task', isDefault: true },
        { name: 'In Progress', color: '#3B82F6', type: 'Task', isDefault: true },
        { name: 'Review', color: '#F59E0B', type: 'Task', isDefault: true },
        { name: 'Done', color: '#10B981', type: 'Task', isDefault: true },
        
        // Project statuses
        { name: 'Planning', color: '#8B5CF6', type: 'Project', isDefault: true },
        { name: 'Active', color: '#10B981', type: 'Project', isDefault: true },
        { name: 'On Hold', color: '#F59E0B', type: 'Project', isDefault: true },
        { name: 'Completed', color: '#6B7280', type: 'Project', isDefault: true },
        
        // Attendance statuses
        { name: 'Present', color: '#10B981', type: 'Attendance', isDefault: true },
        { name: 'Late', color: '#F59E0B', type: 'Attendance', isDefault: true },
        { name: 'Half Day', color: '#F59E0B', type: 'Attendance', isDefault: true },
        { name: 'Absent', color: '#EF4444', type: 'Attendance', isDefault: true },
      ];

      for (const status of defaultStatuses) {
        const exists = await CustomStatus.findOne({ 
          name: status.name, 
          type: status.type,
          isDefault: true 
        });
        
        if (!exists) {
          const defaultStatus = new CustomStatus({
            _id: `default_${status.type}_${Date.now()}_${Math.random()}`,
            ...status,
            createdBy: 'system',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          await defaultStatus.save();
        }
      }
    } catch (error) {
      console.error('Failed to initialize default statuses:', error);
    }
  }
}
