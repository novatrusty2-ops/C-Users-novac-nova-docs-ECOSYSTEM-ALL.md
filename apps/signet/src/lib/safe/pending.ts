import type { PendingSafeTx } from '@/types'
import { computeSafeTxHash, type SafeTxParams } from './transactions'

const KEY = 'signet.safe.pending.v3'

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

export interface StoredPendingSafeTx extends PendingSafeTx {
  nonce: number
  chainId: number
  ownerConfirmations: string[]
}

export function loadPendingSafeTxs(): StoredPendingSafeTx[] {
  const raw = storage()?.getItem(KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as StoredPendingSafeTx[]
  } catch {
    return []
  }
}

function savePending(list: StoredPendingSafeTx[]): void {
  storage()?.setItem(KEY, JSON.stringify(list))
}

export function proposeSafeTx(
  params: SafeTxParams & { threshold: number },
): StoredPendingSafeTx {
  const tx: StoredPendingSafeTx = {
    safeTxHash: computeSafeTxHash(params),
    safeAddress: params.safeAddress,
    to: params.to,
    value: params.value,
    data: params.data,
    confirmations: 0,
    threshold: params.threshold,
    executed: false,
    nonce: params.nonce,
    chainId: params.chainId,
    ownerConfirmations: [],
  }
  savePending([tx, ...loadPendingSafeTxs().filter((p) => p.safeTxHash !== tx.safeTxHash)])
  return tx
}

export function confirmSafeTx(safeTxHash: string, ownerAddress: string): StoredPendingSafeTx | undefined {
  const list = loadPendingSafeTxs()
  const idx = list.findIndex((p) => p.safeTxHash === safeTxHash)
  if (idx < 0) return undefined
  const tx = list[idx]!
  const owner = ownerAddress.toLowerCase()
  if (!tx.ownerConfirmations.map((o) => o.toLowerCase()).includes(owner)) {
    tx.ownerConfirmations.push(ownerAddress)
    tx.confirmations = tx.ownerConfirmations.length
  }
  list[idx] = tx
  savePending(list)
  return tx
}

export function executeSafeTx(safeTxHash: string): StoredPendingSafeTx | undefined {
  const list = loadPendingSafeTxs()
  const tx = list.find((p) => p.safeTxHash === safeTxHash)
  if (!tx || tx.executed) return undefined
  if (tx.confirmations < tx.threshold) throw new Error('Insufficient confirmations')
  tx.executed = true
  savePending(list.map((p) => (p.safeTxHash === safeTxHash ? tx : p)))
  return tx
}

export function removePendingSafeTx(safeTxHash: string): void {
  savePending(loadPendingSafeTxs().filter((p) => p.safeTxHash !== safeTxHash))
}

export function pendingForSafe(safeAddress: string): StoredPendingSafeTx[] {
  const addr = safeAddress.toLowerCase()
  return loadPendingSafeTxs().filter((p) => p.safeAddress.toLowerCase() === addr && !p.executed)
}

export function clearPendingSafeTxs(): void {
  storage()?.removeItem(KEY)
}
