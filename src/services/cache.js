/**
 * HIGHVERZ — Multi-Tier Browser Level Cache Manager
 * 
 * Architecture:
 * 1. L1 Fast Memory Cache (RAM / Map): Sub-millisecond latency for current page runtime.
 * 2. L2 Persistent Browser Cache (sessionStorage): Preserves loaded pages and dossiers across in-tab navigation.
 * 3. Automatic TTL expiration handling.
 * 4. Quota-safe eviction to prevent StorageQuotaExceeded exceptions.
 * 5. Prefix-isolated namespace ('hv_cache_').
 */

const MEMORY_CACHE = new Map();
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes default TTL
const CACHE_PREFIX = 'hv_cache_';

class BrowserCacheManager {
  constructor(defaultTTL = DEFAULT_TTL_MS) {
    this.defaultTTL = defaultTTL;
    this.storageAvailable = this._checkStorage();
    // Clean up expired keys on initialization
    this.purgeExpired();
  }

  _checkStorage() {
    try {
      const testKey = '__hv_test__';
      window.sessionStorage.setItem(testKey, testKey);
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Get an item from L1 memory or L2 sessionStorage
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const fullKey = CACHE_PREFIX + key;
    const now = Date.now();

    // 1. Check L1 Memory Cache
    if (MEMORY_CACHE.has(fullKey)) {
      const record = MEMORY_CACHE.get(fullKey);
      if (now < record.expiry) {
        return record.value;
      }
      MEMORY_CACHE.delete(fullKey);
    }

    // 2. Check L2 SessionStorage
    if (this.storageAvailable) {
      try {
        const raw = window.sessionStorage.getItem(fullKey);
        if (!raw) return null;

        const record = JSON.parse(raw);
        if (now < record.expiry) {
          // Promote back to L1 Memory
          MEMORY_CACHE.set(fullKey, record);
          return record.value;
        }

        // Expired
        window.sessionStorage.removeItem(fullKey);
      } catch (err) {
        console.warn('[BrowserCache] Read error:', err);
      }
    }

    return null;
  }

  /**
   * Store an item in L1 memory and L2 sessionStorage with TTL
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs]
   */
  set(key, value, ttlMs = this.defaultTTL) {
    const fullKey = CACHE_PREFIX + key;
    const now = Date.now();
    const record = {
      value,
      expiry: now + ttlMs,
      savedAt: now
    };

    // Store in L1
    MEMORY_CACHE.set(fullKey, record);

    // Store in L2 SessionStorage
    if (this.storageAvailable) {
      try {
        window.sessionStorage.setItem(fullKey, JSON.stringify(record));
      } catch (err) {
        // Quota exceeded: evict older hv_cache entries and retry once
        this._evictOldest();
        try {
          window.sessionStorage.setItem(fullKey, JSON.stringify(record));
        } catch (_) {
          // Fallback to in-memory only
        }
      }
    }
  }

  /**
   * Check if a valid, unexpired key exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   * @param {string} key
   */
  delete(key) {
    const fullKey = CACHE_PREFIX + key;
    MEMORY_CACHE.delete(fullKey);
    if (this.storageAvailable) {
      try {
        window.sessionStorage.removeItem(fullKey);
      } catch (_) {}
    }
  }

  /**
   * Clear all Highverz cached entries
   */
  clear() {
    MEMORY_CACHE.clear();
    if (this.storageAvailable) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.startsWith(CACHE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => window.sessionStorage.removeItem(k));
      } catch (_) {}
    }
  }

  /**
   * Purge expired entries
   */
  purgeExpired() {
    const now = Date.now();
    for (const [k, v] of MEMORY_CACHE.entries()) {
      if (now >= v.expiry) {
        MEMORY_CACHE.delete(k);
      }
    }

    if (this.storageAvailable) {
      try {
        const keysToRemove = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.startsWith(CACHE_PREFIX)) {
            try {
              const rec = JSON.parse(window.sessionStorage.getItem(k));
              if (rec && rec.expiry && now >= rec.expiry) {
                keysToRemove.push(k);
              }
            } catch (_) {
              keysToRemove.push(k);
            }
          }
        }
        keysToRemove.forEach(k => window.sessionStorage.removeItem(k));
      } catch (_) {}
    }
  }

  _evictOldest() {
    if (!this.storageAvailable) return;
    try {
      const items = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          try {
            const parsed = JSON.parse(window.sessionStorage.getItem(k));
            items.push({ key: k, savedAt: parsed?.savedAt || 0 });
          } catch (_) {
            items.push({ key: k, savedAt: 0 });
          }
        }
      }
      items.sort((a, b) => a.savedAt - b.savedAt);
      // Remove oldest 30%
      const removeCount = Math.max(1, Math.ceil(items.length * 0.3));
      for (let i = 0; i < removeCount; i++) {
        if (items[i]) {
          window.sessionStorage.removeItem(items[i].key);
          MEMORY_CACHE.delete(items[i].key);
        }
      }
    } catch (_) {}
  }
}

export const browserCache = new BrowserCacheManager();
