// Cache invalidation system for real-time updates
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class Cache {
  private cache: Map<string, CacheEntry> = new Map();
  private subscribers: Map<string, Set<() => void>> = new Map();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.notifySubscribers(key);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    this.notifySubscribers(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.notifySubscribers(key);
    });
  }

  subscribe(key: string, callback: () => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }

  private notifySubscribers(key: string): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback());
    }
  }

  clear(): void {
    this.cache.clear();
    // Notify all subscribers
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach((callback: () => void) => callback());
    });
  }
}

export const appCache = new Cache();

// Helper functions for common cache operations
export const cacheKeys = {
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product_${id}`,
  STATS: 'stats',
  USERS: 'users',
  FEATURED_PRODUCTS: 'featured_products'
};

export const invalidateProductCache = () => {
  appCache.invalidatePattern('products?');
  appCache.invalidatePattern('product_');
  appCache.invalidate(cacheKeys.FEATURED_PRODUCTS);
  appCache.invalidate(cacheKeys.STATS);
};
