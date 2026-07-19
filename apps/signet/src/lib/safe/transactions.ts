import { getAddress, keccak256, solidityPackedKeccak256, toUtf8Bytes } from 'ethers'
import type { PendingSafeTx } from '@/types'

export interface SafeTxParams {
  safeAddress: string
  to: string
  value: string
  data: string
  nonce: number
  chainId: number
}

export function computeSafeTxHash(params: SafeTxParams): string {
  return solidityPackedKeccak256(
    ['address', 'address', 'uint256', 'bytes32', 'uint256', 'uint256'],
    [
      getAddress(params.safeAddress),
      getAddress(params.to),
      BigInt(params.value),
      keccak256(params.data),
      BigInt(params.nonce),
      BigInt(params.chainId),
    ],
  )
}

export function buildSafeTransaction(params: SafeTxParams): PendingSafeTx & { nonce: number; chainId: number } {
  return {
    safeTxHash: computeSafeTxHash(params),
    safeAddress: getAddress(params.safeAddress),
    to: getAddress(params.to),
    value: params.value,
    data: params.data,
    confirmations: 0,
    threshold: 1,
    executed: false,
    nonce: params.nonce,
    chainId: params.chainId,
  }
}

export function signSafeTxHash(safeTxHash: string, ownerPrivateKey: string): string {
  return keccak256(toUtf8Bytes(`${safeTxHash}:${ownerPrivateKey}`))
}
