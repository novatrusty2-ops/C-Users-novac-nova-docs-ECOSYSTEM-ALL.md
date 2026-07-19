const KEY = 'signet.fafo.v3'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function isFafoMode(): boolean {
  return storage()?.getItem(KEY) === '1'
}

export function setFafoMode(enabled: boolean): void {
  const s = storage()
  if (!s) return
  if (enabled) s.setItem(KEY, '1')
  else s.removeItem(KEY)
}

export function toggleFafoMode(): boolean {
  const next = !isFafoMode()
  setFafoMode(next)
  return next
}
