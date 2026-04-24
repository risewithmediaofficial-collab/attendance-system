import { Request, Response } from 'express';
import { databaseService } from '../services/database.service.js';

// Lightweight health check - NO database queries
export const healthCheck = (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
    },
    cpu: process.cpuUsage(),
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  // Set cache headers for better performance
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.status(200).json(health);
};

// Ultra-lightweight ping endpoint (for uptime monitoring)
export const ping = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'pong',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
};

// Database health check (separate from main health check)
export const databaseHealthCheck = async (req: Request, res: Response) => {
  try {
    const connectionStatus = databaseService.getConnectionStatus();

    res.status(200).json({
      database: connectionStatus.readyStateText,
      timestamp: new Date().toISOString(),
      readyState: connectionStatus.readyState,
      isConnected: connectionStatus.isConnected
    });
  } catch (error) {
    res.status(500).json({
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};
