import { randomUUID } from "node:crypto";
import { ApiResponse } from "../types/index.js";
import { AttendanceRecord, CompanySettings, User } from "../models/enhancedModels.js";
import { Member } from "../models.js";

type AttendanceCalculationMode = "date-range" | "last-n-days";

type CalculationWindow = {
  calculationMode: AttendanceCalculationMode;
  startDate: string;
  endDate: string;
  lastNDays: number;
};

export class AttendanceSettingsService {
  async getSettings(): Promise<ApiResponse> {
    try {
      const settings = await this.getOrCreateSettings();
      const calculationWindow = this.resolveCalculationWindow(settings);

      return {
        success: true,
        data: {
          officeStartTime: settings.officeStartTime,
          officeEndTime: settings.officeEndTime,
          lunchStartTime: settings.lunchStartTime || "12:30",
          lunchEndTime: settings.lunchEndTime || "13:30",
          lateThreshold: settings.lateThreshold,
          halfDayThreshold: settings.halfDayThreshold,
          autoCheckoutTime: settings.autoCheckoutTime,
          timezone: settings.timezone,
          weekendDays: settings.weekendDays,
          attendancePercentageStartDate: settings.attendancePercentageStartDate,
          attendancePercentageEndDate: settings.attendancePercentageEndDate,
          attendanceCalculationMode: this.normalizeCalculationMode(settings.attendanceCalculationMode),
          attendanceLastNDays: this.normalizeLastNDays(settings.attendanceLastNDays),
          attendanceResolvedStartDate: calculationWindow?.startDate,
          attendanceResolvedEndDate: calculationWindow?.endDate,
          presentDaysRequired: settings.presentDaysRequired || 1,
          holidays: settings.holidays || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch settings",
      };
    }
  }

  async updateDateRangeSettings(
    startDate?: string,
    endDate?: string,
    calculationMode?: string,
    lastNDays?: number,
    presentDaysRequired?: number,
  ): Promise<ApiResponse> {
    try {
      const settings = await this.getOrCreateSettingsDocument();
      const normalizedMode = this.normalizeCalculationMode(calculationMode);
      const normalizedLastNDays = this.normalizeLastNDays(lastNDays);

      if (normalizedMode === "date-range") {
        if (!startDate || !endDate) {
          return {
            success: false,
            error: "Start date and end date are required for date range mode",
          };
        }

        settings.attendancePercentageStartDate = startDate;
        settings.attendancePercentageEndDate = endDate;
      }

      settings.attendanceCalculationMode = normalizedMode as typeof settings.attendanceCalculationMode;
      settings.attendanceLastNDays = normalizedLastNDays;

      if (typeof presentDaysRequired === "number" && presentDaysRequired > 0) {
        settings.presentDaysRequired = presentDaysRequired;
      }

      (settings as any).updatedAt = Date.now();
      await settings.save();

      const calculationWindow = this.resolveCalculationWindow(settings.toObject());

      return {
        success: true,
        data: {
          startDate: settings.attendancePercentageStartDate,
          endDate: settings.attendancePercentageEndDate,
          calculationMode: settings.attendanceCalculationMode,
          lastNDays: settings.attendanceLastNDays,
          resolvedStartDate: calculationWindow?.startDate,
          resolvedEndDate: calculationWindow?.endDate,
          presentDaysRequired: settings.presentDaysRequired,
        },
        message: "Attendance settings updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update settings",
      };
    }
  }

  async calculateAttendancePercentage(memberId: string): Promise<ApiResponse> {
    try {
      const settings = await this.getOrCreateSettings();
      const calculationWindow = this.resolveCalculationWindow(settings);

      if (!calculationWindow) {
        return {
          success: false,
          error: "Attendance date range not configured. Please set the date range in settings.",
        };
      }

      const member = await Member.findById(memberId).lean();
      if (!member) {
        return {
          success: false,
          error: "Member not found",
        };
      }

      const user = await User.findOne({ memberId }).lean();
      const attendanceRecords = user
        ? await AttendanceRecord.find({
            userId: user._id,
            date: {
              $gte: calculationWindow.startDate,
              $lte: calculationWindow.endDate,
            },
          }).lean()
        : [];

      const allDatesInRange = this.getAllDatesBetween(
        calculationWindow.startDate,
        calculationWindow.endDate,
      );
      const holidays = Array.isArray(settings.holidays) ? settings.holidays : [];
      const weekendDays = Array.isArray(settings.weekendDays)
        ? settings.weekendDays
        : ["Saturday", "Sunday"];

      const totalWorkingDays = allDatesInRange.filter(
        (date) => !this.isWeekend(date, weekendDays) && !this.isHoliday(date, holidays),
      ).length;

      const presentDays = attendanceRecords.filter(
        (record: any) => record.status && ["Present", "Late", "Half-day"].includes(record.status),
      ).length;

      const attendancePercentage = totalWorkingDays > 0
        ? Number(((presentDays / totalWorkingDays) * 100).toFixed(2))
        : 0;

      return {
        success: true,
        data: {
          memberId,
          memberName: member.name || "Unknown",
          calculationMode: calculationWindow.calculationMode,
          startDate: calculationWindow.startDate,
          endDate: calculationWindow.endDate,
          presentDays,
          totalWorkingDays,
          attendancePercentage,
          status: this.getAttendanceStatus(attendancePercentage),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to calculate attendance percentage",
      };
    }
  }

  async calculateAllMembersAttendancePercentage(): Promise<ApiResponse> {
    try {
      const settings = await this.getOrCreateSettings();
      const calculationWindow = this.resolveCalculationWindow(settings);

      if (!calculationWindow) {
        return {
          success: false,
          error: "Attendance date range not configured. Please set the date range in settings.",
        };
      }

      const members = await Member.find().lean();
      const results: any[] = [];

      for (const member of members) {
        const percentageResult = await this.calculateAttendancePercentage(member._id);
        if (percentageResult.success && percentageResult.data) {
          results.push(percentageResult.data);
        }
      }

      results.sort((a, b) => b.attendancePercentage - a.attendancePercentage);

      return {
        success: true,
        data: {
          dateRange: {
            calculationMode: calculationWindow.calculationMode,
            startDate: calculationWindow.startDate,
            endDate: calculationWindow.endDate,
            lastNDays: calculationWindow.lastNDays,
          },
          members: results,
          totalMembers: results.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to calculate attendance for all members",
      };
    }
  }

  async resetSettings(): Promise<ApiResponse> {
    try {
      await CompanySettings.updateOne(
        {},
        {
          $unset: {
            attendancePercentageStartDate: 1,
            attendancePercentageEndDate: 1,
          },
          $set: {
            attendanceCalculationMode: "date-range",
            attendanceLastNDays: 30,
            presentDaysRequired: 1,
            updatedAt: Date.now(),
          },
        },
        { upsert: true },
      );

      return {
        success: true,
        message: "Settings reset to default",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to reset settings",
      };
    }
  }

  async updateOfficeHours(
    officeStartTime: string,
    officeEndTime: string,
    lunchStartTime: string,
    lunchEndTime: string,
  ): Promise<ApiResponse> {
    try {
      const settings = await this.getOrCreateSettingsDocument();

      settings.officeStartTime = officeStartTime;
      settings.officeEndTime = officeEndTime;
      (settings as any).lunchStartTime = lunchStartTime;
      (settings as any).lunchEndTime = lunchEndTime;
      (settings as any).updatedAt = Date.now();

      await settings.save();

      return {
        success: true,
        data: {
          officeStartTime: settings.officeStartTime,
          officeEndTime: settings.officeEndTime,
          lunchStartTime: (settings as any).lunchStartTime,
          lunchEndTime: (settings as any).lunchEndTime,
        },
        message: "Office hours updated successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update office hours",
      };
    }
  }

  private async getOrCreateSettings(): Promise<any> {
    let settings = (await CompanySettings.findOne().lean()) as any | null;

    if (!settings) {
      await CompanySettings.create({
        _id: `settings_${randomUUID()}`,
        officeStartTime: "09:30",
        officeEndTime: "16:30",
        lunchStartTime: "12:30",
        lunchEndTime: "13:30",
        lateThreshold: 15,
        halfDayThreshold: 4,
        autoCheckoutTime: "16:45",
        timezone: "Asia/Kolkata",
        weekendDays: ["Saturday", "Sunday"],
        attendanceCalculationMode: "date-range",
        attendanceLastNDays: 30,
        presentDaysRequired: 1,
        holidays: [],
        updatedAt: Date.now(),
      });
      settings = (await CompanySettings.findOne().lean()) as any | null;
    }

    if (!settings) {
      throw new Error("Failed to initialize attendance settings");
    }

    return settings;
  }

  private async getOrCreateSettingsDocument(): Promise<any> {
    let settings = await CompanySettings.findOne();

    if (!settings) {
      settings = new CompanySettings({
        _id: `settings_${randomUUID()}`,
        officeStartTime: "09:30",
        officeEndTime: "16:30",
        lunchStartTime: "12:30",
        lunchEndTime: "13:30",
        lateThreshold: 15,
        halfDayThreshold: 4,
        autoCheckoutTime: "16:45",
        timezone: "Asia/Kolkata",
        weekendDays: ["Saturday", "Sunday"],
        attendanceCalculationMode: "date-range",
        attendanceLastNDays: 30,
        presentDaysRequired: 1,
        holidays: [],
        updatedAt: Date.now(),
      });
    }

    return settings;
  }

  private resolveCalculationWindow(settings: any): CalculationWindow | null {
    const calculationMode = this.normalizeCalculationMode(settings?.attendanceCalculationMode);
    const lastNDays = this.normalizeLastNDays(settings?.attendanceLastNDays);

    if (calculationMode === "last-n-days") {
      const endDate = this.formatDate(new Date());
      const start = this.parseDate(endDate);
      start.setDate(start.getDate() - (lastNDays - 1));

      return {
        calculationMode,
        startDate: this.formatDate(start),
        endDate,
        lastNDays,
      };
    }

    if (!settings?.attendancePercentageStartDate || !settings?.attendancePercentageEndDate) {
      return null;
    }

    return {
      calculationMode,
      startDate: settings.attendancePercentageStartDate,
      endDate: settings.attendancePercentageEndDate,
      lastNDays,
    };
  }

  private normalizeCalculationMode(value?: string): AttendanceCalculationMode {
    return value === "last-n-days" ? "last-n-days" : "date-range";
  }

  private normalizeLastNDays(value?: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return 30;
    }

    const normalized = Math.floor(value);
    if (normalized < 1) return 1;
    if (normalized > 365) return 365;
    return normalized;
  }

  private getAllDatesBetween(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    while (current <= end) {
      dates.push(this.formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  private isWeekend(dateStr: string, weekendDays: string[]): boolean {
    const date = this.parseDate(dateStr);
    const dayName = date.toLocaleString("en-US", { weekday: "long" });
    return weekendDays.includes(dayName);
  }

  private isHoliday(dateStr: string, holidays: Array<{ date?: string }>): boolean {
    return holidays.some((holiday) => holiday?.date === dateStr);
  }

  private parseDate(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00`);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private getAttendanceStatus(percentage: number): string {
    if (percentage >= 90) return "Excellent";
    if (percentage >= 80) return "Good";
    if (percentage >= 70) return "Average";
    if (percentage >= 60) return "Poor";
    return "Critical";
  }
}
