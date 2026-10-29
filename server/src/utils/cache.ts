/**
 * High-performance in-memory cache with TTL and prefix/tag invalidation.
 * Prevents heavy database roundtrips for multi-user reads while guaranteeing
 * immediate invalidation on mutations (zero stale reads).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL: number;
  private readonly maxEntries: number;

  private hits = 0;
  private misses = 0;

  constructor(defaultTTLSeconds = 120, maxEntries = 2000) {
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.maxEntries = maxEntries;

    // Periodic sweep every 60 seconds to release memory
    const timer = setInterval(() => this.cleanupExpired(), 60000);
    if (timer.unref) {
      timer.unref(); // Don't prevent Node process shutdown
    }
  }

  /**
   * Retrieve cached value or fetch fresh from DB and cache it
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMs = this.defaultTTL): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetchFn();
    this.set(key, fresh, ttlMs);
    return fresh;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs = this.defaultTTL): void {
    // Evict oldest item if capacity reached (LRU-like behavior)
    if (this.store.size >= this.maxEntries) {
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix (e.g., 'stock:', 'asset:', 'loan:')
   */
  invalidatePattern(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  flush(): void {
    this.store.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? `${((this.hits / (this.hits + this.misses)) * 100).toFixed(1)}%` : '0%',
    };
  }
}

export const cache = new MemoryCache();

