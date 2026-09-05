import { CacheManager } from "./cache";

export function notifyNotesUpdated() {
  try {
    CacheManager.invalidate("notes_data_");
  } catch (e) {
    // ignore
  }

  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("notes:updated"));
    }
  } catch (e) {
    // ignore
  }
}

export default notifyNotesUpdated;
