// Persistence layer. localStorage is used when available (Koder's preview,
// Safari, Add-to-Home-Screen all support it); if it throws (private mode, some
// file:// contexts) we fall back to an in-memory map so the app never crashes.

const KEY = 'infinite.ip.v1';

const mem: Record<string, string> = {};

function getItem(k: string): string | null {
  try {
    return window.localStorage.getItem(k);
  } catch {
    return k in mem ? mem[k] : null;
  }
}

function setItem(k: string, v: string): void {
  try {
    window.localStorage.setItem(k, v);
  } catch {
    mem[k] = v;
  }
}

export function loadRaw<T>(): T | null {
  const s = getItem(KEY);
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function saveRaw(state: unknown): void {
  setItem(KEY, JSON.stringify(state));
}

/** Export the full state as a JSON string the user can back up. */
export function exportRaw(): string {
  return getItem(KEY) ?? '{}';
}

/** Import previously exported JSON. Returns true on success. */
export function importRaw(json: string): boolean {
  try {
    JSON.parse(json); // validate
    setItem(KEY, json);
    return true;
  } catch {
    return false;
  }
}

export function clearRaw(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    delete mem[KEY];
  }
}
