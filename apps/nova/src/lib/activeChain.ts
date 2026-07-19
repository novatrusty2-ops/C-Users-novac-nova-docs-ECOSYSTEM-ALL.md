const KEY = 'nova.activeChain.v1'
export const DEFAULT_CHAIN_ID = 22016

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function getActiveChainId(): number {
  const raw = storage()?.getItem(KEY)
  if (raw == null) return DEFAULT_CHAIN_ID
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : DEFAULT_CHAIN_ID
}

export function setActiveChainId(chainId: number): void {
  storage()?.setItem(KEY, String(chainId))
}
