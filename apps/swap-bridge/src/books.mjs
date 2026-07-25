/**
 * Synthetic Marionette mock books for markets missing on Nova Bank production.
 * Shape matches live AUSDT-USDC / ETH-USDC order books.
 */

/** @typedef {{ price: string, amount: string }} Level */
/** @typedef {{ marketId: string, bids: Level[], asks: Level[], updatedAt: string, synthetic?: boolean }} Book */

const STABLE_LIKE = new Set([
  "USDC",
  "USDT",
  "DAI",
  "AUSDT",
  "CUSDT",
  "CUSDC",
  "KUSD",
  "VICTORYA",
  "NOVA",
  "NRW",
  "ANKA",
  "ALL",
  "SHIVA",
  "ACX",
  "ICX",
  "XRP",
  "E1111",
  "ANAKA",
]);

/** Fallback mid prices (USD) when upstream book is missing */
const MID_USD = {
  MATIC: 0.22,
  TRX: 0.12,
  NOVA: 1,
  NRW: 1,
  VICTORYA: 1,
  ANKA: 1,
  ALL: 1,
  BTC: 65000,
  ETH: 3200,
  SOL: 150,
};

export function parseMarketId(marketId) {
  const i = marketId.lastIndexOf("-");
  if (i <= 0) return { base: marketId, quote: "USD" };
  return { base: marketId.slice(0, i), quote: marketId.slice(i + 1) };
}

function level(price, amount) {
  return { price: String(price), amount: String(amount) };
}

/**
 * @param {string} marketId
 * @returns {Book}
 */
export function synthesizeBook(marketId) {
  const { base, quote } = parseMarketId(marketId);
  const now = new Date().toISOString();

  if (STABLE_LIKE.has(base) && (quote === "USDC" || quote === "USD" || STABLE_LIKE.has(quote))) {
    return {
      marketId,
      bids: [level("0.99", "100000000"), level("0.99", "100000")],
      asks: [level("1.01", "100000000"), level("1.01", "100000")],
      updatedAt: now,
      synthetic: true,
    };
  }

  const mid = MID_USD[base] ?? 1;
  const bid = (mid * 0.997).toPrecision(6);
  const ask = (mid * 1.003).toPrecision(6);
  return {
    marketId,
    bids: [level(bid, "10000"), level(bid, "20"), level(String(Number(bid) * 0.995), "40")],
    asks: [level(ask, "10000"), level(ask, "15"), level(String(Number(ask) * 1.005), "30")],
    updatedAt: now,
    synthetic: true,
  };
}

/**
 * @param {Book} book
 * @param {'buy'|'sell'} side
 * @param {number} amount
 * @param {number} [feeBps]
 */
export function quoteFromBook(book, side, amount, feeBps = 30) {
  if (!(amount > 0)) throw new Error("Invalid amount");
  const bid = Number(book.bids?.[0]?.price);
  const ask = Number(book.asks?.[0]?.price);
  if (!(bid > 0) || !(ask > 0)) throw new Error("Empty book");

  const feeMult = 1 - feeBps / 10_000;
  let amountIn = amount;
  let amountOut;
  let avgPrice;

  if (side === "sell") {
    // Sell base → receive quote
    avgPrice = bid;
    amountOut = amount * bid * feeMult;
  } else {
    // Buy base spending `amount` quote
    avgPrice = ask;
    amountOut = (amount / ask) * feeMult;
  }

  const fee = side === "sell" ? amount - amount * feeMult : amountOut / feeMult - amountOut;

  return {
    marketId: book.marketId,
    side,
    amountIn: trimNum(amountIn),
    amountOut: trimNum(amountOut),
    avgPrice: trimNum(avgPrice),
    priceImpactBps: 0,
    minAmountOut: trimNum(amountOut * 0.995),
    fee: trimNum(Math.max(fee, 0)),
    feeCurrency: side === "sell" ? parseMarketId(book.marketId).base : parseMarketId(book.marketId).base,
    synthetic: Boolean(book.synthetic),
  };
}

function trimNum(n) {
  if (!Number.isFinite(n)) return "0";
  const s = n.toFixed(8).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
}
