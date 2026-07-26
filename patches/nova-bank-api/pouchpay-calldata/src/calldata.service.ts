import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import {
  encodeGetAmountsOut,
  encodeSwapExactETHForTokens,
  encodeSwapExactTokensForETH,
  encodeSwapExactTokensForTokens,
  decodeAmountsOut,
} from './abi'
import {
  CHAIN_ID,
  ROUTER,
  DEFAULT_RPC,
  resolveToken,
  buildSwapPath,
  parseAmountIn,
  formatUnits,
  tokenMeta,
  NATIVE,
} from './tokens'

export type QuoteInput = {
  fromSymbol?: string
  toSymbol?: string
  tokenIn?: string
  tokenOut?: string
  fromToken?: string | { symbol?: string; address?: string }
  toToken?: string | { symbol?: string; address?: string }
  fromTokenAddress?: string
  toTokenAddress?: string
  amount?: string | number
  amountIn?: string | number
  fromAmount?: string | number
  slippageBps?: number
  recipient?: string
  userAddress?: string
  from?: string
  tradeType?: number
}

export type QuoteResult = Record<string, unknown>

const DEFAULT_RECIPIENT =
  process.env.POUCHPAY_DEFAULT_RECIPIENT ||
  '0x5227115Ba7c8694218f570c1EC2a680095872820'

function pickSymbol(value: QuoteInput['fromToken']): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  return value.symbol || value.address
}

@Injectable()
export class PouchpayCalldataService {
  private rpc(): string {
    return (process.env.ALLTRA_RPC || DEFAULT_RPC).replace(/\/$/, '')
  }

  private async ethCall(to: string, data: string): Promise<string> {
    const res = await fetch(this.rpc(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to, data }, 'latest'],
      }),
    })
    const json = (await res.json()) as { result?: string; error?: { message?: string } }
    if (json.error) {
      throw new HttpException(
        json.error.message || JSON.stringify(json.error),
        HttpStatus.BAD_GATEWAY,
      )
    }
    if (!json.result) {
      throw new HttpException('Empty eth_call result', HttpStatus.BAD_GATEWAY)
    }
    return json.result
  }

  normalizeInput(input: QuoteInput): QuoteInput {
    const body = { ...input }
    const fromNested = pickSymbol(body.fromToken)
    const toNested = pickSymbol(body.toToken)
    if (fromNested && !body.fromSymbol) body.fromSymbol = fromNested
    if (toNested && !body.toSymbol) body.toSymbol = toNested
    if (body.fromTokenAddress && !body.tokenIn) body.tokenIn = body.fromTokenAddress
    if (body.toTokenAddress && !body.tokenOut) body.tokenOut = body.toTokenAddress
    if (body.fromAmount != null && body.amount == null) body.amount = body.fromAmount
    return body
  }

  async buildQuote(raw: QuoteInput): Promise<QuoteResult> {
    const input = this.normalizeInput(raw)
    const fromKey = input.fromSymbol || input.tokenIn || pickSymbol(input.fromToken)
    const toKey = input.toSymbol || input.tokenOut || pickSymbol(input.toToken)
    const amountRaw = input.amount ?? input.amountIn ?? input.fromAmount
    const slippageBps = Number(input.slippageBps ?? 100)
    const recipient =
      input.recipient || input.userAddress || input.from || DEFAULT_RECIPIENT

    const fromToken = resolveToken(fromKey)
    const toToken = resolveToken(toKey)
    if (!fromToken) {
      throw new HttpException(`Unknown from token: ${fromKey}`, HttpStatus.BAD_REQUEST)
    }
    if (!toToken) {
      throw new HttpException(`Unknown to token: ${toKey}`, HttpStatus.BAD_REQUEST)
    }
    if (amountRaw == null || amountRaw === '') {
      throw new HttpException('amount required', HttpStatus.BAD_REQUEST)
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
      throw new HttpException('recipient must be a 0x address', HttpStatus.BAD_REQUEST)
    }

    let path: string[]
    let fromIsNative: boolean
    let toIsNative: boolean
    try {
      ;({ path, fromIsNative, toIsNative } = buildSwapPath(fromToken, toToken))
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : String(err),
        HttpStatus.BAD_REQUEST,
      )
    }

    const amountIn = parseAmountIn(amountRaw, fromToken.decimals)
    const amountsResult = await this.ethCall(ROUTER, encodeGetAmountsOut(amountIn, path))
    const amounts = decodeAmountsOut(amountsResult)
    const amountOut = amounts[amounts.length - 1]
    if (!amountOut || amountOut <= 0n) {
      throw new HttpException('No on-chain liquidity for path', HttpStatus.NOT_FOUND)
    }

    const amountOutMin = (amountOut * BigInt(10_000 - slippageBps)) / 10_000n
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)

    let callData: string
    let value = 0n
    let method: string
    if (fromIsNative) {
      method = 'swapExactETHForTokens'
      callData = encodeSwapExactETHForTokens(amountOutMin, path, recipient, deadline)
      value = amountIn
    } else if (toIsNative) {
      method = 'swapExactTokensForETH'
      callData = encodeSwapExactTokensForETH(
        amountIn,
        amountOutMin,
        path,
        recipient,
        deadline,
      )
    } else {
      method = 'swapExactTokensForTokens'
      callData = encodeSwapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        recipient,
        deadline,
      )
    }

    const transactionRequest = {
      chainId: CHAIN_ID,
      from: recipient,
      to: ROUTER,
      data: callData,
      value: '0x' + value.toString(16),
      gasLimit: '0x493e0',
    }

    const humanIn = formatUnits(amountIn, fromToken.decimals)
    const humanOut = formatUnits(amountOut, toToken.decimals)
    const humanMin = formatUnits(amountOutMin, toToken.decimals)
    const rateOut =
      amountIn > 0n
        ? formatUnits(
            (amountOut * 10n ** BigInt(fromToken.decimals)) / amountIn,
            toToken.decimals,
          )
        : '0'

    return {
      source: 'nova-bank-embedded-calldata',
      status: 'green',
      color: 'green',
      httpStatus: 200,
      ok: true,
      chainId: CHAIN_ID,
      tradeType: Number(input.tradeType ?? 0),
      tokenIn: fromToken.symbol,
      tokenOut: toToken.symbol,
      fromSymbol: fromToken.symbol,
      toSymbol: toToken.symbol,
      inputAmount: humanIn,
      inputCurrency: fromToken.symbol,
      outputCurrency: toToken.symbol,
      amountIn: humanIn,
      amountInWei: amountIn.toString(),
      amountOut: humanOut,
      outputAmount: amountOut.toString(),
      outputAmountMin: amountOutMin.toString(),
      toAmount: humanOut,
      you_receive: humanOut,
      minimum_amount: humanMin,
      minReceived: humanMin,
      minAmountOut: humanMin,
      path,
      router: ROUTER,
      rpc: this.rpc(),
      engine: 'alltra-uniswap-v2-calldata-v1',
      quoteMode: 'on-chain-getAmountsOut',
      onChainLiquidity: true,
      virtualLpOnly: false,
      legacyOnChainSwapRemoved: false,
      swapRouterId: 'alltra-lp-router',
      method,
      callData,
      data: callData,
      transactionRequest,
      approvalAddress: fromIsNative ? NATIVE : path[0],
      needsApproval: !fromIsNative,
      recipient,
      slippageBps,
      deadline: deadline.toString(),
      fee: 'LP fee ~0.3%',
      rate: `1 ${fromToken.symbol} ~= ${rateOut} ${toToken.symbol}`,
      swappable: true,
      tradable: true,
      transferable: true,
      fromToken: tokenMeta(fromToken),
      toToken: tokenMeta(toToken),
      appVersion: '1.9.5',
      versionCode: 31,
      liveBuild: '1.9.5',
    }
  }

  toAdvancedRoute(quote: QuoteResult) {
    const fromSymbol = String(quote.fromSymbol)
    const toSymbol = String(quote.toSymbol)
    const callData = String(quote.callData)
    const transactionRequest = quote.transactionRequest as Record<string, unknown>
    const stepId = `${fromSymbol}_${toSymbol}_alltra_global_swap`
    const step = {
      type: 'swap',
      id: stepId,
      tool: 'ALLTRA Global Swap',
      toolDetails: {
        key: 'alltra_global_swap',
        name: 'ALLTRA Global Swap',
        logoURI: 'https://alltra.global/favicon.ico',
        quoteApi: '/v0/quote',
        routesApi: '/v1/advanced/routes',
      },
      action: {
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.amountInWei,
        toAmount: quote.outputAmount,
        fromChainId: CHAIN_ID,
        toChainId: CHAIN_ID,
        slippage: Number(quote.slippageBps) / 10_000,
        fromAddress: quote.recipient,
        toAddress: quote.recipient,
      },
      estimate: {
        tool: 'ALLTRA Global Swap',
        approvalAddress: quote.approvalAddress,
        toAmountMin: quote.outputAmountMin,
        toAmount: quote.outputAmount,
        fromAmount: quote.amountInWei,
        feeCosts: [],
        gasCosts: [],
        executionDuration: 30,
        fromAmountUSD: '0',
        toAmountUSD: '0',
      },
      transactionRequest,
      callData,
      data: callData,
      to: quote.router,
      value: transactionRequest?.value,
      chainId: CHAIN_ID,
    }

    return {
      id: `${fromSymbol}_${toSymbol}`,
      fromChainId: CHAIN_ID,
      toChainId: CHAIN_ID,
      fromAmount: quote.amountInWei,
      toAmount: quote.outputAmount,
      toAmountMin: quote.outputAmountMin,
      fromAmountUSD: '0',
      toAmountUSD: '0',
      fromToken: quote.fromToken,
      toToken: quote.toToken,
      gasCostUSD: '0.0000',
      containsSwitchChain: false,
      steps: [step],
      tags: ['RECOMMENDED', 'CHEAPEST', 'FASTEST', 'CALLDATA'],
      engine: quote.engine,
      router: quote.router,
      quoteMode: quote.quoteMode,
      path: quote.path,
      callData,
      transactionRequest,
      onChainLiquidity: true,
      status: 'green',
      color: 'green',
      httpStatus: 200,
      appVersion: '1.9.5',
      versionCode: 31,
    }
  }

  /** Prefer bridge when configured; otherwise build locally (no bridge required). */
  async quoteWithOptionalBridge(body: QuoteInput): Promise<QuoteResult> {
    const bridge = (process.env.POUCHPAY_BRIDGE_URL || '').replace(/\/$/, '')
    if (!bridge) {
      return this.buildQuote(body)
    }
    const res = await fetch(`${bridge}/v0/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as QuoteResult
    if (!res.ok) {
      throw new HttpException(
        (data?.message as string) || `pouchpay-bridge HTTP ${res.status}`,
        res.status >= 400 && res.status < 600 ? res.status : HttpStatus.BAD_GATEWAY,
      )
    }
    if (!data?.callData || !Array.isArray(data?.path) || (data.path as unknown[]).length < 2) {
      // Bridge returned incomplete quote — fall back to embedded builder
      return this.buildQuote(body)
    }
    return {
      ...data,
      source: data.source || 'pouchpay-bridge',
      status: 'green',
      color: 'green',
      httpStatus: 200,
      ok: true,
    }
  }
}
