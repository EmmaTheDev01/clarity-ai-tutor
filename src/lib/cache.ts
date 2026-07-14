export class CacheManager {
  private static cache: Record<string, { data: any; expiry: number }> = {};

  static get(key: string) {
    const item = this.cache[key];
    if (!item) return null;
    if (Date.now() > item.expiry) {
      delete this.cache[key];
      return null;
    }
    return item.data;
  }

  static set(key: string, data: any, ttlMs: number = 30000) {
    this.cache[key] = { data, expiry: Date.now() + ttlMs };
  }

  static invalidate(keyPrefix: string) {
    Object.keys(this.cache).forEach((k) => {
      if (k.startsWith(keyPrefix)) {
        delete this.cache[k];
      }
    });
  }

  static clear() {
    this.cache = {};
  }
}
