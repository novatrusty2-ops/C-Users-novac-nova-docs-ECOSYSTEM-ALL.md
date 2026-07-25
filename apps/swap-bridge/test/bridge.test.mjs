import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { quoteFromBook, synthesizeBook, parseMarketId } from "../src/books.mjs";

describe("swap-bridge books", () => {
  it("parses market ids", () => {
    assert.deepEqual(parseMarketId("ETH-USDC"), { base: "ETH", quote: "USDC" });
    assert.deepEqual(parseMarketId("VICTORYA-USDC"), {
      base: "VICTORYA",
      quote: "USDC",
    });
  });

  it("synthesizes stable-like books", () => {
    const book = synthesizeBook("VICTORYA-USDC");
    assert.equal(book.marketId, "VICTORYA-USDC");
    assert.equal(book.bids[0].price, "0.99");
    assert.equal(book.asks[0].price, "1.01");
    assert.equal(book.synthetic, true);
  });

  it("quotes sell from book", () => {
    const book = synthesizeBook("AUSDT-USDC");
    const q = quoteFromBook(book, "sell", 10);
    assert.equal(q.side, "sell");
    assert.ok(Number(q.amountOut) > 9 && Number(q.amountOut) < 10);
  });

  it("quotes buy from book", () => {
    const book = synthesizeBook("MATIC-USD");
    const q = quoteFromBook(book, "buy", 10);
    assert.equal(q.side, "buy");
    assert.ok(Number(q.amountOut) > 0);
  });
});
