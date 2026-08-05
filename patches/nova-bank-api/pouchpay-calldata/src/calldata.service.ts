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
  alltraRpcEndpoints,
  trimHumanAmount,
  resolveToken,
  buildSwapPathCandidates,
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
  private rpcList(): string[] {
    return alltraRpcEndpoints()
  }

  private async ethCall(to: string, data: string): Promise<{ result: string; rpc: string }> {
    const rpcs = this.rpcList()
    let lastErr: unknown
    for (const rpc of rpcs) {
      try {
        const res = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_call',
            params: [{ to, data }, 'latest'],
          }),
        })
        if (!res.ok) {
          lastErr = new Error(`Alltra RPC HTTP ${res.status} at ${rpc}`)
          continue
        }
        const text = await res.text()
        let json: { result?: string; error?: { message?: string } }
        try {
          json = text ? (JSON.parse(text) as typeof json) : {}
        } catch {
          lastErr = new Error(`Alltra RPC non-JSON at ${rpc}`)
          continue
        }
        if (json.error) {
          throw new HttpException(
            json.error.message || JSON.stringify(json.error),
            HttpStatus.BAD_GATEWAY,
          )
        }
        if (!json.result) {
          lastErr = new Error(`Empty eth_call result at ${rpc}`)
          continue
        }
        return { result: json.result, rpc }
      } catch (err) {
        if (err instanceof HttpException) throw err
        lastErr = err
        const msg = err instanceof Error ? err.message : String(err)
        if (/502|503|504|Bad Gateway|ECONNREFUSED|ENOTFOUND|fetch failed|network|non-JSON|HTTP /i.test(msg)) {
          continue
        }
        throw err
      }
    }
    throw new HttpException(
      `Alltra RPC unreachable (tried ${rpcs.length} endpoints)${
        lastErr instanceof Error ? `: ${lastErr.message}` : ''
      }`,
      HttpStatus.BAD_GATEWAY,
    )
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

    let amountIn: bigint
    try {
      amountIn = parseAmountIn(amountRaw, fromToken.decimals)
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : String(err),
        HttpStatus.BAD_REQUEST,
      )
    }

    let path: string[] | undefined
    let fromIsNative = false
    let toIsNative = false
    let amountOut: bigint | undefined
    let usedRpc = this.rpcList()[0]
    let lastErr: unknown
    let candidates
    try {
      candidates = buildSwapPathCandidates(fromToken, toToken)
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : String(err),
        HttpStatus.BAD_REQUEST,
      )
    }
    for (const candidate of candidates) {
      try {
        const { result: amountsResult, rpc } = await this.ethCall(
          ROUTER,
          encodeGetAmountsOut(amountIn, candidate.path),
        )
        const amounts = decodeAmountsOut(amountsResult)
        const out = amounts[amounts.length - 1]
        if (out && out > 0n) {
          path = candidate.path
          fromIsNative = candidate.fromIsNative
          toIsNative = candidate.toIsNative
          amountOut = out
          usedRpc = rpc
          break
        }
      } catch (err) {
        lastErr = err
      }
    }
    if (!path || amountOut == null) {
      const msg =
        lastErr instanceof Error
          ? lastErr.message
          : lastErr
            ? String(lastErr)
            : 'No on-chain liquidity for path'
      throw new HttpException(
        msg,
        /Alltra RPC unreachable/i.test(msg) ? HttpStatus.BAD_GATEWAY : HttpStatus.NOT_FOUND,
      )
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
    const humanOut = trimHumanAmount(formatUnits(amountOut, toToken.decimals))
    const humanMin = trimHumanAmount(formatUnits(amountOutMin, toToken.decimals))
    const rateOut =
      amountIn > 0n
        ? trimHumanAmount(
            formatUnits(
              (amountOut * 10n ** BigInt(fromToken.decimals)) / amountIn,
              toToken.decimals,
            ),
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
      rpc: usedRpc,
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
      appVersion: '31.195',
      versionCode: 31195,
      liveBuild: '31.195',
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
      appVersion: '31.195',
      versionCode: 31195,
    }
  }

  /** Prefer bridge when configured; otherwise build locally (no bridge required). */
  async quoteWithOptionalBridge(body: QuoteInput): Promise<QuoteResult> {
    const bridge = (process.env.POUCHPAY_BRIDGE_URL || '').replace(/\/$/, '')
    const normalized = this.normalizeInput(body)
    if (!bridge) {
      return this.buildQuote(normalized)
    }

    try {
      const res = await fetch(`${bridge}/v0/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(normalized),
      })
      const data = (await res.json().catch(() => ({}))) as QuoteResult
      if (
        res.ok &&
        data?.callData &&
        Array.isArray(data?.path) &&
        (data.path as unknown[]).length >= 2
      ) {
        return {
          ...data,
          source: data.source || 'pouchpay-bridge',
          status: 'green',
          color: 'green',
          httpStatus: 200,
          ok: true,
        }
      }
    } catch {
      // Bridge unreachable / invalid response — fall through to embedded builder
    }

    return this.buildQuote(normalized)
  }
}
