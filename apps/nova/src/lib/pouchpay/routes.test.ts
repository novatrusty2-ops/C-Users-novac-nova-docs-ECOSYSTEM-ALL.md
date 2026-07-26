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
  it('accepts quotes that include callData + path', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            chainId: 651940,
            fromSymbol: 'ALL',
            toSymbol: 'AUSDT',
            amountIn: '0.01',
            amountOut: '0.0003',
            path: [
              '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4',
              '0x015b1897ed5279930bc2be46f661894d219292a6',
            ],
            router: ALLTRA_ROUTER,
            callData: '0x7ff36ab5' + '00'.repeat(64),
            onChainLiquidity: true,
            transactionRequest: {
              chainId: 651940,
              to: ALLTRA_ROUTER,
              data: '0x7ff36ab5' + '00'.repeat(64),
              value: '0x2386f26fc10000',
            },
          }),
      })),
    )

    const q = await quotePouchpayRoute('ALL', 'AUSDT', '0.01', {
      recipient: '0x5227115Ba7c8694218f570c1EC2a680095872820',
    })
    expect(q.callData.startsWith('0x7ff36ab5')).toBe(true)
    expect(q.path).toHaveLength(2)
    expect(q.onChainLiquidity).toBe(true)
    expect(q.provider).toBe('pouchpay')
  })

  it('throws MissingCallDataError when upstream omits callData', async () => {
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

    await expect(quotePouchpayRoute('ALL', 'AUSDT', '1')).rejects.toBeInstanceOf(
      MissingCallDataError,
    )
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
