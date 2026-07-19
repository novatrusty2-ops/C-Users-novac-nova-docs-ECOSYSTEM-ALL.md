import type { BridgeRoute } from '@/types'
import {
  ALLTRA_CHAIN_ID,
  ANAKA_BRIDGE_CHAIN_ID,
  BRIDGE_FEE_BPS_DEFAULT,
  DEFI_ORACLE_CHAIN_ID,
  NOVAONE_CHAIN_ID,
  NRW_CHAIN_ID,
} from './constants'

export const BRIDGE_ROUTES: BridgeRoute[] = [
  {
    id: 'novaone-nrw',
    fromChainId: NOVAONE_CHAIN_ID,
    toChainId: NRW_CHAIN_ID,
    kind: 'hub',
    feeBps: BRIDGE_FEE_BPS_DEFAULT,
  },
  {
    id: 'nrw-novaone',
    fromChainId: NRW_CHAIN_ID,
    toChainId: NOVAONE_CHAIN_ID,
    kind: 'hub',
    feeBps: BRIDGE_FEE_BPS_DEFAULT,
  },
  {
    id: 'novaone-defi-oracle',
    fromChainId: NOVAONE_CHAIN_ID,
    toChainId: DEFI_ORACLE_CHAIN_ID,
    kind: 'spoke',
    feeBps: BRIDGE_FEE_BPS_DEFAULT,
  },
  {
    id: 'defi-oracle-novaone',
    fromChainId: DEFI_ORACLE_CHAIN_ID,
    toChainId: NOVAONE_CHAIN_ID,
    kind: 'spoke',
    feeBps: BRIDGE_FEE_BPS_DEFAULT,
  },
  {
    id: 'alltra-hub-novaone',
    fromChainId: ALLTRA_CHAIN_ID,
    toChainId: NOVAONE_CHAIN_ID,
    kind: 'hub',
    feeBps: 50,
  },
  {
    id: 'novaone-anaka-vault',
    fromChainId: NOVAONE_CHAIN_ID,
    toChainId: ANAKA_BRIDGE_CHAIN_ID,
    kind: 'vault',
    feeBps: 20,
  },
  {
    id: 'anaka-vault-novaone',
    fromChainId: ANAKA_BRIDGE_CHAIN_ID,
    toChainId: NOVAONE_CHAIN_ID,
    kind: 'vault',
    feeBps: 20,
  },
]

export function findBridgeRoute(fromChainId: number, toChainId: number): BridgeRoute | undefined {
  return BRIDGE_ROUTES.find((r) => r.fromChainId === fromChainId && r.toChainId === toChainId)
}

export function routesFromChain(chainId: number): BridgeRoute[] {
  return BRIDGE_ROUTES.filter((r) => r.fromChainId === chainId)
}
