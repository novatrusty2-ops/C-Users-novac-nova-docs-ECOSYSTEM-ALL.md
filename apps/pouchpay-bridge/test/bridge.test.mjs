import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encodeGetAmountsOut,
  encodeSwapExactETHForTokens,
  encodeAddress,
  pad32,
  SELECTORS,
} from "../src/abi.mjs";
import { buildSwapPath, resolveToken, parseAmountIn, WALL, NATIVE } from "../src/tokens.mjs";
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
});

describe("live on-chain callData", () => {
  it("quotes ALL→AUSDT with non-empty path and callData", async () => {
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
  });

  it("quotes AUSDT→ALL with swapExactTokensForETH callData", async () => {
    const quote = await buildPouchpayRoute({
      tokenIn: "AUSDT",
      tokenOut: "ALL",
      amountIn: "0.01",
      userAddress: "0x5227115Ba7c8694218f570c1EC2a680095872820",
    });
    assert.equal(quote.method, "swapExactTokensForETH");
    assert.equal(quote.needsApproval, true);
    assert.match(quote.callData, /^0x18cbafe5/);
  });
});
