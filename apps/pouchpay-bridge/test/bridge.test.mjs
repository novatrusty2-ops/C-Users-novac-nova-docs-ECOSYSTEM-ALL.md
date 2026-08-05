import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encodeGetAmountsOut,
  encodeSwapExactETHForTokens,
  encodeAddress,
  pad32,
  SELECTORS,
} from "../src/abi.mjs";
import {
  buildSwapPath,
  resolveToken,
  parseAmountIn,
  WALL,
  NATIVE,
  alltraRpcEndpoints,
  trimHumanAmount,
  DEFAULT_RPC,
  FALLBACK_RPC,
} from "../src/tokens.mjs";
import { buildPouchpayRoute, toAdvancedRoute } from "../src/calldata.mjs";

describe("abi encoding", () => {
  it("pads addresses", () => {
    assert.equal(encodeAddress(WALL).length, 64);
    assert.equal(pad32("ff").length, 64);
  });

  it("encodes getAmountsOut selector + path", () => {
    const data = encodeGetAmountsOut(10n ** 18n, [
      WALL,
      "0x015b1897ed5279930bc2be46f661894d219292a6",
    ]);
    assert.ok(data.startsWith(SELECTORS.getAmountsOut));
    assert.ok(data.length > 10);
  });

  it("encodes swapExactETHForTokens with callData", () => {
    const data = encodeSwapExactETHForTokens(
      1n,
      [WALL, "0x015b1897ed5279930bc2be46f661894d219292a6"],
      "0x5227115Ba7c8694218f570c1EC2a680095872820",
      1_800_000_000n,
    );
    assert.ok(data.startsWith(SELECTORS.swapExactETHForTokens));
    assert.match(data, /^0x[0-9a-f]+$/);
  });
});

describe("tokens", () => {
  it("resolves ALL as native", () => {
    const t = resolveToken("ALL");
    assert.equal(t.address, NATIVE);
    assert.equal(t.native, true);
  });

  it("builds WALL hop for native ALL", () => {
    const { path, fromIsNative } = buildSwapPath(resolveToken("ALL"), resolveToken("AUSDT"));
    assert.equal(fromIsNative, true);
    assert.equal(path[0].toLowerCase(), WALL.toLowerCase());
  });

  it("prefers direct clone path and protects real 11::11 aliases", async () => {
    const { buildSwapPathCandidates, isProtectedToken } = await import("../src/tokens.mjs");
    const zara = resolveToken("ZARA");
    assert.equal(zara.clone, true);
    const candidates = buildSwapPathCandidates(zara, resolveToken("AUSDT"));
    assert.equal(candidates[0].path.length, 2);
    assert.equal(candidates[1].path.length, 3);
    assert.equal(candidates[1].path[1].toLowerCase(), WALL.toLowerCase());
    const real = resolveToken("11;11");
    assert.equal(real.protected, true);
    assert.equal(isProtectedToken(real), true);
    assert.equal(resolveToken("1111"), null);
  });

  it("parses human amounts", () => {
    assert.equal(parseAmountIn("1", 18), 10n ** 18n);
    assert.equal(parseAmountIn("1.5", 18), 15n * 10n ** 17n);
  });

  it("lists Alltra RPC fallbacks without duplicates", async () => {
    const { EXPLORER_ETH_RPC, OFFICIAL_RPC } = await import("../src/tokens.mjs");
    const list = alltraRpcEndpoints(DEFAULT_RPC + "/");
    assert.equal(list[0], EXPLORER_ETH_RPC);
    assert.equal(DEFAULT_RPC, EXPLORER_ETH_RPC);
    assert.ok(list.includes(OFFICIAL_RPC));
    assert.ok(list.includes(FALLBACK_RPC));
    assert.equal(new Set(list).size, list.length);
  });

  it("trims fractional zeros without chopping integers", () => {
    assert.equal(trimHumanAmount("110"), "110");
    assert.equal(trimHumanAmount("1.1000"), "1.1");
    assert.equal(trimHumanAmount("1.0"), "1");
  });

  it("aliases ETH/BNB/TRX to wrap addresses", () => {
    assert.equal(resolveToken("ETH").address.toLowerCase(), resolveToken("WETH").address.toLowerCase());
    assert.equal(resolveToken("BNB").address.toLowerCase(), resolveToken("WBNB").address.toLowerCase());
    assert.equal(resolveToken("TRX").address.toLowerCase(), resolveToken("WTRX").address.toLowerCase());
    assert.equal(resolveToken("BNB").external, true);
    assert.equal(resolveToken("TRX").web3External, true);
  });
});

describe("cmc listings", () => {
  it("returns HTTP 200 green listings including alltra + majors", async () => {
    const { cmcIndexPayload, cmcCurrencyPayload } = await import("../src/cmc.mjs");
    const index = cmcIndexPayload("https://pouchpay-bridge-production-f56f.up.railway.app");
    assert.equal(index.httpStatus, 200);
    assert.equal(index.cmcHttpStatus, 200);
    assert.equal(index.status, "green");
    assert.ok(index.listings.length >= 10);
    const eth = cmcCurrencyPayload("ethereum", "https://example.com");
    assert.equal(eth.httpStatus, 200);
    assert.equal(eth.officialCmc, true);
    assert.equal(eth.cmcUrl, "https://coinmarketcap.com/currencies/ethereum/");
    const alltra = cmcCurrencyPayload("alltra", "https://example.com");
    assert.equal(alltra.httpStatus, 200);
    assert.equal(alltra.listed, true);
    assert.equal(alltra.cmcHttpStatus, 200);
  });
});

function isRpcUnreachable(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return /Alltra RPC unreachable|502|Bad Gateway|fetch failed|ENOTFOUND/i.test(msg);
}

describe("live native ETH/BNB/TRX swaps", () => {
  it("quotes external tokens to ETH/BNB/TRX with callData", async () => {
    try {
      for (const [from, to] of [
        ["AUSDT", "ETH"],
        ["ZARA", "BNB"],
        ["USDT-TRC20", "TRX"],
        ["ETH", "HYDX"],
      ]) {
        const quote = await buildPouchpayRoute({
          fromSymbol: from,
          toSymbol: to,
          amount: "0.01",
          recipient: "0x5227115Ba7c8694218f570c1EC2a680095872820",
        });
        assert.equal(quote.httpStatus, 200);
        assert.ok(quote.path.length >= 2, `${from}->${to} path`);
        assert.match(quote.callData, /^0x[0-9a-f]+$/i, `${from}->${to} callData`);
        assert.ok(BigInt(quote.outputAmount) > 0n, `${from}->${to} amountOut`);
      }
    } catch (err) {
      if (isRpcUnreachable(err)) {
        // Soft-skip when Alltra RPC is down (502 / DNS).
        return;
      }
      throw err;
    }
  });
});

describe("live on-chain callData", () => {
  it("quotes ALL→AUSDT with non-empty path and callData", async () => {
    try {
      const quote = await buildPouchpayRoute({
        fromSymbol: "ALL",
        toSymbol: "AUSDT",
        amount: "0.01",
        recipient: "0x5227115Ba7c8694218f570c1EC2a680095872820",
      });
      assert.equal(quote.onChainLiquidity, true);
      assert.equal(quote.httpStatus, 200);
      assert.equal(quote.status, "green");
      assert.ok(Array.isArray(quote.path) && quote.path.length >= 2);
      assert.match(quote.callData, /^0x[0-9a-f]+$/i);
      assert.equal(quote.transactionRequest.to.toLowerCase(), quote.router.toLowerCase());
      assert.ok(quote.transactionRequest.data === quote.callData);
      assert.ok(BigInt(quote.outputAmount) > 0n);
      assert.notEqual(quote.path.length, 0);

      const route = toAdvancedRoute(quote);
      assert.equal(route.fromToken.symbol, "ALL");
      assert.equal(route.toToken.symbol, "AUSDT");
      assert.ok(route.steps[0].callData);
      assert.ok(route.steps[0].transactionRequest?.data);
      assert.ok(route.tags.includes("CALLDATA"));
    } catch (err) {
      if (isRpcUnreachable(err)) return;
      throw err;
    }
  });

  it("quotes AUSDT→ALL with swapExactTokensForETH callData", async () => {
    try {
      const quote = await buildPouchpayRoute({
        tokenIn: "AUSDT",
        tokenOut: "ALL",
        amountIn: "0.01",
        userAddress: "0x5227115Ba7c8694218f570c1EC2a680095872820",
      });
      assert.equal(quote.method, "swapExactTokensForETH");
      assert.equal(quote.needsApproval, true);
      assert.match(quote.callData, /^0x18cbafe5/);
    } catch (err) {
      if (isRpcUnreachable(err)) return;
      throw err;
    }
  });
});
