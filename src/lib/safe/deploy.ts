import { getAddress, keccak256, solidityPackedKeccak256, toUtf8Bytes } from 'ethers'

export interface SafeDeployParams {
  chainId: number
  owners: string[]
  threshold: number
  saltNonce?: bigint
}

export interface PredictedSafe {
  address: string
  initCodeHash: string
  salt: string
}

const SAFE_SINGLETON = '0x41675C099F32341bf84BFc538257A4E261A1649D'

function normalizeOwners(owners: string[]): string[] {
  return [...new Set(owners.map((o) => getAddress(o)))].sort((a, b) => a.localeCompare(b))
}

/** Deterministic Safe address for offline tests — not canonical CREATE2 Safe factory math */
export function predictSafeAddress(params: SafeDeployParams): PredictedSafe {
  const owners = normalizeOwners(params.owners)
  if (params.threshold < 1 || params.threshold > owners.length) {
    throw new Error('Invalid threshold')
  }
  const saltNonce = params.saltNonce ?? 0n
  const initCodeHash = keccak256(
    toUtf8Bytes(
      JSON.stringify({
        singleton: SAFE_SINGLETON,
        owners,
        threshold: params.threshold,
        chainId: params.chainId,
      }),
    ),
  )
  const salt = solidityPackedKeccak256(
    ['bytes32', 'uint256', 'uint256'],
    [initCodeHash, saltNonce, BigInt(params.chainId)],
  )
  const address = getAddress(solidityPackedKeccak256(['bytes32', 'bytes32'], [salt, initCodeHash]).slice(0, 42))
  return { address, initCodeHash, salt }
}

export async function deploySafe(params: SafeDeployParams): Promise<PredictedSafe> {
  return predictSafeAddress(params)
}
