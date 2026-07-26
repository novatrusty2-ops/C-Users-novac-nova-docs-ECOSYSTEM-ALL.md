import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  MissingCallDataError,
  quotePouchpayRoute,
  fetchPouchpayAdvancedRoutes,
  ALLTRA_ROUTER,
} from './routes'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pouchpay routes client', () => {
  it('builds on-chain callData by default (live Alltra router)', async () => {
    const q = await quotePouchpayRoute('ALL', 'AUSDT', '0.01', {
      recipient: '0x5227115Ba7c8694218f570c1EC2a680095872820',
    })
    expect(q.callData.startsWith('0x7ff36ab5')).toBe(true)
    expect(q.path).toHaveLength(2)
    expect(q.onChainLiquidity).toBe(true)
    expect(q.provider).toBe('pouchpay')
    expect(q.router.toLowerCase()).toBe(ALLTRA_ROUTER.toLowerCase())
  })

  it('throws MissingCallDataError when HTTP upstream omits callData', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            fromSymbol: 'ALL',
            toSymbol: 'AUSDT',
            path: [],
            router: ALLTRA_ROUTER,
            legacyOnChainSwapRemoved: true,
            virtualLpOnly: true,
            toAmount: '0.01',
          }),
      })),
    )

    await expect(
      quotePouchpayRoute('ALL', 'AUSDT', '1', { preferOnChainBuilder: false }),
    ).rejects.toBeInstanceOf(MissingCallDataError)
  })

  it('requires step callData on advanced routes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            routes: [
              {
                id: 'ALL_ALL',
                fromToken: { symbol: 'ALL' },
                toToken: { symbol: 'ALL' },
                steps: [{ type: 'smart', id: 'x' }],
              },
            ],
          }),
      })),
    )

    await expect(fetchPouchpayAdvancedRoutes('ALL', 'AUSDT', '1')).rejects.toBeInstanceOf(
      MissingCallDataError,
    )
  })
})
