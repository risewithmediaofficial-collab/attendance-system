interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class MemoryCacheService {
  private static instance: MemoryCacheService;
  private cache: Map<string, CacheItem<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Cleanup expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  static getInstance(): MemoryCacheService {
    if (!MemoryCacheService.instance) {
      MemoryCacheService.instance = new MemoryCacheService();
    }
    return MemoryCacheService.instance;
  }

  // Set cache item with TTL
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  // Get cache item
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  // Delete cache item
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get cache statistics
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: string;
  } {
    const keys = Array.from(this.cache.keys());
    const totalMemory = JSON.stringify(Array.from(this.cache.entries())).length;
    
    return {
      size: this.cache.size(),
      keys,
      memoryUsage: `${(totalMemory / 1024).toFixed(2)} KB`
    };
  }

  // Cleanup expired items
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Cache cleanup: removed ${cleanedCount} expired items`);
    }
  }

  // Destroy cache service
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// Export singleton instance
export const memoryCache = MemoryCacheService.getInstance();
