/**
 * Seed Marionette mock_fallback order books for markets missing on production.
 * Call from SwapService.onModuleInit() with your in-memory books Map.
 */

export type BookLevel = { price: string; amount: string };
export type MockBook = {
  marketId: string;
  bids: BookLevel[];
  asks: BookLevel[];
  updatedAt: string;
};

/** Markets that 404 on production orderbook/quote today */
export const MISSING_PROD_BOOK_MARKETS = [
  'MATIC-USD',
  'NOVA-USDC',
  'NRW-USDC',
  'VICTORYA-USDC',
  'ANKA-USDC',
  'TRX-USDC',
  'ALL-USDC',
] as const;

const MID: Record<string, number> = {
  MATIC: 0.22,
  TRX: 0.12,
  NOVA: 1,
  NRW: 1,
  VICTORYA: 1,
  ANKA: 1,
  ALL: 1,
};

function stableBook(marketId: string): MockBook {
  const now = new Date().toISOString();
  return {
    marketId,
    bids: [
      { price: '0.99', amount: '100000000' },
      { price: '0.99', amount: '100000' },
    ],
    asks: [
      { price: '1.01', amount: '100000000' },
      { price: '1.01', amount: '100000' },
    ],
    updatedAt: now,
  };
}

function midBook(marketId: string, mid: number): MockBook {
  const now = new Date().toISOString();
  const bid = (mid * 0.997).toPrecision(6);
  const ask = (mid * 1.003).toPrecision(6);
  return {
    marketId,
    bids: [
      { price: bid, amount: '10000' },
      { price: bid, amount: '20' },
    ],
    asks: [
      { price: ask, amount: '10000' },
      { price: ask, amount: '15' },
    ],
    updatedAt: now,
  };
}

export function buildMockBook(marketId: string): MockBook {
  const base = marketId.split('-')[0] || marketId;
  if (base === 'MATIC' || base === 'TRX') {
    return midBook(marketId, MID[base] ?? 1);
  }
  return stableBook(marketId);
}

/** Ensure every missing production market has a mock book. */
export function seedMissingMockBooks(
  books: Map<string, MockBook>,
  marketIds: readonly string[] = MISSING_PROD_BOOK_MARKETS,
): string[] {
  const seeded: string[] = [];
  for (const id of marketIds) {
    if (!books.has(id)) {
      books.set(id, buildMockBook(id));
      seeded.push(id);
    }
  }
  return seeded;
}
