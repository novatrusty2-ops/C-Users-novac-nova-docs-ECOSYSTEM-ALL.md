/**
 * Minimal ABI encoding for Uniswap V2 Router02 swap helpers (no ethers dep).
 */

export function pad32(hex) {
  const h = String(hex).replace(/^0x/i, "").toLowerCase();
  if (h.length > 64) throw new Error("hex too long for uint256/address slot");
  return h.padStart(64, "0");
}

export function encodeAddress(addr) {
  if (typeof addr !== "string" || !/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new Error(`invalid address: ${addr}`);
  }
  return pad32(addr.slice(2));
}

export function encodeUint256(value) {
  const n = typeof value === "bigint" ? value : BigInt(value);
  if (n < 0n) throw new Error("uint256 cannot be negative");
  return pad32(n.toString(16));
}

/** Dynamic address[] starting at offset 0x20 relative to the array argument head. */
export function encodeAddressArray(addrs) {
  let out = encodeUint256(addrs.length);
  for (const a of addrs) out += encodeAddress(a);
  return out;
}

export const SELECTORS = {
  factory: "0xc45a0155",
  WETH: "0xad5c4648",
  getAmountsOut: "0xd06ca61f",
  swapExactETHForTokens: "0x7ff36ab5",
  swapExactTokensForTokens: "0x38ed1739",
  swapExactTokensForETH: "0x18cbafe5",
};

/** getAmountsOut(uint256 amountIn, address[] path) */
export function encodeGetAmountsOut(amountIn, path) {
  // head: amountIn, offset to path (=0x40)
  const head = encodeUint256(amountIn) + encodeUint256(0x40);
  return SELECTORS.getAmountsOut + head + encodeAddressArray(path);
}

/**
 * swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)
 * payable — msg.value = amountIn
 */
export function encodeSwapExactETHForTokens(amountOutMin, path, to, deadline) {
  // args: amountOutMin, offset(path)=0x80, to, deadline, then path
  const head =
    encodeUint256(amountOutMin) +
    encodeUint256(0x80) +
    encodeAddress(to) +
    encodeUint256(deadline);
  return SELECTORS.swapExactETHForTokens + head + encodeAddressArray(path);
}

/**
 * swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)
 */
export function encodeSwapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline) {
  // args: amountIn, amountOutMin, offset(path)=0xa0, to, deadline, then path
  const head =
    encodeUint256(amountIn) +
    encodeUint256(amountOutMin) +
    encodeUint256(0xa0) +
    encodeAddress(to) +
    encodeUint256(deadline);
  return SELECTORS.swapExactTokensForTokens + head + encodeAddressArray(path);
}

/**
 * swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)
 */
export function encodeSwapExactTokensForETH(amountIn, amountOutMin, path, to, deadline) {
  const head =
    encodeUint256(amountIn) +
    encodeUint256(amountOutMin) +
    encodeUint256(0xa0) +
    encodeAddress(to) +
    encodeUint256(deadline);
  return SELECTORS.swapExactTokensForETH + head + encodeAddressArray(path);
}

/** Decode getAmountsOut result: offset, length, amounts… */
export function decodeAmountsOut(resultHex) {
  const hex = String(resultHex || "").replace(/^0x/i, "");
  if (hex.length < 192) throw new Error("getAmountsOut result too short");
  const len = Number(BigInt("0x" + hex.slice(64, 128)));
  const amounts = [];
  for (let i = 0; i < len; i++) {
    const start = 128 + i * 64;
    amounts.push(BigInt("0x" + hex.slice(start, start + 64)));
  }
  return amounts;
}
