import type { NovaPlusTokenSnap } from './novaPlusSnapshot'
import { isNovaPlusChain } from './novaPlus'

export type TokenSkillId =
  | 'trade'
  | 'swap'
  | 'transfer'
  | 'chart'
  | 'liquidity'
  | 'custody'
  | 'fiat'
  | 'mesh'

export interface TokenSkill {
  id: TokenSkillId
  label: string
  description: string
  enabled: boolean
}

export interface TokenSkillProfile {
  symbol: string
  chainId: number
  skills: TokenSkill[]
}

/** Build production skill chips for a token on a Nova Plus chain */
export function buildTokenSkills(
  snap: Pick<
    NovaPlusTokenSnap,
    'symbol' | 'assetClass' | 'tradable' | 'swappable' | 'transferable' | 'decentralized'
  >,
  chainId: number,
): TokenSkillProfile {
  const onMesh = isNovaPlusChain(chainId)
  const fiat = snap.assetClass === 'fiat'
  const skills: TokenSkill[] = [
    {
      id: 'trade',
      label: 'Trade',
      description: 'Listed on Nova Plus markets',
      enabled: onMesh && snap.tradable && !fiat,
    },
    {
      id: 'swap',
      label: 'Swap',
      description: 'Swappable via Nova Swap / mesh pairs',
      enabled: onMesh && snap.swappable,
    },
    {
      id: 'transfer',
      label: 'Transfer',
      description: 'Send & receive on this chain',
      enabled: snap.transferable,
    },
    {
      id: 'chart',
      label: 'Chart',
      description: 'Price & liquidity chart available',
      enabled: onMesh && !fiat,
    },
    {
      id: 'liquidity',
      label: 'Liquidity',
      description: 'Mesh pool depth & 24h volume',
      enabled: onMesh && snap.tradable,
    },
    {
      id: 'custody',
      label: 'Custody',
      description: 'Nova Bank / Production custody rails',
      enabled: chainId === 9001 || !snap.decentralized || fiat,
    },
    {
      id: 'fiat',
      label: 'Fiat',
      description: 'Fiat ledger asset',
      enabled: fiat,
    },
    {
      id: 'mesh',
      label: 'Mesh',
      description: 'Shared Nova Plus HD address space',
      enabled: onMesh && snap.decentralized,
    },
  ]
  return { symbol: snap.symbol, chainId, skills }
}

export function enabledSkills(profile: TokenSkillProfile): TokenSkill[] {
  return profile.skills.filter((s) => s.enabled)
}
