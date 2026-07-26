/**
 * Minimal ABI encoding for Uniswap V2 Router02 (no ethers dep).
 */

export function pad32(hex: string): string {
  const h = String(hex).replace(/^0x/i, '').toLowerCase()
  if (h.length > 64) throw new Error('hex too long for uint256/address slot')
  return h.padStart(64, '0')
}

export function encodeAddress(addr: string): string {
  if (typeof addr !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(addr)) {
    throw new Error(`invalid address: ${addr}`)
  }
  return pad32(addr.slice(2))
}

export function encodeUint256(value: bigint | number | string): string {
  const n = typeof value === 'bigint' ? value : BigInt(value)
  if (n < 0n) throw new Error('uint256 cannot be negative')
  return pad32(n.toString(16))
}

export function encodeAddressArray(addrs: string[]): string {
  let out = encodeUint256(addrs.length)
  for (const a of addrs) out += encodeAddress(a)
  return out
}

export const SELECTORS = {
  getAmountsOut: '0xd06ca61f',
  swapExactETHForTokens: '0x7ff36ab5',
  swapExactTokensForTokens: '0x38ed1739',
  swapExactTokensForETH: '0x18cbafe5',
} as const

export function encodeGetAmountsOut(amountIn: bigint, path: string[]): string {
  const head = encodeUint256(amountIn) + encodeUint256(0x40)
  return SELECTORS.getAmountsOut + head + encodeAddressArray(path)
}

export function encodeSwapExactETHForTokens(
  amountOutMin: bigint,
  path: string[],
  to: string,
  deadline: bigint,
): string {
  const head =
    encodeUint256(amountOutMin) +
    encodeUint256(0x80) +
    encodeAddress(to) +
    encodeUint256(deadline)
  return SELECTORS.swapExactETHForTokens + head + encodeAddressArray(path)
}

export function encodeSwapExactTokensForTokens(
  amountIn: bigint,
  amountOutMin: bigint,
  path: string[],
  to: string,
  deadline: bigint,
): string {
  const head =
    encodeUint256(amountIn) +
    encodeUint256(amountOutMin) +
    encodeUint256(0xa0) +
    encodeAddress(to) +
    encodeUint256(deadline)
  return SELECTORS.swapExactTokensForTokens + head + encodeAddressArray(path)
}

export function encodeSwapExactTokensForETH(
  amountIn: bigint,
  amountOutMin: bigint,
  path: string[],
  to: string,
  deadline: bigint,
): string {
  const head =
    encodeUint256(amountIn) +
    encodeUint256(amountOutMin) +
    encodeUint256(0xa0) +
    encodeAddress(to) +
    encodeUint256(deadline)
  return SELECTORS.swapExactTokensForETH + head + encodeAddressArray(path)
}

export function decodeAmountsOut(resultHex: string): bigint[] {
  const hex = String(resultHex || '').replace(/^0x/i, '')
  if (hex.length < 192) throw new Error('getAmountsOut result too short')
  const len = Number(BigInt('0x' + hex.slice(64, 128)))
  const amounts: bigint[] = []
  for (let i = 0; i < len; i++) {
    const start = 128 + i * 64
    amounts.push(BigInt('0x' + hex.slice(start, start + 64)))
  }
  return amounts
}
