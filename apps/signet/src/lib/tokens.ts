import { getAddress, isAddress, parseUnits, formatUnits } from 'ethers'

export function shortAddress(address: string, chars = 4): string {
  if (!isValidAddress(address)) return address
  const a = getAddress(address)
  return `${a.slice(0, 2 + chars)}…${a.slice(-chars)}`
}

export function isValidAddress(value: string): boolean {
  try {
    return isAddress(value)
  } catch {
    return false
  }
}

export function formatUnitsAmount(raw: bigint, decimals: number, maxFraction = 6): string {
  const s = formatUnits(raw, decimals)
  const n = Number(s)
  if (!Number.isFinite(n)) return s
  if (n === 0) return '0'
  if (n < 0.000001) return '<0.000001'
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFraction })
}

export function parseAmount(amount: string, decimals: number): bigint {
  const trimmed = amount.trim()
  if (!trimmed) throw new Error('Amount required')
  return parseUnits(trimmed, decimals)
}

export { formatUnits, parseUnits, getAddress, isAddress }
