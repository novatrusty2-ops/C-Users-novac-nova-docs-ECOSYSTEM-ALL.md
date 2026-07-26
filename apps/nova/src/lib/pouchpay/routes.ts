/**
 * PouchPay / ALLTRA Global Swap route client.
 * Prefer a bridge base that returns callData (VITE_POUCHPAY_API_BASE).
 */

export const POUCHPAY_API_BASE = (
  (import.meta.env.VITE_POUCHPAY_API_BASE as string | undefined) ||
  (import.meta.env.VITE_POUCHPAY_BRIDGE_URL as string | undefined) ||
  'https://api.pouchpay.io'
).replace(/\/$/, '')

export const ALLTRA_CHAIN_ID = 651940
export const ALLTRA_ROUTER = '0xEd04ee8307C0656207af5afe3926Ae2380052940'

export interface PouchpayTransactionRequest {
  chainId: number
  from?: string
  to: string
  data: string
  value: string
  gasLimit?: string
}

export interface PouchpayRouteQuote {
  chainId: number
  fromSymbol: string
  toSymbol: string
  amountIn: string
  amountOut: string
  path: string[]
  router: string
  callData: string
  transactionRequest: PouchpayTransactionRequest
  onChainLiquidity: boolean
  method?: string
  minAmountOut?: string
  provider: 'pouchpay'
  httpStatus: number
  status?: 'green' | string
  color?: 'green' | string
  ok?: boolean
}

export class MissingCallDataError extends Error {
  constructor(message = 'PouchPay route missing callData') {
    super(message)
    this.name = 'MissingCallDataError'
  }
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return { raw: text }
  }
}

function pickCallData(data: Record<string, unknown>): string | null {
  const direct = data.callData ?? data.data
  if (typeof direct === 'string' && /^0x[0-9a-fA-F]+$/.test(direct) && direct.length > 10) {
    return direct
  }
  const tx = data.transactionRequest as Record<string, unknown> | undefined
  if (tx && typeof tx.data === 'string' && /^0x[0-9a-fA-F]+$/.test(tx.data)) {
    return tx.data
  }
  return null
}

function pickPath(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.path) && data.path.every((p) => typeof p === 'string')) {
    return data.path as string[]
  }
  return []
}

/** Quote a PouchPay / ALLTRA route. Throws MissingCallDataError when call data is absent. */
export async function quotePouchpayRoute(
  fromSymbol: string,
  toSymbol: string,
  amount: string,
  options: {
    base?: string
    recipient?: string
    slippageBps?: number
    requireCallData?: boolean
    /** Prefer local UniswapV2 callData builder (default true — fixes upstream gap). */
    preferOnChainBuilder?: boolean
  } = {},
): Promise<PouchpayRouteQuote> {
  const preferOnChain = options.preferOnChainBuilder !== false
  if (preferOnChain) {
    const { buildAlltraCallDataQuote } = await import('./calldata')
    return buildAlltraCallDataQuote(fromSymbol, toSymbol, amount, {
      recipient: options.recipient,
      slippageBps: options.slippageBps,
    })
  }

  const base = options.base ?? POUCHPAY_API_BASE
  const requireCallData = options.requireCallData !== false
  const body: Record<string, unknown> = {
    amount,
    chainId: ALLTRA_CHAIN_ID,
    fromSymbol: fromSymbol.toUpperCase(),
    toSymbol: toSymbol.toUpperCase(),
    tradeType: 0,
    slippageBps: options.slippageBps ?? 100,
  }
  if (options.recipient) body.recipient = options.recipient

  const res = await fetch(`${base}/v0/quote`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await parse(res)) as Record<string, unknown> | null
  if (!res.ok || !data || typeof data !== 'object') {
    const msg =
      (data && typeof data.message === 'string' && data.message) ||
      `pouchpay quote HTTP ${res.status}`
    throw new Error(msg)
  }

  const callData = pickCallData(data)
  const path = pickPath(data)
  if (requireCallData && (!callData || path.length < 2)) {
    throw new MissingCallDataError(
      `PouchPay route ${fromSymbol}→${toSymbol} missing callData (path length ${path.length})`,
    )
  }

  const tx = (data.transactionRequest as PouchpayTransactionRequest | undefined) || {
    chainId: ALLTRA_CHAIN_ID,
    to: String(data.router || ALLTRA_ROUTER),
    data: callData || '0x',
    value: '0x0',
  }

  return {
    chainId: Number(data.chainId ?? ALLTRA_CHAIN_ID),
    fromSymbol: String(data.fromSymbol ?? fromSymbol).toUpperCase(),
    toSymbol: String(data.toSymbol ?? toSymbol).toUpperCase(),
    amountIn: String(data.amountIn ?? data.inputAmount ?? amount),
    amountOut: String(data.amountOut ?? data.toAmount ?? data.you_receive ?? ''),
    path,
    router: String(data.router || ALLTRA_ROUTER),
    callData: callData || '0x',
    transactionRequest: tx,
    onChainLiquidity: Boolean(data.onChainLiquidity),
    method: data.method != null ? String(data.method) : undefined,
    minAmountOut:
      data.minAmountOut != null
        ? String(data.minAmountOut)
        : data.minReceived != null
          ? String(data.minReceived)
          : undefined,
    provider: 'pouchpay',
    httpStatus: res.status,
  }
}

/** Advanced routes with step-level callData (LiFi-shaped). */
export async function fetchPouchpayAdvancedRoutes(
  fromSymbol: string,
  toSymbol: string,
  amount: string,
  options: { base?: string; recipient?: string } = {},
): Promise<{ routes: Array<Record<string, unknown>> }> {
  const base = options.base ?? POUCHPAY_API_BASE
  const res = await fetch(`${base}/v1/advanced/routes`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      chainId: ALLTRA_CHAIN_ID,
      fromSymbol: fromSymbol.toUpperCase(),
      toSymbol: toSymbol.toUpperCase(),
      tradeType: 0,
      ...(options.recipient ? { recipient: options.recipient } : {}),
    }),
  })
  const data = (await parse(res)) as { routes?: Array<Record<string, unknown>>; message?: string }
  if (!res.ok) throw new Error(data?.message || `advanced/routes HTTP ${res.status}`)
  const routes = Array.isArray(data.routes) ? data.routes : []
  for (const route of routes) {
    const steps = Array.isArray(route.steps) ? route.steps : []
    const step = steps[0] as Record<string, unknown> | undefined
    const callData =
      (typeof route.callData === 'string' && route.callData) ||
      (step && typeof step.callData === 'string' && step.callData) ||
      null
    if (!callData) {
      throw new MissingCallDataError(
        `PouchPay advanced route ${fromSymbol}→${toSymbol} missing step callData`,
      )
    }
  }
  return { routes }
}
