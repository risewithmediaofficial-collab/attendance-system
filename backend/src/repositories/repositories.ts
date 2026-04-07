import { BaseRepository } from './base.repository.js';
import { 
  User, 
  Member, 
  AttendanceRecord, 
  Task, 
  DailyStatus, 
  Holiday, 
  WorkReport, 
  UserNotification, 
  ActivityLog 
} from '../models.js';
import { PaginationQuery, PaginationResult } from '../types/index.js';

export class UserRepository extends BaseRepository<any> {
  constructor() {
    super(User);
  }

  async findByUsername(username: string) {
    return this.findOne({ username });
  }

  async findByMemberId(memberId: string) {
    return this.findOne({ memberId });
  }

  async findByEmail(email: string) {
    return this.findOne({ email });
  }

  async findByResetToken(resetPasswordToken: string) {
    return this.findOne({ 
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
  }

  async findWithMember(filter: any = {}, options: any = {}) {
    return this.model.find(filter).populate('memberId').exec();
  }
}

export class MemberRepository extends BaseRepository<any> {
  constructor() {
    super(Member);
  }

  async findByRole(role: string) {
    return this.find({ role });
  }

  async findByName(name: string) {
    return this.findOne({ name: new RegExp(name, 'i') });
  }
}

export class AttendanceRepository extends BaseRepository<any> {
  constructor() {
    super(AttendanceRecord);
  }

  async findByMemberAndDate(memberId: string, date: string) {
    return this.model.findOne({ memberId, date }).select('memberId date loginTime logoutTime hours status approvalStatus').exec();
  }

  async findByDateRange(memberId: string, startDate: string, endDate: string) {
    return this.model.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    }).select('date loginTime logoutTime hours status approvalStatus').exec();
  }

  async findPendingApproval() {
    return this.model.find({ approvalStatus: 'Pending' }).select('memberId date loginTime logoutTime hours status submittedAt').exec();
  }

  async findWithMember(filter: any = {}, query: PaginationQuery = {}) {
    const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = query;
    const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(filter).select('memberId date loginTime logoutTime hours status approvalStatus').sort(sort).skip(skip).limit(limit).exec(),
      this.count(filter)
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Optimized: Get only essential attendance data for dashboard
  async getAttendanceSummary(memberId: string, startDate: string, endDate: string) {
    return this.model.aggregate([
      { $match: { memberId, date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalDays: { $sum: 1 },
          presentDays: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } },
          lateDays: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } },
          halfDays: { $sum: { $cond: [{ $eq: ['$status', 'Half Day'] }, 1, 0] } },
          totalHours: { $sum: '$hours' }
        }
      }
    ]);
  }
}
