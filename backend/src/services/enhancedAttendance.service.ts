import { ApiResponse } from '../types/index.js';
import { AttendanceRecord, CompanySettings } from '../models/enhancedModels.js';

export class EnhancedAttendanceService {
  private companySettings: any;

  constructor() {
    this.loadCompanySettings();
  }

  private async loadCompanySettings() {
    this.companySettings = await CompanySettings.findOne() || {
      officeStartTime: '09:00',
      officeEndTime: '18:00',
      lateThreshold: 15,
      halfDayThreshold: 4,
      autoCheckoutTime: '18:30',
      timezone: 'Asia/Kolkata'
    };
  }

  // Get current server time in configured timezone
  private getCurrentTime(): { time: string; date: string } {
    const now = new Date();
    
    // Convert to configured timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: this.companySettings.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: this.companySettings.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    const time = now.toLocaleTimeString('en-US', options);
    const date = now.toLocaleDateString('en-US', dateOptions).replace(/\//g, '-');
    
    return { time, date };
  }

  // Calculate attendance status based on check-in time
  private calculateStatus(checkInTime: string): 'Present' | 'Late' | 'Half-day' {
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const [officeHours, officeMinutes] = this.companySettings.officeStartTime.split(':').map(Number);
    
    const checkInMinutes = hours * 60 + minutes;
    const officeMinutesTotal = officeHours * 60 + officeMinutes;
    
    const lateThreshold = this.companySettings.lateThreshold;
    
    if (checkInMinutes <= officeMinutesTotal + lateThreshold) {
      return 'Present';
    } else {
      return 'Late';
    }
  }

  // Calculate working hours
  private calculateWorkingHours(checkInTime: string, checkOutTime: string): number {
    const [checkInHours, checkInMinutes] = checkInTime.split(':').map(Number);
    const [checkOutHours, checkOutMinutes] = checkOutTime.split(':').map(Number);
    
    const totalCheckInMinutes = checkInHours * 60 + checkInMinutes;
    const totalCheckOutMinutes = checkOutHours * 60 + checkOutMinutes;
    
    const workedMinutes = totalCheckOutMinutes - totalCheckInMinutes;
    const workedHours = workedMinutes / 60;
    
    return Math.round(workedHours * 100) / 100; // Round to 2 decimal places
  }

  // Check-in attendance
  async checkIn(userId: string, location?: { lat: number; lng: number; accuracy?: number }): Promise<ApiResponse> {
    try {
      const { time, date } = this.getCurrentTime();
      
      // Check if already checked in today
      const existingAttendance = await AttendanceRecord.findOne({
        userId,
        date,
        checkInTime: { $exists: true }
      });

      if (existingAttendance) {
        return {
          success: false,
          error: 'Already checked in today'
        };
      }

      // Calculate status
      const status = this.calculateStatus(time);

      // Create attendance record
      const attendance = new AttendanceRecord({
        _id: `attendance_${Date.now()}`,
        userId,
        date,
        checkInTime: time,
        status,
        checkInLocation: location
      });

      await attendance.save();

      return {
        success: true,
        data: {
          checkInTime: time,
          status,
          date
        },
        message: `Checked in successfully. Status: ${status}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-in failed'
      };
    }
  }

  // Check-out attendance
  async checkOut(userId: string, location?: { lat: number; lng: number; accuracy?: number }): Promise<ApiResponse> {
    try {
      const { time, date } = this.getCurrentTime();
      
      // Find today's attendance record
      const attendance = await AttendanceRecord.findOne({
        userId,
        date,
        checkInTime: { $exists: true },
        checkOutTime: { $exists: false }
      });

      if (!attendance) {
        return {
          success: false,
          error: 'No check-in record found for today'
        };
      }

      // Calculate working hours
      const workingHours = this.calculateWorkingHours(attendance.checkInTime!, time);
      
      // Update status if half-day
      let status = attendance.status;
      if (workingHours < this.companySettings.halfDayThreshold) {
        status = 'Half-day';
      }

      // Update attendance record
      attendance.checkOutTime = time;
      attendance.workingHours = workingHours;
      attendance.status = status;
      attendance.checkOutLocation = location;
      attendance.isAutoCheckout = false;

      await attendance.save();

      return {
        success: true,
        data: {
          checkOutTime: time,
          workingHours,
          status,
          checkInTime: attendance.checkInTime
        },
        message: `Checked out successfully. Working hours: ${workingHours}h`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-out failed'
      };
    }
  }

  // Get today's attendance
  async getTodayAttendance(userId: string): Promise<ApiResponse> {
    try {
      const { date } = this.getCurrentTime();
      
      const attendance = await AttendanceRecord.findOne({
        userId,
        date
      });

      if (!attendance) {
        return {
          success: true,
          data: null,
          message: 'No attendance record for today'
        };
      }

      return {
        success: true,
        data: {
          checkInTime: attendance.checkInTime,
          checkOutTime: attendance.checkOutTime,
          workingHours: attendance.workingHours,
          status: attendance.status,
          date: attendance.date
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get today\'s attendance'
      };
    }
  }

  // Auto-checkout users who haven't checked out
  async autoCheckoutUsers(): Promise<ApiResponse> {
    try {
      const { time, date } = this.getCurrentTime();
      
      // Find users who checked in but didn't check out
      const pendingCheckouts = await AttendanceRecord.find({
        date,
        checkInTime: { $exists: true },
        checkOutTime: { $exists: false }
      });

      let autoCheckedOut = 0;

      for (const attendance of pendingCheckouts) {
        const workingHours = this.calculateWorkingHours(attendance.checkInTime!, this.companySettings.autoCheckoutTime);
        
        let status = attendance.status;
        if (workingHours < this.companySettings.halfDayThreshold) {
          status = 'Half-day';
        }

        await AttendanceRecord.updateOne(
          { _id: attendance._id },
          {
            checkOutTime: this.companySettings.autoCheckoutTime,
            workingHours,
            status,
            isAutoCheckout: true
          }
        );

        autoCheckedOut++;
      }

      return {
        success: true,
        data: { autoCheckedOut },
        message: `Auto-checked out ${autoCheckedOut} users`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-checkout failed'
      };
    }
  }

  // Get attendance history
  async getAttendanceHistory(userId: string, startDate: string, endDate: string): Promise<ApiResponse> {
    try {
      const attendance = await AttendanceRecord.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });

      return {
        success: true,
        data: attendance
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get attendance history'
      };
    }
  }
}
