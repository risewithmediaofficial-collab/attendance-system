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

  async findByUsername(username: string): Promise<any | null> {
    return this.findOne({ username });
  }

  async findByMemberId(memberId: string): Promise<any | null> {
    return this.findOne({ memberId });
  }

  async findWithMember(filter: any = {}, options: any = {}) {
    return this.model.find(filter).populate('memberId').exec();
  }
}

export class MemberRepository extends BaseRepository<any> {
  constructor() {
    super(Member);
  }

  async findByRole(role: string): Promise<any[]> {
    return this.find({ role });
  }

  async findByName(name: string): Promise<any | null> {
    return this.findOne({ name: new RegExp(name, 'i') });
  }
}

export class AttendanceRepository extends BaseRepository<any> {
  constructor() {
    super(AttendanceRecord);
  }

  async findByMemberAndDate(memberId: string, date: string): Promise<any | null> {
    return this.findOne({ memberId, date });
  }

  async findByDateRange(memberId: string, startDate: string, endDate: string): Promise<any[]> {
    return this.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });
  }

  async findPendingApproval(): Promise<any[]> {
    return this.find({ approvalStatus: 'Pending' });
  }

  async findWithMember(filter: any = {}, query: PaginationQuery = {}) {
    const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = query;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    return this.paginate(filter, page, limit, sort);
  }
}

export class TaskRepository extends BaseRepository<any> {
  constructor() {
    super(Task);
  }

  async findByAssignedTo(memberId: string): Promise<any[]> {
    return this.find({ assignedTo: memberId });
  }

  async findByStatus(status: string): Promise<any[]> {
    return this.find({ status });
  }

  async findByProject(project: string): Promise<any[]> {
    return this.find({ project });
  }

  async findOverdue(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.find({ 
      deadline: { $lt: today },
      status: { $ne: 'Completed' }
    });
  }

  async findWithAssignees(filter: any = {}, query: PaginationQuery = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    return this.paginate(filter, page, limit, sort);
  }
}

export class DailyStatusRepository extends BaseRepository<any> {
  constructor() {
    super(DailyStatus);
  }

  async findByMemberAndDate(memberId: string, date: string): Promise<any | null> {
    return this.findOne({ memberId, date });
  }

  async findByDateRange(memberId: string, startDate: string, endDate: string): Promise<any[]> {
    return this.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });
  }

  async findLatestByMember(memberId: string): Promise<any | null> {
    return this.model.findOne({ memberId }).sort({ date: -1 }).exec() as Promise<any | null>;
  }
}

export class HolidayRepository extends BaseRepository<any> {
  constructor() {
    super(Holiday);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<any[]> {
    return this.find({
      date: { $gte: startDate, $lte: endDate }
    });
  }

  async findByYear(year: string): Promise<any[]> {
    return this.find({
      date: new RegExp(`^${year}`)
    });
  }
}

export class WorkReportRepository extends BaseRepository<any> {
  constructor() {
    super(WorkReport);
  }

  async findByMemberAndDate(memberId: string, date: string): Promise<any | null> {
    return this.findOne({ memberId, date });
  }

  async findByDateRange(memberId: string, startDate: string, endDate: string): Promise<any[]> {
    return this.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });
  }
}

export class NotificationRepository extends BaseRepository<any> {
  constructor() {
    super(UserNotification);
  }

  async findByTargetMember(memberId: string): Promise<any[]> {
    return this.find({ targetMemberIds: memberId });
  }

  async findByTargetRole(role: string): Promise<any[]> {
    return this.find({ targetRole: role });
  }

  async findUnread(memberId: string): Promise<any[]> {
    return this.find({ 
      targetMemberIds: memberId,
      read: { $ne: true }
    });
  }
}

export class ActivityLogRepository extends BaseRepository<any> {
  constructor() {
    super(ActivityLog);
  }

  async findByMember(memberId: string, limit: number = 50): Promise<any[]> {
    return this.model.find({ memberId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec() as Promise<any[]>;
  }

  async findByDateRange(memberId: string, startDate: number, endDate: number): Promise<any[]> {
    return this.find({
      memberId,
      timestamp: { $gte: startDate, $lte: endDate }
    });
  }

  async findByAction(action: string, limit: number = 50): Promise<any[]> {
    return this.model.find({ action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec() as Promise<any[]>;
  }
}
