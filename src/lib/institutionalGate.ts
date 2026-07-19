const TOKEN_KEY = 'signet.institutional.gate'

function storage(): Storage | null {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null
  } catch {
    return null
  }
}

export function isGateUnlocked(): boolean {
  const token = storage()?.getItem(TOKEN_KEY)
  return typeof token === 'string' && token.length > 0
}

export function getGateToken(): string | null {
  return storage()?.getItem(TOKEN_KEY) ?? null
}

export function setGateUnlocked(token: string): void {
  if (!token) return
  storage()?.setItem(TOKEN_KEY, token)
}

export function clearGate(): void {
  storage()?.removeItem(TOKEN_KEY)
}
