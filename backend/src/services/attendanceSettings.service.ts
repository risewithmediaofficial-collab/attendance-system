import { ApiResponse } from '../types/index.js';
import { AttendanceRecord, CompanySettings, Member, User } from '../models/enhancedModels.js';
import { randomUUID } from 'node:crypto';

export class AttendanceSettingsService {
  
  // Get current settings
  async getSettings(): Promise<ApiResponse> {
    try {
      let settings = await CompanySettings.findOne().lean();
      
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = {
          _id: `settings_${randomUUID()}`,
          officeStartTime: '09:00',
          officeEndTime: '18:00',
          lateThreshold: 15,
          halfDayThreshold: 4,
          autoCheckoutTime: '18:30',
          timezone: 'Asia/Kolkata',
          weekendDays: ['Saturday', 'Sunday'],
          attendanceCalculationMode: 'date-range',
          lastNDays: 30,
          presentDaysRequired: 1,
          updatedAt: Date.now()
        };
        
        await CompanySettings.create(defaultSettings);
        settings = defaultSettings;
      }

      return {
        success: true,
        data: {
          officeStartTime: settings.officeStartTime,
          officeEndTime: settings.officeEndTime,
          lateThreshold: settings.lateThreshold,
          halfDayThreshold: settings.halfDayThreshold,
          autoCheckoutTime: settings.autoCheckoutTime,
          timezone: settings.timezone,
          weekendDays: settings.weekendDays,
          attendancePercentageStartDate: settings.attendancePercentageStartDate,
          attendancePercentageEndDate: settings.attendancePercentageEndDate,
          attendanceCalculationMode: settings.attendanceCalculationMode || 'date-range',
          attendanceLastNDays: settings.attendanceLastNDays || 30,
          presentDaysRequired: settings.presentDaysRequired || 1,
          holidays: settings.holidays || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings'
      };
    }
  }

  // Update date range settings
  async updateDateRangeSettings(
    startDate: string,
    endDate: string,
    calculationMode?: string,
    lastNDays?: number,
    presentDaysRequired?: number
  ): Promise<ApiResponse> {
    try {
      let settings = await CompanySettings.findOne();

      if (!settings) {
        // Create new settings document
        settings = new CompanySettings({
          _id: `settings_${randomUUID()}`,
          attendancePercentageStartDate: startDate,
          attendancePercentageEndDate: endDate,
          attendanceCalculationMode: calculationMode || 'date-range',
          attendanceLastNDays: lastNDays || 30,
          presentDaysRequired: presentDaysRequired || 1,
          updatedAt: Date.now()
        });
      } else {
        settings.attendancePercentageStartDate = startDate;
        settings.attendancePercentageEndDate = endDate;
        if (calculationMode) settings.attendanceCalculationMode = calculationMode;
        if (lastNDays) settings.attendanceLastNDays = lastNDays;
        if (presentDaysRequired) settings.presentDaysRequired = presentDaysRequired;
        (settings as any).updatedAt = Date.now();
      }

      await settings.save();

      return {
        success: true,
        data: {
          startDate: settings.attendancePercentageStartDate,
          endDate: settings.attendancePercentageEndDate,
          calculationMode: settings.attendanceCalculationMode,
          lastNDays: settings.attendanceLastNDays,
          presentDaysRequired: settings.presentDaysRequired
        },
        message: 'Attendance date range settings updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings'
      };
    }
  }

  // Calculate attendance percentage for a specific member
  async calculateAttendancePercentage(memberId: string): Promise<ApiResponse> {
    try {
      const settings = await CompanySettings.findOne().lean();
      
      if (!settings || !settings.attendancePercentageStartDate || !settings.attendancePercentageEndDate) {
        return {
          success: false,
          error: 'Attendance date range not configured. Please set the date range in settings.'
        };
      }

      const startDate = settings.attendancePercentageStartDate;
      const endDate = settings.attendancePercentageEndDate;

      // Fetch attendance records within the date range
      const attendanceRecords = await AttendanceRecord.find({
        userId: memberId,
        date: { $gte: startDate, $lte: endDate }
      }).lean();

      // Calculate missing dates (should mark as absent if not present and not holiday/weekend)
      const allDatesInRange = this.getAllDatesBetween(startDate, endDate);
      
      // Count present days (Present, Late, Half-day all count as present)
      const presentDays = attendanceRecords.filter(
        record => record.status && ['Present', 'Late', 'Half-day'].includes(record.status)
      ).length;

      // Total working days (excluding weekends)
      const totalWorkingDays = allDatesInRange.filter(
        date => !this.isWeekend(date, settings.weekendDays || ['Saturday', 'Sunday'])
      ).length;

      const attendancePercentage = totalWorkingDays > 0 
        ? ((presentDays / totalWorkingDays) * 100).toFixed(2)
        : '0.00';

      // Get member details
      const member = await Member.findById(memberId).lean();

      return {
        success: true,
        data: {
          memberId,
          memberName: member?.name || 'Unknown',
          startDate,
          endDate,
          presentDays,
          totalWorkingDays,
          attendancePercentage: parseFloat(attendancePercentage),
          status: this.getAttendanceStatus(parseFloat(attendancePercentage))
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate attendance percentage'
      };
    }
  }

  // Calculate attendance percentage for all members
  async calculateAllMembersAttendancePercentage(): Promise<ApiResponse> {
    try {
      const settings = await CompanySettings.findOne().lean();
      
      if (!settings || !settings.attendancePercentageStartDate || !settings.attendancePercentageEndDate) {
        return {
          success: false,
          error: 'Attendance date range not configured. Please set the date range in settings.'
        };
      }

      // Get all members
      const members = await Member.find().lean();
      const results = [];

      for (const member of members) {
        const percentageResult = await this.calculateAttendancePercentage(member._id);
        if (percentageResult.success && percentageResult.data) {
          results.push(percentageResult.data);
        }
      }

      // Sort by attendance percentage (descending)
      results.sort((a, b) => b.attendancePercentage - a.attendancePercentage);

      return {
        success: true,
        data: {
          dateRange: {
            startDate: settings.attendancePercentageStartDate,
            endDate: settings.attendancePercentageEndDate
          },
          members: results,
          totalMembers: results.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate attendance for all members'
      };
    }
  }

  // Reset settings to default
  async resetSettings(): Promise<ApiResponse> {
    try {
      await CompanySettings.updateOne(
        {},
        {
          $unset: {
            attendancePercentageStartDate: 1,
            attendancePercentageEndDate: 1
          },
          $set: {
            attendanceCalculationMode: 'date-range',
            attendanceLastNDays: 30,
            presentDaysRequired: 1,
            updatedAt: Date.now()
          }
        },
        { upsert: true }
      );

      return {
        success: true,
        message: 'Settings reset to default'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset settings'
      };
    }
  }

  // Helper: Get all dates between two dates
  private getAllDatesBetween(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  // Helper: Check if date is weekend
  private isWeekend(dateStr: string, weekendDays: string[]): boolean {
    const date = new Date(dateStr);
    const dayName = date.toLocaleString('en-US', { weekday: 'long' });
    return weekendDays.includes(dayName);
  }

  // Helper: Get status badge based on percentage
  private getAttendanceStatus(percentage: number): string {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Average';
    if (percentage >= 60) return 'Poor';
    return 'Critical';
  }
}
