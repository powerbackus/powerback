/**
 * Single storage utility with pb: prefix for POWERBACK keys.
 * Use for localStorage and sessionStorage so all app keys are namespaced and consistent.
 *
 * @module utils/storage
 */

const PREFIX = 'pb:';

function prefixed(key: string): string {
  return key.startsWith(PREFIX) ? key : PREFIX + key;
}

export const storage = {
  local: {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(prefixed(key));
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        localStorage.setItem(prefixed(key), value);
      } catch {
        // ignore
      }
    },
    removeItem(key: string): void {
      try {
        localStorage.removeItem(prefixed(key));
      } catch {
        // ignore
      }
    },
  },
  session: {
    getItem(key: string): string | null {
      try {
        return sessionStorage.getItem(prefixed(key));
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string): void {
      try {
        sessionStorage.setItem(prefixed(key), value);
      } catch {
        // ignore
      }
    },
    removeItem(key: string): void {
      try {
        sessionStorage.removeItem(prefixed(key));
      } catch {
        // ignore
      }
    },
  },
};
