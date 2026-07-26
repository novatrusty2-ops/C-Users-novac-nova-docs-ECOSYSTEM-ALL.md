/** Canonical Alltra / PouchPay token registry (chain 651940). */

export const CHAIN_ID = 651940;
export const NATIVE = "0x0000000000000000000000000000000000000000";
export const ROUTER = "0xEd04ee8307C0656207af5afe3926Ae2380052940";
export const WALL = "0x2da2b8f961f161ab6320acb3377e2e844a3c3ce4";
export const DEFAULT_RPC = "https://mainnet-rpc.alltra.global";

/** @type {Record<string, { symbol: string, address: string, decimals: number, name: string, native?: boolean }>} */
export const TOKENS = {
  ALL: {
    symbol: "ALL",
    address: NATIVE,
    decimals: 18,
    name: "ALLTRA Native",
    native: true,
  },
  WALL: {
    symbol: "WALL",
    address: WALL,
    decimals: 18,
    name: "Wrapped Alltra",
  },
  AUSDT: {
    symbol: "AUSDT",
    address: "0x015b1897ed5279930bc2be46f661894d219292a6",
    decimals: 18,
    name: "Alltra USD Token (USDT)",
  },
  AUSDC: {
    symbol: "AUSDC",
    address: "0xcf5423f2e06878bb23fe914519339be739e6c6b1",
    decimals: 18,
    name: "Alltra USD Coin (USDC)",
  },
  USDC: {
    symbol: "USDC",
    address: "0xa95eed79f84e6a0151eaeb9d441f9ffd50e8e881",
    decimals: 18,
    name: "AUSDC (alternate)",
  },
  WETH: {
    symbol: "WETH",
    address: "0x798f6762bb40d6801a593459d08f890603d3979c",
    decimals: 18,
    name: "Wrapped Ether",
  },
  HYDX: {
    symbol: "HYDX",
    address: "0x0d9793861aeb9244ad1b34375a83a6730f6add38",
    decimals: 18,
    name: "Hyper-Dex Exchange",
  },
  /** Alltra wrap clones — burnable inventory (NOT real 11::11). */
  WBNB: {
    symbol: "WBNB",
    address: "0xfE6E0aEd4Ca571BFbF3C3ae7Bf01fcA40B4716d3",
    decimals: 18,
    name: "Wrapped BNB (ALLTRA)",
    clone: true,
  },
  WTRX: {
    symbol: "WTRX",
    address: "0xaA7d8C0B6119148DE1456EC0025f9A7b2Dd41A4F",
    decimals: 18,
    name: "Wrapped TRX (ALLTRA)",
    clone: true,
  },
  ZARA: {
    symbol: "ZARA",
    address: "0xb91b4F8D9913cf90b55E34e192a89bad346E3Eb3",
    decimals: 18,
    name: "Zaragoza USD Peg",
    clone: true,
  },
  ZRG: {
    symbol: "ZRG",
    address: "0x04382FAbed4e66Cb66711357E32e1E03078D9a70",
    decimals: 18,
    name: "Zaragoza",
    clone: true,
  },
  /** Real 11:11 — protected; never include in clone-burn allowlists. */
  "11::11": {
    symbol: "11::11",
    address: "0x535cA3048871dc5A6466A6b07559c0D08f773D95",
    decimals: 18,
    name: "11:11",
    protected: true,
  },
};

/** Clone symbols safe to burn/swap into pools. Real 11::11 is excluded. */
export const CLONE_BURN_ALLOWLIST = ["E1111", "ZARA", "ZRG", "WBNB", "WTRX"];

/** Never burn / never sell these (real rails + real 11:11). */
export const PROTECTED_SYMBOLS = [
  "11::11",
  "11:11",
  "GLD1111",
  "ALL",
  "WALL",
  "AUSDT",
  "AUSDC",
  "WETH",
  "BTC",
  "ETH",
  "USDC",
  "USDT",
  "NOVA",
  "NRW",
];

export function resolveToken(symbolOrAddress) {
  if (!symbolOrAddress) return null;
  const raw = String(symbolOrAddress).trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(raw)) {
    const lower = raw.toLowerCase();
    if (lower === NATIVE) return TOKENS.ALL;
    const hit = Object.values(TOKENS).find((t) => t.address.toLowerCase() === lower);
    return hit || { symbol: raw.slice(0, 8), address: raw, decimals: 18, name: raw };
  }
  const sym = raw.toUpperCase();
  if (TOKENS[sym]) return TOKENS[sym];
  // Normalize explicit 11:11 spellings → real protected token.
  // Do NOT map bare "1111" (too easy to confuse with ledger clone E1111).
  if (sym === "11:11" || sym === "11;11") return TOKENS["11::11"];
  return null;
}

/** True only for tokens marked protected (real 11::11). Pool assets stay quotable. */
export function isProtectedToken(token) {
  return Boolean(token?.protected);
}

/**
 * On-chain hop path (native ALL uses WALL as WETH).
 * Prefers a direct pair; callers should fall back to via-WALL when direct has no liquidity.
 */
export function buildSwapPath(fromToken, toToken, { viaWall = false } = {}) {
  const fromIsNative = Boolean(fromToken.native) || fromToken.address.toLowerCase() === NATIVE;
  const toIsNative = Boolean(toToken.native) || toToken.address.toLowerCase() === NATIVE;
  const fromAddr = fromIsNative ? WALL : fromToken.address;
  const toAddr = toIsNative ? WALL : toToken.address;
  if (fromAddr.toLowerCase() === toAddr.toLowerCase()) {
    throw new Error("Same token path");
  }
  const wall = WALL.toLowerCase();
  const touchesWall =
    fromAddr.toLowerCase() === wall || toAddr.toLowerCase() === wall;
  const path =
    touchesWall || !viaWall ? [fromAddr, toAddr] : [fromAddr, WALL, toAddr];
  return {
    path,
    fromIsNative,
    toIsNative,
  };
}

/** Candidate paths: direct first, then WALL hop when neither side is WALL. */
export function buildSwapPathCandidates(fromToken, toToken) {
  const direct = buildSwapPath(fromToken, toToken, { viaWall: false });
  const wall = WALL.toLowerCase();
  const needsHop =
    direct.path[0].toLowerCase() !== wall &&
    direct.path[direct.path.length - 1].toLowerCase() !== wall;
  if (!needsHop) return [direct];
  return [direct, buildSwapPath(fromToken, toToken, { viaWall: true })];
}

export function parseAmountIn(amount, decimals) {
  const s = String(amount).trim();
  if (!s || Number(s) <= 0) throw new Error("Invalid amount");
  // Accept already-wei integers (no decimal point, large)
  if (/^\d+$/.test(s) && BigInt(s) >= 10n ** BigInt(Math.max(decimals - 2, 0))) {
    // Heuristic: treat bare integers with many digits as wei when >= 10^(decimals-2)
    // But "1" should be human units. Prefer human unless clearly wei (>= 1e15 for 18d).
    if (BigInt(s) >= 10n ** 15n) return BigInt(s);
  }
  const [whole, frac = ""] = s.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(fracPadded || "0");
}

export function formatUnits(value, decimals) {
  const n = BigInt(value);
  const base = 10n ** BigInt(decimals);
  const whole = n / base;
  const frac = (n % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

export function tokenMeta(token) {
  return {
    address: token.address,
    chainId: CHAIN_ID,
    symbol: token.symbol,
    decimals: token.decimals,
    name: token.name,
    coinKey: token.symbol,
    logoURI: "https://alltra.global/favicon.ico",
    priceUSD: "0",
  };
}
