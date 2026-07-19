import type { ChainDefinition } from '@/types'
import { CHAINS, defaultChainIds } from './chains'

const ENABLED_KEY = 'nova.enabledChains.v1'

type NetworksListener = () => void
const listeners = new Set<NetworksListener>()

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    return null
  }
}

function notify(): void {
  for (const cb of listeners) cb()
}

export function onNetworksChange(cb: NetworksListener): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getEnabledChainIds(): number[] {
  const raw = storage()?.getItem(ENABLED_KEY)
  if (!raw) return defaultChainIds()
  try {
    const ids = JSON.parse(raw) as number[]
    return Array.isArray(ids) && ids.length > 0 ? ids : defaultChainIds()
  } catch {
    return defaultChainIds()
  }
}

export function setEnabledChainIds(ids: number[]): void {
  storage()?.setItem(ENABLED_KEY, JSON.stringify([...new Set(ids)]))
  notify()
}

export function toggleChain(id: number): number[] {
  const ids = new Set(getEnabledChainIds())
  if (ids.has(id)) ids.delete(id)
  else ids.add(id)
  const next = [...ids]
  setEnabledChainIds(next)
  return next
}

export function allKnownChains(): ChainDefinition[] {
  return CHAINS
}
