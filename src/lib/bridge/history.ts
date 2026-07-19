import { BRIDGE_STORAGE_KEY } from './constants'

export type BridgeHistoryStatus = 'pending' | 'completed' | 'failed'

export interface BridgeHistoryEntry {
  id: string
  routeId: string
  fromChainId: number
  toChainId: number
  symbol: string
  amount: string
  fee: string
  txHash: string
  status: BridgeHistoryStatus
  timestamp: number
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export function loadBridgeHistory(): BridgeHistoryEntry[] {
  const raw = storage()?.getItem(BRIDGE_STORAGE_KEY)
  if (!raw) return []
  try {
    return (JSON.parse(raw) as BridgeHistoryEntry[]).sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

export function saveBridgeHistory(entries: BridgeHistoryEntry[]): void {
  storage()?.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(entries.slice(0, 200)))
}

export function appendBridgeHistory(entry: BridgeHistoryEntry): void {
  saveBridgeHistory([entry, ...loadBridgeHistory()])
}

export function updateBridgeHistoryStatus(id: string, status: BridgeHistoryStatus): void {
  saveBridgeHistory(loadBridgeHistory().map((e) => (e.id === id ? { ...e, status } : e)))
}

export function clearBridgeHistory(): void {
  storage()?.removeItem(BRIDGE_STORAGE_KEY)
}
