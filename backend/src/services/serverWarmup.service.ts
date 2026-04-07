import cron from 'node-cron';
import { healthCheck } from '../controllers/health.controller.js';

export class ServerWarmupService {
  private static instance: ServerWarmupService;
  private warmupInterval: NodeJS.Timeout | null = null;
  private lastWarmup: Date | null = null;

  private constructor() {}

  static getInstance(): ServerWarmupService {
    if (!ServerWarmupService.instance) {
      ServerWarmupService.instance = new ServerWarmupService();
    }
    return ServerWarmupService.instance;
  }

  // Start server warmup - pings every 10 minutes to prevent cold starts
  startWarmup(): void {
    console.log('Starting server warmup service...');
    
    // Schedule warmup every 10 minutes
    cron.schedule('*/10 * * * *', () => {
      this.performWarmup();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    // Perform initial warmup
    setTimeout(() => this.performWarmup(), 1000);
  }

  private async performWarmup(): Promise<void> {
    try {
      const now = new Date();
      
      // Skip if warmup was done in the last 8 minutes
      if (this.lastWarmup && (now.getTime() - this.lastWarmup.getTime()) < 8 * 60 * 1000) {
        return;
      }

      // Simulate a light request to keep server warm
      const mockReq = {} as any;
      const mockRes = {
        status: () => mockRes,
        set: () => mockRes,
        json: (data: any) => {
          console.log(`Warmup ping at ${now.toISOString()}:`, data.status);
          return mockRes;
        }
      } as any;

      // Call health check to warm up the server
      healthCheck(mockReq, mockRes);
      
      this.lastWarmup = now;
      
      // Log memory usage periodically
      if (Math.random() < 0.1) { // 10% chance to log
        const memUsage = process.memoryUsage();
        console.log('Memory usage (MB):', {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100
        });
      }
    } catch (error) {
      console.error('Warmup failed:', error);
    }
  }

  // Manual warmup trigger
  async manualWarmup(): Promise<void> {
    await this.performWarmup();
  }

  // Get warmup status
  getWarmupStatus(): {
    lastWarmup: Date | null;
    uptime: number;
    nextWarmupIn: number;
  } {
    const now = new Date();
    const uptime = process.uptime();
    
    let nextWarmupIn = 0;
    if (this.lastWarmup) {
      const timeSinceLastWarmup = now.getTime() - this.lastWarmup.getTime();
      nextWarmupIn = Math.max(0, 10 * 60 * 1000 - timeSinceLastWarmup); // 10 minutes
    }

    return {
      lastWarmup: this.lastWarmup,
      uptime,
      nextWarmupIn
    };
  }

  // Stop warmup service
  stopWarmup(): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
      console.log('Server warmup service stopped');
    }
  }
}
