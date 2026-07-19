import { JsonRpcProvider } from 'ethers'
import type { ChainDefinition } from '@/types'
import { CHAINS, defaultChainIds } from './chains'

const ENABLED_KEY = 'signet.enabledChains.v3'
const CUSTOM_KEY = 'signet.customChains.v3'

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

export function getCustomChains(): ChainDefinition[] {
  const raw = storage()?.getItem(CUSTOM_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as ChainDefinition[]
  } catch {
    return []
  }
}

export function addCustomChain(chain: ChainDefinition): void {
  const list = getCustomChains().filter((c) => c.id !== chain.id)
  list.push(chain)
  storage()?.setItem(CUSTOM_KEY, JSON.stringify(list))
  notify()
}

export function removeCustomChain(id: number): void {
  storage()?.setItem(
    CUSTOM_KEY,
    JSON.stringify(getCustomChains().filter((c) => c.id !== id)),
  )
  notify()
}

export function allKnownChains(): ChainDefinition[] {
  const custom = getCustomChains()
  const byId = new Map<number, ChainDefinition>()
  for (const c of CHAINS) byId.set(c.id, c)
  for (const c of custom) byId.set(c.id, c)
  return [...byId.values()]
}

export async function validateRpcChainId(rpcUrl: string): Promise<number> {
  const provider = new JsonRpcProvider(rpcUrl)
  try {
    const network = await provider.getNetwork()
    return Number(network.chainId)
  } finally {
    provider.destroy()
  }
}
