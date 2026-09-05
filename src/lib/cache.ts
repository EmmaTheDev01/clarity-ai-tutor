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
