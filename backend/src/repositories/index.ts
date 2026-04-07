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

// Type interfaces for the models
interface IUser extends User {}
interface IMember extends Member {}
interface IAttendanceRecord extends AttendanceRecord {}
interface ITask extends Task {}
interface IDailyStatus extends DailyStatus {}
interface IHoliday extends Holiday {}
interface IWorkReport extends WorkReport {}
interface IUserNotification extends UserNotification {}
interface IActivityLog extends ActivityLog {}

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return this.findOne({ username });
  }

  async findByMemberId(memberId: string): Promise<IUser | null> {
    return this.findOne({ memberId });
  }

  async findWithMember(filter: any = {}, options: any = {}) {
    return this.model.find(filter).populate('memberId').exec();
  }
}

export class MemberRepository extends BaseRepository<Member> {
  constructor() {
    super(Member);
  }

  async findByRole(role: string): Promise<Member[]> {
    return this.find({ role });
  }

  async findByName(name: string): Promise<Member | null> {
    return this.findOne({ name: new RegExp(name, 'i') });
  }
}

export class AttendanceRepository extends BaseRepository<AttendanceRecord> {
  constructor() {
    super(AttendanceRecord);
  }

  async findByMemberAndDate(memberId: string, date: string): Promise<AttendanceRecord | null> {
    return this.findOne({ memberId, date });
  }

  async findByDateRange(memberId: string, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return this.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });
  }

  async findPendingApproval(): Promise<AttendanceRecord[]> {
    return this.find({ approvalStatus: 'Pending' });
  }

  async findWithMember(filter: any = {}, query: PaginationQuery = {}) {
    const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = query;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    return this.paginate(filter, page, limit, sort);
  }
}

export class TaskRepository extends BaseRepository<Task> {
  constructor() {
    super(Task);
  }

  async findByAssignedTo(memberId: string): Promise<Task[]> {
    return this.find({ assignedTo: memberId });
  }

  async findByStatus(status: string): Promise<Task[]> {
    return this.find({ status });
  }

  async findByProject(project: string): Promise<Task[]> {
    return this.find({ project });
  }

  async findOverdue(): Promise<Task[]> {
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

export class DailyStatusRepository extends BaseRepository<DailyStatus> {
  constructor() {
    super(DailyStatus);
  }

  async findByMemberAndDate(memberId: string, date: string): Promise<DailyStatus | null> {
    return this.findOne({ memberId, date });
  }

  async findByDateRange(memberId: string, startDate: string, endDate: string): Promise<DailyStatus[]> {
    return this.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });
  }

  async findLatestByMember(memberId: string): Promise<DailyStatus | null> {
    return this.model.findOne({ memberId }).sort({ date: -1 }).exec() as Promise<DailyStatus | null>;
  }
}

export class HolidayRepository extends BaseRepository<Holiday> {
  constructor() {
    super(Holiday);
  }

  async findByDateRange(startDate: string, endDate: string): Promise<Holiday[]> {
    return this.find({
      date: { $gte: startDate, $lte: endDate }
    });
  }

  async findByYear(year: string): Promise<Holiday[]> {
    return this.find({
      date: new RegExp(`^${year}`)
    });
  }
}

export class WorkReportRepository extends BaseRepository<WorkReport> {
  constructor() {
    super(WorkReport);
  }

  async findByMemberAndDate(memberId: string, date: string): Promise<WorkReport | null> {
    return this.findOne({ memberId, date });
  }

  async findByDateRange(memberId: string, startDate: string, endDate: string): Promise<WorkReport[]> {
    return this.find({
      memberId,
      date: { $gte: startDate, $lte: endDate }
    });
  }
}

export class NotificationRepository extends BaseRepository<UserNotification> {
  constructor() {
    super(UserNotification);
  }

  async findByTargetMember(memberId: string): Promise<UserNotification[]> {
    return this.find({ targetMemberIds: memberId });
  }

  async findByTargetRole(role: string): Promise<UserNotification[]> {
    return this.find({ targetRole: role });
  }

  async findUnread(memberId: string): Promise<UserNotification[]> {
    return this.find({ 
      targetMemberIds: memberId,
      read: { $ne: true }
    });
  }
}

export class ActivityLogRepository extends BaseRepository<ActivityLog> {
  constructor() {
    super(ActivityLog);
  }

  async findByMember(memberId: string, limit: number = 50): Promise<ActivityLog[]> {
    return this.model.find({ memberId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec() as Promise<ActivityLog[]>;
  }

  async findByDateRange(memberId: string, startDate: number, endDate: number): Promise<ActivityLog[]> {
    return this.find({
      memberId,
      timestamp: { $gte: startDate, $lte: endDate }
    });
  }

  async findByAction(action: string, limit: number = 50): Promise<ActivityLog[]> {
    return this.model.find({ action })
      .sort({ timestamp: -1 })
      .limit(limit)
      .exec() as Promise<ActivityLog[]>;
  }
}
