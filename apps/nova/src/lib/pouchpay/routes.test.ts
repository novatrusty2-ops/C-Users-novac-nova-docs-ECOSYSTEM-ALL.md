import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  MissingCallDataError,
  quotePouchpayRoute,
  fetchPouchpayAdvancedRoutes,
  ALLTRA_ROUTER,
} from './routes'
import { isAlltraRpcTransportError } from './rpc'
import * as calldata from './calldata'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('pouchpay routes client', () => {
  it('builds on-chain callData by default when Alltra RPC is healthy', async () => {
    try {
      const q = await quotePouchpayRoute('ALL', 'AUSDT', '0.01', {
        recipient: '0x5227115Ba7c8694218f570c1EC2a680095872820',
      })
      expect(q.callData.startsWith('0x7ff36ab5')).toBe(true)
      expect(q.path).toHaveLength(2)
      expect(q.onChainLiquidity).toBe(true)
      expect(q.provider).toBe('pouchpay')
      expect(q.router.toLowerCase()).toBe(ALLTRA_ROUTER.toLowerCase())
    } catch (err) {
      if (isAlltraRpcTransportError(err)) {
        // Live Alltra RPC is down — covered by mocked fallback tests below.
        return
      }
      throw err
    }
  })

  it('falls back to bridge HTTP when on-chain builder hits RPC transport errors', async () => {
    vi.spyOn(calldata, 'buildAlltraCallDataQuote').mockRejectedValue(
      new Error('Alltra RPC unreachable (tried 2 endpoints): 502 Bad Gateway'),
    )
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            ok: true,
            fromSymbol: 'ALL',
            toSymbol: 'AUSDT',
            amountIn: '1',
            amountOut: '0.99',
            path: [
              '0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4',
              '0x015b1897ed5279930bc2be46f661894d219292a6',
            ],
            router: ALLTRA_ROUTER,
            callData: '0x7ff36ab50000000000000000000000000000000000000000000000000000000000000001',
            onChainLiquidity: true,
            method: 'swapExactETHForTokens',
            transactionRequest: {
              chainId: 651940,
              to: ALLTRA_ROUTER,
              data: '0x7ff36ab50000000000000000000000000000000000000000000000000000000000000001',
              value: '0x1',
            },
          }),
      })),
    )

    const q = await quotePouchpayRoute('ALL', 'AUSDT', '1', {
      recipient: '0x5227115Ba7c8694218f570c1EC2a680095872820',
    })
    expect(q.callData.startsWith('0x7ff36ab5')).toBe(true)
    expect(q.amountOut).toBe('0.99')
    expect(q.path.length).toBeGreaterThanOrEqual(2)
  })

  it('throws MissingCallDataError when HTTP upstream omits callData', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            ok: true,
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

  it('throws when bridge returns HTTP 200 with ok:false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            ok: false,
            status: 'green',
            httpStatus: 200,
            message: 'Alltra RPC unreachable',
            callData: null,
            path: [],
          }),
      })),
    )

    await expect(
      quotePouchpayRoute('ALL', 'AUSDT', '1', { preferOnChainBuilder: false }),
    ).rejects.toThrow(/Alltra RPC unreachable/)
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
