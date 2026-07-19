import { useCallback, useState } from 'react'
import { Contract, JsonRpcProvider } from 'ethers'
import {
  buildErc20Transfer,
  buildNativeTransfer,
  ERC20_ABI,
  toTransactionRequest,
  validateTransferAmount,
} from '@/lib/transfer'
import { getSigner } from '@/lib/keystore'
import { useWallet } from '@/context/WalletContext'
import { useToast } from '@/context/ToastContext'

export interface TransferParams {
  to: string
  amount: string
  tokenAddress?: string | null
  decimals?: number
}

export function useTokenTransfer() {
  const { activeAccount, activeChain, activeChainId } = useWallet()
  const { push } = useToast()
  const [pending, setPending] = useState(false)

  const send = useCallback(
    async ({ to, amount, tokenAddress, decimals = 18 }: TransferParams) => {
      if (!activeAccount || !activeChain) throw new Error('Wallet not ready')
      const rpc = activeChain.rpcUrls[0]
      if (!rpc) throw new Error('No RPC')

      setPending(true)
      try {
        const signer = getSigner(activeAccount.derivationIndex ?? 0)
        const provider = new JsonRpcProvider(rpc, activeChainId)
        const connected = signer.connect(provider)
        const valueWei = validateTransferAmount(amount, decimals)

        let txReq
        if (!tokenAddress) {
          txReq = toTransactionRequest(activeAccount.address, buildNativeTransfer(to, valueWei))
        } else {
          txReq = toTransactionRequest(
            activeAccount.address,
            buildErc20Transfer(tokenAddress, to, valueWei),
          )
        }

        const tx = await connected.sendTransaction(txReq)
        push(`Transaction sent: ${tx.hash.slice(0, 10)}…`, 'success')
        return tx
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transfer failed'
        push(msg, 'error')
        throw err
      } finally {
        setPending(false)
      }
    },
    [activeAccount, activeChain, activeChainId, push],
  )

  const estimateGas = useCallback(
    async ({ to, amount, tokenAddress, decimals = 18 }: TransferParams) => {
      if (!activeAccount || !activeChain) return null
      const rpc = activeChain.rpcUrls[0]
      if (!rpc) return null
      try {
        const provider = new JsonRpcProvider(rpc, activeChainId)
        const valueWei = validateTransferAmount(amount, decimals)
        if (!tokenAddress) {
          return provider.estimateGas({ from: activeAccount.address, to, value: valueWei })
        }
        const token = new Contract(tokenAddress, ERC20_ABI, provider)
        return token.transfer.estimateGas(to, valueWei, { from: activeAccount.address })
      } catch {
        return null
      }
    },
    [activeAccount, activeChain, activeChainId],
  )

  return { send, estimateGas, pending }
}
