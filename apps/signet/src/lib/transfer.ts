import { Interface, isAddress, parseUnits, formatUnits, type TransactionRequest } from 'ethers'

export const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
] as const

const erc20Iface = new Interface(ERC20_ABI)

export interface NativeTransferTx {
  to: string
  value: bigint
}

export interface Erc20TransferTx {
  to: string
  data: string
  token: string
}

export function validateTransferAddress(to: string): void {
  if (!isAddress(to)) throw new Error('Invalid recipient address')
}

export function validateTransferAmount(amount: string, decimals: number): bigint {
  const trimmed = amount.trim()
  if (!trimmed || Number(trimmed) <= 0) throw new Error('Invalid amount')
  try {
    return parseUnits(trimmed, decimals)
  } catch {
    throw new Error('Invalid amount')
  }
}

export function buildNativeTransfer(to: string, valueWei: bigint): NativeTransferTx {
  validateTransferAddress(to)
  if (valueWei <= 0n) throw new Error('Invalid amount')
  return { to, value: valueWei }
}

export function buildErc20Transfer(token: string, to: string, amount: bigint): Erc20TransferTx {
  if (!isAddress(token)) throw new Error('Invalid token address')
  validateTransferAddress(to)
  if (amount <= 0n) throw new Error('Invalid amount')
  const data = erc20Iface.encodeFunctionData('transfer', [to, amount])
  return { to: token, data, token }
}

export function toTransactionRequest(
  from: string,
  tx: NativeTransferTx | Erc20TransferTx,
): TransactionRequest {
  if ('value' in tx) {
    return { from, to: tx.to, value: tx.value }
  }
  return { from, to: tx.to, data: tx.data }
}

export function estimateFeeLabel(gasLimit: bigint, gasPrice: bigint): string {
  const fee = gasLimit * gasPrice
  if (fee === 0n) return 'Free'
  return `${formatUnits(fee, 18)} ETH`
}

export { ERC20_ABI as ERC20_TRANSFER_FRAGMENT }
