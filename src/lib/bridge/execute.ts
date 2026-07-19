import { keccak256, toUtf8Bytes, zeroPadValue } from 'ethers'
import { findBridgeRoute } from './routes'
import { appendBridgeHistory, type BridgeHistoryEntry } from './history'

export interface BridgeQuote {
  routeId: string
  fromChainId: number
  toChainId: number
  symbol: string
  amountIn: string
  amountOut: string
  fee: string
  feeBps: number
}

export interface ExecuteBridgeParams {
  fromChainId: number
  toChainId: number
  symbol: string
  amount: string
  sender: string
}

export interface ExecuteBridgeResult {
  entry: BridgeHistoryEntry
  mockTxHash: string
}

function mockTxHash(params: ExecuteBridgeParams, routeId: string): string {
  return keccak256(
    toUtf8Bytes(`${routeId}:${params.sender}:${params.amount}:${params.symbol}:${Date.now()}`),
  )
}

export function quoteBridge(
  fromChainId: number,
  toChainId: number,
  symbol: string,
  amount: string,
): BridgeQuote {
  const route = findBridgeRoute(fromChainId, toChainId)
  if (!route) throw new Error('No bridge route')
  const amountNum = Number(amount)
  if (!Number.isFinite(amountNum) || amountNum <= 0) throw new Error('Invalid amount')
  const fee = (amountNum * route.feeBps) / 10_000
  const amountOut = amountNum - fee
  return {
    routeId: route.id,
    fromChainId,
    toChainId,
    symbol,
    amountIn: amount,
    amountOut: amountOut.toFixed(6).replace(/\.?0+$/, ''),
    fee: fee.toFixed(6).replace(/\.?0+$/, ''),
    feeBps: route.feeBps,
  }
}

/** Mock bridge execution — records history for UI/tests */
export async function executeBridge(params: ExecuteBridgeParams): Promise<ExecuteBridgeResult> {
  const quote = quoteBridge(params.fromChainId, params.toChainId, params.symbol, params.amount)
  const mockHash = mockTxHash(params, quote.routeId)
  const entry: BridgeHistoryEntry = {
    id: crypto.randomUUID(),
    routeId: quote.routeId,
    fromChainId: params.fromChainId,
    toChainId: params.toChainId,
    symbol: params.symbol,
    amount: params.amount,
    fee: quote.fee,
    txHash: mockHash,
    status: 'completed',
    timestamp: Date.now(),
  }
  appendBridgeHistory(entry)
  return { entry, mockTxHash: zeroPadValue(mockHash, 32) }
}
