import { ApiResponse } from '../types/index.js';
import { User, Task, AttendanceRecord, Member } from '../models.js';
import { FileAttachment } from '../models/fileAttachment.model.js';
import { CustomStatus } from '../models/customStatus.model.js';

export class AdvancedSearchService {
  
  // Global search across multiple collections (safe - read-only operations)
  async globalSearch(query: string, userId: string, filters: {
    type?: 'all' | 'tasks' | 'attendance' | 'files' | 'members';
    dateRange?: { start: string; end: string };
    status?: string;
    priority?: string;
  } = {}): Promise<ApiResponse> {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: false,
          error: 'Search query must be at least 2 characters'
        };
      }

      const searchRegex = new RegExp(query.trim(), 'i');
      const results: any = {
        tasks: [],
        attendance: [],
        files: [],
        members: []
      };

      // Search tasks (safe - read-only)
      if (!filters.type || filters.type === 'all' || filters.type === 'tasks') {
        const taskFilter: any = {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { assignedTo: searchRegex }
          ]
        };

        if (filters.status) {
          taskFilter.status = filters.status;
        }
        if (filters.priority) {
          taskFilter.priority = filters.priority;
        }
        if (filters.dateRange) {
          taskFilter.deadline = {
            $gte: filters.dateRange.start,
            $lte: filters.dateRange.end
          };
        }

        results.tasks = await Task.find(taskFilter)
          .select('title description status priority deadline assignedTo createdAt')
          .sort({ createdAt: -1 })
          .limit(20)
          .exec();
      }

      // Search attendance records (safe - read-only)
      if (!filters.type || filters.type === 'all' || filters.type === 'attendance') {
        const attendanceFilter: any = {
          $or: [
            { date: searchRegex },
            { status: searchRegex },
            { notes: searchRegex }
          ]
        };

        if (filters.dateRange) {
          attendanceFilter.date = {
            $gte: filters.dateRange.start,
            $lte: filters.dateRange.end
          };
        }

        results.attendance = await AttendanceRecord.find(attendanceFilter)
          .select('date loginTime logoutTime status notes')
          .sort({ date: -1 })
          .limit(20)
          .exec();
      }

      // Search files (safe - read-only)
      if (!filters.type || filters.type === 'all' || filters.type === 'files') {
        const fileFilter: any = {
          $or: [
            { originalName: searchRegex },
            { fileName: searchRegex },
            { mimeType: searchRegex }
          ],
          isDeleted: false
        };

        results.files = await FileAttachment.find(fileFilter)
          .select('originalName url size mimeType uploadedAt attachedTo')
          .sort({ uploadedAt: -1 })
          .limit(20)
          .exec();
      }

      // Search members (safe - read-only, admin only)
      if (!filters.type || filters.type === 'all' || filters.type === 'members') {
        const memberFilter: any = {
          $or: [
            { name: searchRegex },
            { role: searchRegex }
          ]
        };

        results.members = await Member.find(memberFilter)
          .select('name role avatarSeed')
          .sort({ name: 1 })
          .limit(20)
          .exec();
      }

      return {
        success: true,
        data: {
          query,
          filters,
          results,
          total: results.tasks.length + results.attendance.length + results.files.length + results.members.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  // Quick filters (safe - read-only)
  async getQuickFilters(userId: string): Promise<ApiResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const results: any = {
        myTasksToday: [],
        myTasksOverdue: [],
        myRecentFiles: [],
        recentAttendance: []
      };

      // User's tasks due today (safe - read-only)
      results.myTasksToday = await Task.find({
        assignedTo: userId,
        deadline: { $lte: today },
        status: { $ne: 'Completed' }
      })
      .select('title deadline priority status')
      .sort({ deadline: 1 })
      .limit(5)
      .exec();

      // User's overdue tasks (safe - read-only)
      results.myTasksOverdue = await Task.find({
        assignedTo: userId,
        deadline: { $lt: today },
        status: { $ne: 'Completed' }
      })
      .select('title deadline priority status')
      .sort({ deadline: 1 })
      .limit(5)
      .exec();

      // User's recent files (safe - read-only)
      results.myRecentFiles = await FileAttachment.find({
        uploadedBy: userId,
        isDeleted: false
      })
      .select('originalName url uploadedAt')
      .sort({ uploadedAt: -1 })
      .limit(5)
      .exec();

      // Recent attendance (safe - read-only)
      results.recentAttendance = await AttendanceRecord.find({
        memberId: userId
      })
      .select('date loginTime logoutTime status')
      .sort({ date: -1 })
      .limit(5)
      .exec();

      return {
        success: true,
        data: results
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get quick filters'
      };
    }
  }

  // Search suggestions (safe - read-only)
  async getSearchSuggestions(query: string, userId: string): Promise<ApiResponse> {
    try {
      if (!query || query.length < 2) {
        return {
          success: true,
          data: []
        };
      }

      const searchRegex = new RegExp(query.trim(), 'i');
      const suggestions: any = {
        tasks: [],
        members: []
      };

      // Task title suggestions (safe - read-only)
      const taskTitles = await Task.find({
        title: searchRegex,
        assignedTo: userId
      })
      .select('title')
      .limit(5)
      .exec();

      suggestions.tasks = taskTitles.map(task => task.title);

      // Member name suggestions (safe - read-only)
      const memberNames = await Member.find({
        name: searchRegex
      })
      .select('name')
      .limit(5)
      .exec();

      suggestions.members = memberNames.map(member => member.name);

      return {
        success: true,
        data: suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get suggestions'
      };
    }
  }
}
