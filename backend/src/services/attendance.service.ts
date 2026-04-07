import { ApiResponse, PaginationQuery, PaginationResult, LocationData, AttendanceLocation } from '../types/index.js';
import { AttendanceRepository, ActivityLogRepository } from '../repositories/index.js';

export class AttendanceService {
  private attendanceRepo: AttendanceRepository;
  private activityLogRepo: ActivityLogRepository;

  constructor() {
    this.attendanceRepo = new AttendanceRepository();
    this.activityLogRepo = new ActivityLogRepository();
  }

  async checkIn(memberId: string, location?: LocationData): Promise<ApiResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already checked in
      const existingAttendance = await this.attendanceRepo.findByMemberAndDate(memberId, today);
      if (existingAttendance && existingAttendance.loginTime) {
        return {
          success: false,
          message: 'Already checked in today'
        };
      }

      // Validate location if provided
      if (location) {
        const isValidLocation = await this.validateLocation(location);
        if (!isValidLocation) {
          return {
            success: false,
            message: 'Invalid check-in location'
          };
        }
      }

      const loginTime = new Date().toTimeString().slice(0, 5);
      
      // Create or update attendance record
      const attendanceData = {
        memberId,
        date: today,
        loginTime,
        status: this.getAttendanceStatus(loginTime),
        submittedAt: Date.now()
      };

      let attendance;
      if (existingAttendance) {
        attendance = await this.attendanceRepo.update(existingAttendance._id, attendanceData);
      } else {
        attendance = await this.attendanceRepo.create({
          _id: `attendance_${Date.now()}`,
          ...attendanceData
        });
      }

      // Log activity
      await this.activityLogRepo.create({
        _id: `activity_${Date.now()}`,
        memberId,
        action: 'check_in',
        timestamp: Date.now(),
        details: `Checked in at ${loginTime}${location ? ' from valid location' : ''}`
      });

      return {
        success: true,
        data: attendance,
        message: 'Check-in successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-in failed'
      };
    }
  }

  async checkOut(memberId: string): Promise<ApiResponse> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendance = await this.attendanceRepo.findByMemberAndDate(memberId, today);

      if (!attendance || !attendance.loginTime) {
        return {
          success: false,
          message: 'No check-in record found for today'
        };
      }

      if (attendance.logoutTime) {
        return {
          success: false,
          message: 'Already checked out today'
        };
      }

      const logoutTime = new Date().toTimeString().slice(0, 5);
      const hours = this.calculateHours(attendance.loginTime, logoutTime);

      const updatedAttendance = await this.attendanceRepo.update(attendance._id, {
        logoutTime,
        hours,
        updatedAt: Date.now()
      });

      // Log activity
      await this.activityLogRepo.create({
        _id: `activity_${Date.now()}`,
        memberId,
        action: 'check_out',
        timestamp: Date.now(),
        details: `Checked out at ${logoutTime}, worked ${hours} hours`
      });

      return {
        success: true,
        data: updatedAttendance,
        message: 'Check-out successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Check-out failed'
      };
    }
  }

  async getAttendanceHistory(memberId: string, query: PaginationQuery): Promise<ApiResponse<PaginationResult<any>>> {
    try {
      const result = await this.attendanceRepo.findWithMember({ memberId }, query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch attendance history'
      };
    }
  }

  async getPendingApprovals(): Promise<ApiResponse> {
    try {
      const pendingAttendance = await this.attendanceRepo.findPendingApproval();
      return {
        success: true,
        data: pendingAttendance
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending approvals'
      };
    }
  }

  async approveAttendance(attendanceId: string, approvedBy: string): Promise<ApiResponse> {
    try {
      const attendance = await this.attendanceRepo.findById(attendanceId);
      if (!attendance) {
        return {
          success: false,
          message: 'Attendance record not found'
        };
      }

      const updatedAttendance = await this.attendanceRepo.update(attendanceId, {
        approvalStatus: 'Approved',
        approvedBy,
        approvedAt: Date.now()
      });

      // Log activity
      await this.activityLogRepo.create({
        _id: `activity_${Date.now()}`,
        memberId: attendance.memberId,
        action: 'attendance_approved',
        timestamp: Date.now(),
        details: `Attendance approved by ${approvedBy}`
      });

      return {
        success: true,
        data: updatedAttendance,
        message: 'Attendance approved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve attendance'
      };
    }
  }

  async rejectAttendance(attendanceId: string, approvedBy: string, rejectionReason: string): Promise<ApiResponse> {
    try {
      const attendance = await this.attendanceRepo.findById(attendanceId);
      if (!attendance) {
        return {
          success: false,
          message: 'Attendance record not found'
        };
      }

      const updatedAttendance = await this.attendanceRepo.update(attendanceId, {
        approvalStatus: 'Rejected',
        approvedBy,
        approvedAt: Date.now(),
        rejectionReason
      });

      // Log activity
      await this.activityLogRepo.create({
        _id: `activity_${Date.now()}`,
        memberId: attendance.memberId,
        action: 'attendance_rejected',
        timestamp: Date.now(),
        details: `Attendance rejected by ${approvedBy}: ${rejectionReason}`
      });

      return {
        success: true,
        data: updatedAttendance,
        message: 'Attendance rejected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reject attendance'
      };
    }
  }

  private async validateLocation(location: LocationData): Promise<boolean> {
    // Get office location from environment or database
    const officeLocation: AttendanceLocation = {
      officeLat: parseFloat(process.env.OFFICE_LAT || '12.9716'),
      officeLng: parseFloat(process.env.OFFICE_LNG || '77.5946'),
      radius: parseFloat(process.env.OFFICE_RADIUS || '100') // 100 meters
    };

    const distance = this.calculateDistance(
      location.lat,
      location.lng,
      officeLocation.officeLat,
      officeLocation.officeLng
    );

    return distance <= officeLocation.radius;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  private getAttendanceStatus(loginTime: string): string {
    const [hours, minutes] = loginTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // 9:30 AM = 570 minutes
    if (totalMinutes <= 570) {
      return 'Present';
    } else if (totalMinutes <= 600) { // 10:00 AM
      return 'Late';
    } else {
      return 'Half Day';
    }
  }

  private calculateHours(loginTime: string, logoutTime: string): number {
    const [loginHours, loginMinutes] = loginTime.split(':').map(Number);
    const [logoutHours, logoutMinutes] = logoutTime.split(':').map(Number);
    
    const loginTotalMinutes = loginHours * 60 + loginMinutes;
    const logoutTotalMinutes = logoutHours * 60 + logoutMinutes;
    
    const workedMinutes = logoutTotalMinutes - loginTotalMinutes;
    return Math.round((workedMinutes / 60) * 100) / 100;
  }

  async autoCheckout(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date();
      const currentHour = currentTime.getHours();
      
      // Auto checkout at 6 PM (18:00)
      if (currentHour >= 18) {
        const pendingCheckouts = await this.attendanceRepo.find({
          date: today,
          loginTime: { $exists: true },
          logoutTime: { $exists: false }
        });

        for (const attendance of pendingCheckouts) {
          await this.checkOut(attendance.memberId);
        }
      }
    } catch (error) {
      // Log error but don't throw
      console.error('Auto checkout failed:', error);
    }
  }
}
