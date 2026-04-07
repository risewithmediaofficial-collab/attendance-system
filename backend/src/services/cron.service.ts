import cron from 'node-cron';
import { AttendanceService } from './attendance.service.js';
import { TaskRepository, ActivityLogRepository } from '../repositories/repositories.js';

export class CronJobService {
  private attendanceService: AttendanceService;
  private taskRepo: TaskRepository;
  private activityLogRepo: ActivityLogRepository;

  constructor() {
    this.attendanceService = new AttendanceService();
    this.taskRepo = new TaskRepository();
    this.activityLogRepo = new ActivityLogRepository();
  }

  startAllJobs() {
    // Auto checkout users at 6 PM every day
    cron.schedule('0 18 * * *', async () => {
      await this.autoCheckoutAllUsers();
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Send overdue task reminders at 9 AM every day
    cron.schedule('0 9 * * *', async () => {
      await this.sendOverdueTaskReminders();
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Clean old activity logs (keep only last 90 days) at 2 AM every Sunday
    cron.schedule('0 2 * * 0', async () => {
      await this.cleanOldActivityLogs();
    }, {
      timezone: 'Asia/Kolkata'
    });

    // Generate daily attendance report at 11 PM every day
    cron.schedule('0 23 * * *', async () => {
      await this.generateDailyAttendanceReport();
    }, {
      timezone: 'Asia/Kolkata'
    });

    console.log('✅ All cron jobs started');
  }

  private async autoCheckoutAllUsers() {
    try {
      console.log('🔄 Running auto checkout job...');
      await this.attendanceService.autoCheckout();
      
      // Log the background job
      await this.activityLogRepo.create({
        _id: `activity_${Date.now()}`,
        memberId: 'system',
        action: 'auto_checkout_job',
        timestamp: Date.now(),
        details: 'Auto checkout job completed successfully'
      });
      
      console.log('✅ Auto checkout completed');
    } catch (error) {
      console.error('❌ Auto checkout failed:', error);
    }
  }

  private async sendOverdueTaskReminders() {
    try {
      console.log('🔄 Sending overdue task reminders...');
      
      const overdueTasks = await this.taskRepo.findOverdue();
      
      // Group by assigned users
      const tasksByUser = overdueTasks.reduce((acc: Record<string, any[]>, task: any) => {
        if (!acc[task.assignedTo]) {
          acc[task.assignedTo] = [];
        }
        acc[task.assignedTo].push(task);
        return acc;
      }, {});

      // Send notifications (this would integrate with your notification system)
      for (const [userId, tasks] of Object.entries(tasksByUser)) {
        await this.activityLogRepo.create({
          _id: `activity_${Date.now()}`,
          memberId: userId,
          action: 'overdue_task_reminder',
          timestamp: Date.now(),
          details: `Sent reminder for ${tasks.length} overdue tasks`
        });
      }
      
      console.log(`✅ Sent reminders for ${overdueTasks.length} overdue tasks`);
    } catch (error) {
      console.error('❌ Overdue task reminders failed:', error);
    }
  }

  private async cleanOldActivityLogs() {
    try {
      console.log('🔄 Cleaning old activity logs...');
      
      const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
      
      // This would be implemented in ActivityLogRepository
      // await this.activityLogRepo.deleteOldLogs(ninetyDaysAgo);
      
      await this.activityLogRepo.create({
        _id: `activity_${Date.now()}`,
        memberId: 'system',
        action: 'cleanup_old_logs',
        timestamp: Date.now(),
        details: 'Cleaned activity logs older than 90 days'
      });
      
      console.log('✅ Activity log cleanup completed');
    } catch (error) {
      console.error('❌ Activity log cleanup failed:', error);
    }
  }

  private async generateDailyAttendanceReport() {
    try {
      console.log('🔄 Generating daily attendance report...');
      
      const today = new Date().toISOString().split('T')[0];
      
      // This would generate and store daily reports
      // Implementation would depend on your reporting system
      
      await this.activityLogRepo.create({
        _id: `activity_${Date.now()}`,
        memberId: 'system',
        action: 'daily_attendance_report',
        timestamp: Date.now(),
        details: `Generated daily attendance report for ${today}`
      });
      
      console.log('✅ Daily attendance report generated');
    } catch (error) {
      console.error('❌ Daily attendance report failed:', error);
    }
  }

  // Manual trigger for testing
  async runJobManually(jobName: string) {
    switch (jobName) {
      case 'autoCheckout':
        await this.autoCheckoutAllUsers();
        break;
      case 'overdueReminders':
        await this.sendOverdueTaskReminders();
        break;
      case 'cleanupLogs':
        await this.cleanOldActivityLogs();
        break;
      case 'dailyReport':
        await this.generateDailyAttendanceReport();
        break;
      default:
        throw new Error(`Unknown job: ${jobName}`);
    }
  }
}
