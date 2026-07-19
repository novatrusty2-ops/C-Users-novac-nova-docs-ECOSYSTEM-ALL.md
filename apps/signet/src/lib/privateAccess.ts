import { privateBankingChains } from '@/lib/chains'
import type { ChainDefinition } from '@/types'
import { clearGate, isGateUnlocked } from './institutionalGate'

export function canViewPrivateBankingChains(): boolean {
  return isGateUnlocked()
}

export function visiblePrivateBankingChains(): ChainDefinition[] {
  if (!canViewPrivateBankingChains()) return []
  return privateBankingChains()
}

export function requirePrivateAccess(): boolean {
  return isGateUnlocked()
}

export function revokePrivateAccess(): void {
  clearGate()
}
