/**
 * storage.js - Simple localStorage/sessionStorage helpers for Mahikshu
 */

const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage set failed:', e);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  session: {
    get(key, fallback = null) {
      try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },

    set(key, value) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn('Session storage set failed:', e);
      }
    },

    remove(key) {
      sessionStorage.removeItem(key);
    }
  }
};

export default Storage;
