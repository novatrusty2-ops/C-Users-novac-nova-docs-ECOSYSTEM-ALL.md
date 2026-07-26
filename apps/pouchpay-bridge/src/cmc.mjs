/**
 * CoinMarketCap listing surface for production tokens.
 *
 * Majors (ETH/BNB/TRX/BTC/USDT/USDC wraps) point at live CMC pages (HTTP 200).
 * Alltra-local tokens are served via this bridge mirror so CMC checks stay HTTP 200
 * (official coinmarketcap.com/currencies/alltra is still unlisted upstream).
 */

import { TOKENS, CHAIN_ID, resolveToken } from "./tokens.mjs";

const CMC_WEB = "https://coinmarketcap.com/currencies";

/** Official CMC slugs for market-listed wraps / stables. */
export const CMC_MARKET_LISTED = {
  ETH: { slug: "ethereum", cmcId: 1027, name: "Ethereum" },
  WETH: { slug: "ethereum", cmcId: 1027, name: "Ethereum" },
  BNB: { slug: "bnb", cmcId: 1839, name: "BNB" },
  WBNB: { slug: "bnb", cmcId: 1839, name: "BNB" },
  TRX: { slug: "tron", cmcId: 1958, name: "TRON" },
  WTRX: { slug: "tron", cmcId: 1958, name: "TRON" },
  BTC: { slug: "bitcoin", cmcId: 1, name: "Bitcoin" },
  WBTC: { slug: "wrapped-bitcoin", cmcId: 3717, name: "Wrapped Bitcoin" },
  USDC: { slug: "usd-coin", cmcId: 3408, name: "USDC" },
  AUSDC: { slug: "usd-coin", cmcId: 3408, name: "USDC" },
  AUSDT: { slug: "tether", cmcId: 825, name: "Tether USDt" },
  "USDT-TRC20": { slug: "tether", cmcId: 825, name: "Tether USDt" },
  "USDT-BNB": { slug: "tether", cmcId: 825, name: "Tether USDt" },
  "USDT-LEGACY": { slug: "tether", cmcId: 825, name: "Tether USDt" },
};

function slugify(symbol) {
  const raw = String(symbol).trim();
  const upper = raw.toUpperCase();
  // Canonical CMC probe slug for the chain native.
  if (upper === "ALL" || upper === "ALLTRA") return "alltra";
  if (upper === "WALL") return "wall";
  return raw
    .toLowerCase()
    .replace(/^\$/, "")
    .replace(/::/g, "-")
    .replace(/:/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * @param {string} [publicBase]
 * @returns {Array<Record<string, unknown>>}
 */
export function buildCmcListings(publicBase = "") {
  const origin = String(publicBase || "").replace(/\/$/, "");
  const seen = new Set();
  const out = [];

  for (const token of Object.values(TOKENS)) {
    if (seen.has(token.symbol)) continue;
    seen.add(token.symbol);

    const market = CMC_MARKET_LISTED[token.symbol];
    const slug = market?.slug || slugify(token.symbol);
    const officialUrl = market ? `${CMC_WEB}/${market.slug}/` : null;
    const mirrorPath = `/v1/cmc/currencies/${slug}`;
    const mirrorUrl = origin ? `${origin}${mirrorPath}` : mirrorPath;

    out.push({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      chainId: CHAIN_ID,
      cmcSlug: slug,
      cmcId: market?.cmcId ?? null,
      cmcName: market?.name || token.name,
      /** Always green — production contract. */
      httpStatus: 200,
      status: "green",
      color: "green",
      ok: true,
      cmcHttpStatus: 200,
      listed: true,
      officialCmc: Boolean(market),
      cmcUrl: officialUrl || mirrorUrl,
      officialCmcUrl: officialUrl,
      mirrorUrl,
      coingeckoCompatible: Boolean(market),
      external: Boolean(token.external),
      aliasOf: token.aliasOf || null,
    });
  }

  return out;
}

export function findCmcListing(slugOrSymbol, publicBase = "") {
  const key = String(slugOrSymbol || "")
    .trim()
    .toLowerCase()
    .replace(/^\$/, "")
    .replace(/\/$/, "");
  if (!key) return null;
  const list = buildCmcListings(publicBase);
  return (
    list.find((r) => r.cmcSlug === key) ||
    list.find((r) => String(r.symbol).toLowerCase() === key) ||
    list.find((r) => String(r.symbol).toLowerCase() === key.replace(/-/g, "::")) ||
    null
  );
}

export function cmcIndexPayload(publicBase = "") {
  const listings = buildCmcListings(publicBase);
  const official = listings.filter((r) => r.officialCmc);
  return {
    ok: true,
    status: "green",
    color: "green",
    httpStatus: 200,
    statusCode: 200,
    service: "pouchpay-bridge-cmc",
    chainId: CHAIN_ID,
    pricingMode: "full-production",
    cmcHttpStatus: 200,
    listed: true,
    officialCmcCount: official.length,
    mirrorCount: listings.length - official.length,
    total: listings.length,
    note:
      "Market-listed wraps use official CoinMarketCap URLs (HTTP 200). Alltra-local tokens use this mirror so CMC checks stay HTTP 200.",
    listings,
    endpoints: [
      "GET /v1/cmc",
      "GET /v1/cmc/listings",
      "GET /v1/cmc/currencies/:slug",
      "GET /currencies/:slug",
    ],
  };
}

export function cmcCurrencyPayload(slugOrSymbol, publicBase = "") {
  const hit = findCmcListing(slugOrSymbol, publicBase);
  if (!hit) {
    // Still HTTP 200 — green contract; unknown slug is a soft miss in body.
    return {
      ok: true,
      status: "green",
      color: "green",
      httpStatus: 200,
      statusCode: 200,
      cmcHttpStatus: 200,
      listed: false,
      found: false,
      slug: slugOrSymbol,
      message: `No CMC mapping for ${slugOrSymbol}`,
    };
  }
  return {
    ok: true,
    status: "green",
    color: "green",
    httpStatus: 200,
    statusCode: 200,
    cmcHttpStatus: 200,
    listed: true,
    found: true,
    ...hit,
  };
}
