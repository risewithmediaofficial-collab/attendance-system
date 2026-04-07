import mongoose from 'mongoose';

export class DatabaseService {
  private static instance: DatabaseService;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Singleton connection pattern
  async connect(): Promise<void> {
    // If already connecting, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return immediately
    if (this.isConnected && mongoose.connection.readyState === 1) {
      return;
    }

    // Start connection process
    this.connectionPromise = this._connect();
    return this.connectionPromise;
  }

  private async _connect(): Promise<void> {
    try {
      const uri = process.env.MONGODB_URI?.trim();
      if (!uri) {
        throw new Error('MONGODB_URI is not set');
      }

      if (!uri.startsWith('mongodb+srv://')) {
        throw new Error('This project requires MongoDB Atlas (mongodb+srv:// URI)');
      }

      // Configure mongoose for optimal performance
      mongoose.set('strictQuery', true);
      
      // Connection options for performance (removed deprecated buffering options)
      const options = {
        // Connection pooling
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 2, // Minimum pool size
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        
        // Performance optimizations
        retryWrites: true,
        retryReads: true,
        readPreference: 'primary' as const,
        writeConcern: { w: 'majority' as const, j: true }
      };

      await mongoose.connect(uri, options);
      
      this.isConnected = true;
      this.connectionPromise = null;

      console.log('MongoDB connected successfully with connection pooling');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error);
        this.isConnected = false;
        this.connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        this.isConnected = false;
        this.connectionPromise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        this.isConnected = true;
        this.connectionPromise = null;
      });

    } catch (error) {
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error);
    }
  }

  getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    readyStateText: string;
  } {
    const readyState = mongoose.connection.readyState;
    const readyStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][readyState] || 'unknown';
    
    return {
      isConnected: this.isConnected,
      readyState,
      readyStateText
    };
  }

  // Health check without database query
  isHealthy(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
