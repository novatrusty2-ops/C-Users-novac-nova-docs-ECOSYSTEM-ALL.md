import { Contract, JsonRpcProvider, formatUnits, type Signer, type Wallet } from 'ethers'
import type { TokenBalanceRow } from '@/types'
import { getChain } from './chains'
import {
  ERC20_ABI,
  buildErc20Transfer,
  buildNativeTransfer,
  toTransactionRequest,
  validateTransferAddress,
} from './transfer'
import { appendActivity, createActivityId } from './activity'

export interface SweepItemResult {
  chainId: number
  symbol: string
  amount: string
  hash?: string
  error?: string
}

export interface SweepAllResult {
  to: string
  attempted: number
  sent: number
  results: SweepItemResult[]
}

function gasReserveWei(): bigint {
  // Leave a small native reserve for gas on non-zero-gas chains
  return 10n ** 15n // 0.001 native
}

/**
 * Send every positive token balance from the unlocked signer to `to`.
 * Skips zero balances and catalog-only (no on-chain balance) rows.
 */
export async function sweepAllBalances(params: {
  to: string
  fromAddress: string
  balances: TokenBalanceRow[]
  signer: Wallet | Signer
  derivationIndex?: number
}): Promise<SweepAllResult> {
  validateTransferAddress(params.to)
  const results: SweepItemResult[] = []
  let sent = 0

  const spendable = params.balances.filter((b) => b.balanceRaw > 0n)
  for (const row of spendable) {
    const chain = getChain(row.chainId)
    const rpc = chain?.rpcUrls[0]
    if (!rpc || !chain) {
      results.push({
        chainId: row.chainId,
        symbol: row.symbol,
        amount: row.balance,
        error: 'No RPC',
      })
      continue
    }

    try {
      const provider = new JsonRpcProvider(rpc, chain.id, { staticNetwork: true })
      const connected = params.signer.connect(provider)

      let value = row.balanceRaw
      let txHash: string

      if (row.address == null) {
        // Native: reserve gas unless zero-gas chain
        if (!chain.zeroGas) {
          if (value <= gasReserveWei()) {
            results.push({
              chainId: row.chainId,
              symbol: row.symbol,
              amount: row.balance,
              error: 'Balance too low after gas reserve',
            })
            continue
          }
          value = value - gasReserveWei()
        }
        const built = buildNativeTransfer(params.to, value)
        const req = toTransactionRequest(params.fromAddress, built)
        const tx = await connected.sendTransaction(req)
        txHash = tx.hash
      } else {
        // Re-read live balance for ERC-20
        const c = new Contract(row.address, ERC20_ABI, provider)
        const live = (await c.balanceOf(params.fromAddress)) as bigint
        if (live <= 0n) {
          results.push({
            chainId: row.chainId,
            symbol: row.symbol,
            amount: '0',
            error: 'Zero on-chain balance',
          })
          continue
        }
        const built = buildErc20Transfer(row.address, params.to, live)
        const req = toTransactionRequest(params.fromAddress, built)
        const tx = await connected.sendTransaction(req)
        txHash = tx.hash
        value = live
      }

      const amount = formatUnits(value, row.decimals)
      appendActivity(params.fromAddress, {
        id: createActivityId(),
        chainId: row.chainId,
        hash: txHash,
        from: params.fromAddress,
        to: params.to,
        value: amount,
        symbol: row.symbol,
        timestamp: Date.now(),
        status: 'pending',
        kind: 'send',
      })
      results.push({ chainId: row.chainId, symbol: row.symbol, amount, hash: txHash })
      sent++
    } catch (err) {
      results.push({
        chainId: row.chainId,
        symbol: row.symbol,
        amount: row.balance,
        error: err instanceof Error ? err.message : 'Send failed',
      })
    }
  }

  return {
    to: params.to,
    attempted: spendable.length,
    sent,
    results,
  }
}
