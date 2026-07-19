const PREFIX = 'signet.prefs.'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function getPref<T>(key: string, fallback: T): T {
  const raw = storage()?.getItem(PREFIX + key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setPref<T>(key: string, value: T): void {
  storage()?.setItem(PREFIX + key, JSON.stringify(value))
}

export function removePref(key: string): void {
  storage()?.removeItem(PREFIX + key)
}
