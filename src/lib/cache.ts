const STORAGE_PREFIX = "purelearn_offline_cache_";

export class CacheManager {
  private static cache: Record<string, { data: any; expiry: number }> = {};

  private static getFromStorage(key: string): { data: any; expiry: number } | null {
    if (typeof window === "undefined" || !window.localStorage) return null;
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private static saveToStorage(key: string, data: any, expiry: number) {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify({ data, expiry, savedAt: Date.now() }));
    } catch {
      // Quota exceeded: best-effort ignore
    }
  }

  private static removeFromStorage(keyPrefix: string) {
    if (typeof window === "undefined" || !window.localStorage) return;
    try {
      const targetPrefix = `${STORAGE_PREFIX}${keyPrefix}`;
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(targetPrefix)) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }

  /**
   * Retrieves cached item. If internet connection is unavailable (!navigator.onLine),
   * it gracefully preserves and returns cached data so students can read offline.
   */
  static get(key: string, allowStaleWhenOffline: boolean = true) {
    let item = this.cache[key];
    if (!item) {
      const stored = this.getFromStorage(key);
      if (stored) {
        item = stored;
        this.cache[key] = stored;
      }
    }
    if (!item) return null;

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (Date.now() > item.expiry) {
      if (isOffline && allowStaleWhenOffline) {
        return item.data;
      }
      delete this.cache[key];
      return null;
    }
    return item.data;
  }

  /**
   * Guaranteed offline recovery: returns cached data regardless of TTL.
   */
  static getOfflineBackup(key: string): any {
    const item = this.cache[key] || this.getFromStorage(key);
    return item ? item.data : null;
  }

  static set(key: string, data: any, ttlMs: number = 30000) {
    const expiry = Date.now() + ttlMs;
    this.cache[key] = { data, expiry };
    this.saveToStorage(key, data, expiry);
  }

  static invalidate(keyPrefix: string) {
    Object.keys(this.cache).forEach((k) => {
      if (k.startsWith(keyPrefix)) {
        delete this.cache[k];
      }
    });
    this.removeFromStorage(keyPrefix);

    try {
      if (typeof window !== "undefined") {
        if (keyPrefix.startsWith("notes") || keyPrefix.includes("notes_data")) {
          window.dispatchEvent(new Event("notes:updated"));
        }
        if (keyPrefix.startsWith("materials") || keyPrefix.includes("materials_")) {
          window.dispatchEvent(new Event("materials:updated"));
        }
      }
    } catch {
      // ignore
    }
  }

  static clear() {
    this.cache = {};
  }
}
