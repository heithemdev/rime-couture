/**
 * Simple in-memory and sessionStorage cache utility
 * Caches API responses to avoid unnecessary refetches when navigating between pages
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresAt: number;
};

// In-memory cache (survives client-side navigation)
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// Max cache entries to prevent memory bloat
const MAX_CACHE_ENTRIES = 50;

/**
 * Generate a cache key from URL and params
 */
export function generateCacheKey(url: string, params?: Record<string, string | number | boolean | null | undefined>): string {
  if (!params) return url;
  
  const sortedParams = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('&');
  
  return sortedParams ? `${url}?${sortedParams}` : url;
}

/**
 * Set a value in cache
 */
export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  const now = Date.now();
  
  // Prune old entries if cache is too large
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = [...memoryCache.entries()]
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0]?.[0];
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }
  
  memoryCache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttl,
  });
  
  // Also store in sessionStorage for persistence across soft refreshes
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `cache:${key}`;
      sessionStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: now,
        expiresAt: now + ttl,
      }));
    } catch {
      // sessionStorage might be full or disabled
    }
  }
}

/**
 * Get a value from cache
 */
export function getCache<T>(key: string): T | null {
  const now = Date.now();
  
  // Check memory cache first
  const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (memEntry && memEntry.expiresAt > now) {
    return memEntry.data;
  }
  
  // Fall back to sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const storageKey = `cache:${key}`;
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (entry.expiresAt > now) {
          // Restore to memory cache
          memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Expired - clean up
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch {
      // JSON parse error or sessionStorage disabled
    }
  }
  
  // Expired or not found
  memoryCache.delete(key);
  return null;
}

/**
 * Remove a specific cache entry
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(`cache:${key}`);
    } catch {
      // sessionStorage might be disabled
    }
  }
}

/**
 * Remove all cache entries matching a prefix
 */
export function invalidateCacheByPrefix(prefix: string): void {
  // Clear memory cache
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
  
  // Clear sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(`cache:${prefix}`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {
      // sessionStorage might be disabled
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  memoryCache.clear();
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('cache:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch {
      // sessionStorage might be disabled
    }
  }
}

/**
 * Fetch with caching
 * Use this instead of raw fetch() for API calls that should be cached
 */
export async function cachedFetch<T>(
  url: string,
  options?: RequestInit & { ttl?: number; cacheKey?: string }
): Promise<T> {
  const { ttl = DEFAULT_TTL, cacheKey, ...fetchOptions } = options || {};
  const key = cacheKey || url;
  
  // Check cache first
  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch fresh data
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status}`);
  }
  
  const data = await response.json() as T;
  
  // Store in cache
  setCache(key, data, ttl);
  
  return data;
}
