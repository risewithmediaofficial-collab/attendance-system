/**
 * Self-Ping Service
 * Prevents Render server from going idle by pinging itself every 5 minutes
 * This complements external monitoring (UptimeRobot) for redundancy
 */

import http from 'http';
import https from 'https';

export class SelfPingService {
  private static instance: SelfPingService;
  private pingInterval: NodeJS.Timeout | null = null;
  private isPingRunning: boolean = false;
  private lastPingTime: number = 0;
  private pingCount: number = 0;

  private constructor() {}

  static getInstance(): SelfPingService {
    if (!SelfPingService.instance) {
      SelfPingService.instance = new SelfPingService();
    }
    return SelfPingService.instance;
  }

  /**
   * Start self-pinging the server every 5 minutes
   * Interval: 5 minutes (300000 ms)
   */
  startSelfPing(): void {
    if (this.pingInterval) {
      console.log('⚠️  Self-ping is already running');
      return;
    }

    console.log('🚀 Starting self-ping service...');

    // Initial ping after 1 minute
    setTimeout(() => {
      this.performPing();
    }, 60 * 1000);

    // Subsequent pings every 5 minutes
    this.pingInterval = setInterval(() => {
      this.performPing();
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    this.isPingRunning = true;
  }

  /**
   * Perform the actual ping using native http/https module
   */
  private performPing(): void {
    if (this.isPingRunning) {
      console.log('⏸️  Ping already in progress, skipping...');
      return;
    }

    this.isPingRunning = true;
    this.pingCount++;

    try {
      const backendUrl = process.env.BACKEND_URL || 
        `http://localhost:${process.env.PORT || 4000}`;
      
      const startTime = Date.now();
      const url = new URL(`${backendUrl}/ping`);
      const protocol = url.protocol === 'https:' ? https : http;

      const req = protocol.get(url, { timeout: 5000 }, (res) => {
        const duration = Date.now() - startTime;
        this.lastPingTime = Date.now();

        if (res.statusCode === 200) {
          console.log(
            `✅ Self-ping #${this.pingCount} successful (${duration}ms) - Status: ${res.statusCode}`
          );
        } else {
          console.warn(
            `⚠️  Self-ping #${this.pingCount} returned status ${res.statusCode} (${duration}ms)`
          );
        }

        // Consume response to avoid hanging
        res.on('data', () => {});
        res.on('end', () => {
          this.isPingRunning = false;
        });
      });

      req.on('error', (error) => {
        console.error(
          `❌ Self-ping #${this.pingCount} failed:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        this.isPingRunning = false;
      });

      req.on('timeout', () => {
        console.warn(`⏱️  Self-ping #${this.pingCount} timed out`);
        req.destroy();
        this.isPingRunning = false;
      });
    } catch (error) {
      console.error(
        `❌ Self-ping #${this.pingCount} failed:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      this.isPingRunning = false;
    }
  }

  /**
   * Stop the self-ping service
   */
  stopSelfPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      this.isPingRunning = false;
      console.log('🛑 Self-ping service stopped');
    }
  }

  /**
   * Get self-ping status
   */
  getStatus(): {
    isRunning: boolean;
    pingCount: number;
    lastPingTime: string;
    nextPingIn: number;
  } {
    return {
      isRunning: this.isPingRunning,
      pingCount: this.pingCount,
      lastPingTime: this.lastPingTime ? new Date(this.lastPingTime).toISOString() : 'Never',
      nextPingIn: this.lastPingTime 
        ? Math.max(0, 5 * 60 * 1000 - (Date.now() - this.lastPingTime))
        : 0
    };
  }
}

