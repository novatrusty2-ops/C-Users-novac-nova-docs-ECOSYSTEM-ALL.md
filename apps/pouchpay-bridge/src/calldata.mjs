/**
 * Build PouchPay / ALLTRA swap quotes + UniswapV2 callData against the live router.
 */

import {
  encodeGetAmountsOut,
  encodeSwapExactETHForTokens,
  encodeSwapExactTokensForETH,
  encodeSwapExactTokensForTokens,
  decodeAmountsOut,
} from "./abi.mjs";
import {
  CHAIN_ID,
  ROUTER,
  alltraRpcEndpoints,
  trimHumanAmount,
  resolveToken,
  buildSwapPathCandidates,
  isProtectedToken,
  parseAmountIn,
  formatUnits,
  tokenMeta,
} from "./tokens.mjs";

const RPC_LIST = alltraRpcEndpoints();
const DEFAULT_RECIPIENT =
  process.env.POUCHPAY_DEFAULT_RECIPIENT ||
  "0x5227115Ba7c8694218f570c1EC2a680095872820";

/**
 * eth_call with multi-RPC failover. Returns `{ result, rpc }`.
 * @param {string} to
 * @param {string} data
 */
async function ethCall(to, data) {
  let lastErr;
  for (const rpc of RPC_LIST) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to, data }, "latest"],
        }),
      });
      if (!res.ok) {
        lastErr = new Error(`Alltra RPC HTTP ${res.status} at ${rpc}`);
        continue;
      }
      const text = await res.text();
      let json;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        lastErr = new Error(`Alltra RPC non-JSON at ${rpc}`);
        continue;
      }
      if (!json || typeof json !== "object") {
        lastErr = new Error(`Alltra RPC empty body at ${rpc}`);
        continue;
      }
      if (json.error) {
        // Contract/revert errors are not transport failures — surface immediately.
        throw new Error(json.error.message || JSON.stringify(json.error));
      }
      if (!json.result) {
        lastErr = new Error(`Empty eth_call result at ${rpc}`);
        continue;
      }
      return { result: json.result, rpc };
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (/502|503|504|Bad Gateway|ECONNREFUSED|ENOTFOUND|fetch failed|network|non-JSON|HTTP /i.test(msg)) {
        continue;
      }
      throw err;
    }
  }
  throw new Error(
    `Alltra RPC unreachable (tried ${RPC_LIST.length} endpoints)${
      lastErr?.message ? `: ${lastErr.message}` : ""
    }`,
  );
}

function applySlippage(amountOut, slippageBps) {
  const bps = BigInt(slippageBps);
  return (amountOut * (10_000n - bps)) / 10_000n;
}

/**
 * @param {{
 *   fromSymbol?: string,
 *   toSymbol?: string,
 *   tokenIn?: string,
 *   tokenOut?: string,
 *   amount?: string,
 *   amountIn?: string,
 *   slippageBps?: number,
 *   recipient?: string,
 *   userAddress?: string,
 *   tradeType?: number,
 * }} input
 */
export async function buildPouchpayRoute(input) {
  const fromKey = input.fromSymbol || input.tokenIn || input.fromToken;
  const toKey = input.toSymbol || input.tokenOut || input.toToken;
  const amountRaw = input.amount ?? input.amountIn ?? input.fromAmount;
  const slippageBps = Number(input.slippageBps ?? 100);
  const recipient = input.recipient || input.userAddress || input.from || DEFAULT_RECIPIENT;

  const fromToken = resolveToken(fromKey);
  const toToken = resolveToken(toKey);
  if (!fromToken) throw Object.assign(new Error(`Unknown from token: ${fromKey}`), { status: 400 });
  if (!toToken) throw Object.assign(new Error(`Unknown to token: ${toKey}`), { status: 400 });
  if (!amountRaw) throw Object.assign(new Error("amount required"), { status: 400 });
  if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
    throw Object.assign(new Error("recipient must be a 0x address"), { status: 400 });
  }

  // Refuse selling protected rails (real 11::11, WETH, natives…) unless explicitly overridden.
  const allowProtected = process.env.ALLOW_PROTECTED_QUOTES === "1";
  if (isProtectedToken(fromToken) && !allowProtected) {
    throw Object.assign(
      new Error(
        `REFUSED: ${fromToken.symbol} is protected — will not build sell callData (set ALLOW_PROTECTED_QUOTES=1 to override)`,
      ),
      { status: 403 },
    );
  }

  const amountIn = parseAmountIn(amountRaw, fromToken.decimals);
  const candidates = buildSwapPathCandidates(fromToken, toToken);
  let path;
  let fromIsNative;
  let toIsNative;
  let amountOut;
  let usedRpc = RPC_LIST[0];
  let lastErr;
  for (const candidate of candidates) {
    try {
      const amountsData = encodeGetAmountsOut(amountIn, candidate.path);
      const { result: amountsResult, rpc } = await ethCall(ROUTER, amountsData);
      const amounts = decodeAmountsOut(amountsResult);
      const out = amounts[amounts.length - 1];
      if (out && out > 0n) {
        path = candidate.path;
        fromIsNative = candidate.fromIsNative;
        toIsNative = candidate.toIsNative;
        amountOut = out;
        usedRpc = rpc;
        break;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  if (!path || !amountOut) {
    const msg = lastErr?.message || "No on-chain liquidity for path";
    const status = /Alltra RPC unreachable/i.test(msg) ? 502 : 404;
    throw Object.assign(new Error(msg), { status });
  }
  const amountOutMin = applySlippage(amountOut, slippageBps);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);

  let callData;
  let value = 0n;
  let method;
  if (fromIsNative) {
    method = "swapExactETHForTokens";
    callData = encodeSwapExactETHForTokens(amountOutMin, path, recipient, deadline);
    value = amountIn;
  } else if (toIsNative) {
    method = "swapExactTokensForETH";
    callData = encodeSwapExactTokensForETH(amountIn, amountOutMin, path, recipient, deadline);
  } else {
    method = "swapExactTokensForTokens";
    callData = encodeSwapExactTokensForTokens(amountIn, amountOutMin, path, recipient, deadline);
  }

  const transactionRequest = {
    chainId: CHAIN_ID,
    from: recipient,
    to: ROUTER,
    data: callData,
    value: "0x" + value.toString(16),
    gasLimit: "0x493e0", // 300000
  };

  const humanIn = formatUnits(amountIn, fromToken.decimals);
  const humanOut = trimHumanAmount(formatUnits(amountOut, toToken.decimals));
  const humanMin = trimHumanAmount(formatUnits(amountOutMin, toToken.decimals));

  return {
    source: "pouchpay-bridge",
    status: "green",
    color: "green",
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
    engine: "alltra-uniswap-v2-calldata-v1",
    quoteMode: "on-chain-getAmountsOut",
    onChainLiquidity: true,
    virtualLpOnly: false,
    legacyOnChainSwapRemoved: false,
    swapRouterId: "alltra-lp-router",
    method,
    callData,
    data: callData,
    transactionRequest,
    approvalAddress: fromIsNative ? NATIVE_ZERO_FOR_APPROVAL : path[0],
    needsApproval: !fromIsNative,
    recipient,
    slippageBps,
    deadline: deadline.toString(),
    fee: "LP fee ~0.3%",
    rate: `1 ${fromToken.symbol} ~= ${formatUnits(
      (amountOut * 10n ** BigInt(fromToken.decimals)) / amountIn,
      toToken.decimals,
    )} ${toToken.symbol}`,
    swappable: true,
    tradable: true,
    transferable: true,
    fromToken: tokenMeta(fromToken),
    toToken: tokenMeta(toToken),
    appVersion: "31.195",
    versionCode: 31195,
    liveBuild: "31.195",
  };
}

const NATIVE_ZERO_FOR_APPROVAL = "0x0000000000000000000000000000000000000000";

/** LiFi / PouchPay advanced.routes shape with callData on the step. */
export function toAdvancedRoute(quote) {
  const stepId = `${quote.fromSymbol}_${quote.toSymbol}_alltra_global_swap`;
  const step = {
    type: "swap",
    id: stepId,
    tool: "ALLTRA Global Swap",
    toolDetails: {
      key: "alltra_global_swap",
      name: "ALLTRA Global Swap",
      logoURI: "https://alltra.global/favicon.ico",
      quoteApi: "/v0/quote",
      routesApi: "/v1/advanced/routes",
    },
    action: {
      fromToken: quote.fromToken,
      toToken: quote.toToken,
      fromAmount: quote.amountInWei,
      toAmount: quote.outputAmount,
      fromChainId: CHAIN_ID,
      toChainId: CHAIN_ID,
      slippage: quote.slippageBps / 10_000,
      fromAddress: quote.recipient,
      toAddress: quote.recipient,
    },
    estimate: {
      tool: "ALLTRA Global Swap",
      approvalAddress: quote.approvalAddress,
      toAmountMin: quote.outputAmountMin,
      toAmount: quote.outputAmount,
      fromAmount: quote.amountInWei,
      feeCosts: [],
      gasCosts: [],
      executionDuration: 30,
      fromAmountUSD: "0",
      toAmountUSD: "0",
    },
    transactionRequest: quote.transactionRequest,
    callData: quote.callData,
    data: quote.callData,
    to: quote.router,
    value: quote.transactionRequest.value,
    chainId: CHAIN_ID,
  };

  return {
    id: `${quote.fromSymbol}_${quote.toSymbol}`,
    fromChainId: CHAIN_ID,
    toChainId: CHAIN_ID,
    fromAmount: quote.amountInWei,
    toAmount: quote.outputAmount,
    toAmountMin: quote.outputAmountMin,
    fromAmountUSD: "0",
    toAmountUSD: "0",
    fromToken: quote.fromToken,
    toToken: quote.toToken,
    gasCostUSD: "0.0000",
    containsSwitchChain: false,
    steps: [step],
    tags: ["RECOMMENDED", "CHEAPEST", "FASTEST", "CALLDATA"],
    engine: quote.engine,
    router: quote.router,
    quoteMode: quote.quoteMode,
    path: quote.path,
    callData: quote.callData,
    transactionRequest: quote.transactionRequest,
    onChainLiquidity: true,
  };
}
