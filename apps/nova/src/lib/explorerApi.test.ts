import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  DBIS_CHAIN_ID,
  DBIS_EXPLORER_BASES,
  etherscanCompatGet,
  fetchAccountTokenBalances,
  fetchAccountTxs,
  mergeCatalogWithExplorerBalances,
} from './explorerApi'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('explorerApi (Blockscout / Etherscan-compatible)', () => {
  it('uses DBIS Blockscout hosts, never etherscan.io', () => {
    expect(DBIS_CHAIN_ID).toBe(138)
    expect(DBIS_EXPLORER_BASES[0]).toContain('explorer.defi-oracle.io')
    expect(DBIS_EXPLORER_BASES).toContain('https://explorer.d-bis.org')
    for (const base of DBIS_EXPLORER_BASES) {
      expect(base.includes('etherscan.io')).toBe(false)
    }
  })

  it('parses Etherscan-compatible tokenlist responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('action=tokenlist')) {
          return {
            ok: true,
            json: async () => ({
              status: '1',
              result: [
                {
                  contractAddress: '0xabc',
                  symbol: 'USDT',
                  name: 'Tether USD',
                  decimals: '6',
                  balance: '1000000',
                },
              ],
            }),
          }
        }
        if (String(url).includes('action=balance')) {
          return {
            ok: true,
            json: async () => ({ status: '1', result: '5000000000000000000' }),
          }
        }
        return { ok: false, json: async () => ({}) }
      }),
    )

    const rows = await fetchAccountTokenBalances(138, '0x123')
    expect(rows.some((r) => r.symbol === 'USDT' && r.balanceRaw === 1000000n)).toBe(true)
    expect(rows.some((r) => r.symbol === 'ETH' && r.balanceRaw === 5000000000000000000n)).toBe(true)
  })

  it('parses txlist into activity-shaped rows', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          status: '1',
          result: [
            {
              hash: '0xdead',
              from: '0xaaa',
              to: '0xbbb',
              value: '1000000000000000000',
              timeStamp: '1700000000',
              isError: '0',
            },
          ],
        }),
      })),
    )
    const txs = await fetchAccountTxs(138, '0xaaa')
    expect(txs).toHaveLength(1)
    expect(txs[0]?.hash).toBe('0xdead')
    expect(txs[0]?.chainId).toBe(138)
    expect(txs[0]?.status).toBe('confirmed')
  })

  it('merges explorer balances without dropping catalog tokens', () => {
    const catalog = [
      { symbol: 'ETH', address: null as string | null },
      { symbol: 'USDT', address: null as string | null },
      { symbol: 'SHIVA', address: null as string | null },
    ]
    const merged = mergeCatalogWithExplorerBalances(catalog, [
      {
        contractAddress: '0xusdt',
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6,
        balanceRaw: 2n,
        type: 'erc20',
      },
      {
        contractAddress: '0xnew',
        symbol: 'NEW',
        name: 'New',
        decimals: 18,
        balanceRaw: 3n,
        type: 'erc20',
      },
    ])
    expect(merged.some((t) => t.symbol === 'SHIVA')).toBe(true)
    expect(merged.some((t) => t.symbol === 'ETH')).toBe(true)
    expect(merged.some((t) => t.symbol === 'USDT' && t.explorerBalanceRaw === 2n)).toBe(true)
    expect(merged.some((t) => t.symbol === 'NEW')).toBe(true)
  })

  it('etherscanCompatGet returns null when explorers are down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })))
    const data = await etherscanCompatGet(138, { module: 'stats', action: 'ethsupply' })
    expect(data).toBeNull()
  })
})
