import { describe, expect, it } from 'vitest'
import { executeBridge, quoteBridge } from './execute'
import { clearBridgeHistory, loadBridgeHistory } from './history'
import { BRIDGE_ROUTES, findBridgeRoute, routesFromChain } from './routes'
import {
  ALLTRA_CHAIN_ID,
  ANAKA_BRIDGE_CHAIN_ID,
  DEFI_ORACLE_CHAIN_ID,
  NOVAONE_CHAIN_ID,
  NRW_CHAIN_ID,
} from './constants'
import { BRIDGE_TOKENS } from './tokens'

const SENDER = '0x1111111111111111111111111111111111111111'

describe('bridge routes', () => {
  it('includes NovaOne ↔ NRW World routes', () => {
    expect(findBridgeRoute(NOVAONE_CHAIN_ID, NRW_CHAIN_ID)?.id).toBe('novaone-nrw')
    expect(findBridgeRoute(NRW_CHAIN_ID, NOVAONE_CHAIN_ID)?.id).toBe('nrw-novaone')
  })

  it('includes DeFi Oracle spoke routes', () => {
    expect(findBridgeRoute(NOVAONE_CHAIN_ID, DEFI_ORACLE_CHAIN_ID)?.kind).toBe('spoke')
  })

  it('includes ALLTRA hub route', () => {
    expect(findBridgeRoute(ALLTRA_CHAIN_ID, NOVAONE_CHAIN_ID)?.kind).toBe('hub')
  })

  it('includes Anaka vault routes', () => {
    expect(findBridgeRoute(NOVAONE_CHAIN_ID, ANAKA_BRIDGE_CHAIN_ID)?.kind).toBe('vault')
    expect(findBridgeRoute(ANAKA_BRIDGE_CHAIN_ID, NOVAONE_CHAIN_ID)?.kind).toBe('vault')
  })

  it('lists routes from NovaOne', () => {
    const routes = routesFromChain(NOVAONE_CHAIN_ID)
    expect(routes.length).toBeGreaterThanOrEqual(3)
  })

  it('has unique route ids', () => {
    const ids = BRIDGE_ROUTES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns undefined for unknown pair', () => {
    expect(findBridgeRoute(1, 56)).toBeUndefined()
  })
})

describe('bridge quote + execute', () => {
  it('quotes fee correctly', () => {
    const q = quoteBridge(NOVAONE_CHAIN_ID, NRW_CHAIN_ID, 'NOVA', '100')
    expect(q.feeBps).toBeGreaterThan(0)
    expect(Number(q.amountOut)).toBeLessThan(100)
    expect(Number(q.fee) + Number(q.amountOut)).toBeCloseTo(100, 4)
  })

  it('rejects invalid amount', () => {
    expect(() => quoteBridge(NOVAONE_CHAIN_ID, NRW_CHAIN_ID, 'NOVA', '0')).toThrow(/amount/i)
  })

  it('rejects missing route', () => {
    expect(() => quoteBridge(1, 56, 'ETH', '1')).toThrow(/route/i)
  })

  it('executes mock bridge and records history', async () => {
    clearBridgeHistory()
    const result = await executeBridge({
      fromChainId: NOVAONE_CHAIN_ID,
      toChainId: NRW_CHAIN_ID,
      symbol: 'NOVA',
      amount: '10',
      sender: SENDER,
    })
    expect(result.mockTxHash).toMatch(/^0x/)
    expect(result.entry.status).toBe('completed')
    expect(loadBridgeHistory()).toHaveLength(1)
  })

  it('appends multiple history entries', async () => {
    clearBridgeHistory()
    await executeBridge({
      fromChainId: NOVAONE_CHAIN_ID,
      toChainId: NRW_CHAIN_ID,
      symbol: 'NOVA',
      amount: '1',
      sender: SENDER,
    })
    await executeBridge({
      fromChainId: NRW_CHAIN_ID,
      toChainId: NOVAONE_CHAIN_ID,
      symbol: 'NRW',
      amount: '2',
      sender: SENDER,
    })
    expect(loadBridgeHistory()).toHaveLength(2)
  })

  it('uses vault fee bps for anaka vault', () => {
    const q = quoteBridge(NOVAONE_CHAIN_ID, ANAKA_BRIDGE_CHAIN_ID, 'AGAS', '1000')
    expect(q.feeBps).toBe(20)
  })
})

describe('bridge tokens', () => {
  it('exposes bridgeable symbols for novaone and nrw', () => {
    const symbols = BRIDGE_TOKENS.map((t) => t.symbol)
    expect(symbols).toEqual(expect.arrayContaining(['NOVA', 'NRW']))
  })
})
