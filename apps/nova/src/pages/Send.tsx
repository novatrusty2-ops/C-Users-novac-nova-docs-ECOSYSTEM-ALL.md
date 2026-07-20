import { useMemo, useState } from 'react'
import { JsonRpcProvider } from 'ethers'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { useWallet } from '@/context/WalletContext'
import { useWeb3 } from '@/context/Web3Context'
import { getChain, tokensOnChain } from '@/lib/chains'
import {
  buildErc20Transfer,
  buildNativeTransfer,
  toTransactionRequest,
  validateTransferAmount,
} from '@/lib/transfer'
import { appendActivity, createActivityId } from '@/lib/activity'
import { ROUTES } from '@/lib/routes'
import { getSigner, isUnlocked } from '@/lib/keystore'
import { canTransferToken, defaultTokenFlags, isMeshStable } from '@/lib/tokenCapabilities'
import type { ChainToken } from '@/types'

export function Send() {
  const { activeChainId, activeAccount, balances } = useWallet()
  const { connected, ensureActiveChain, getInjectedSigner } = useWeb3()
  const chain = getChain(activeChainId)

  const sendTokens = useMemo(() => {
    const catalog = tokensOnChain(activeChainId)
    const byKey = new Map<string, ChainToken>()
    for (const t of catalog) {
      byKey.set(`${t.symbol.toUpperCase()}:${(t.address ?? 'native').toLowerCase()}`, t)
    }
    // Merge explorer-discovered contract addresses from live balances
    for (const row of balances.filter((b) => b.chainId === activeChainId)) {
      const key = `${row.symbol.toUpperCase()}:${(row.address ?? 'native').toLowerCase()}`
      const existing = byKey.get(key) ?? byKey.get(`${row.symbol.toUpperCase()}:native`)
      if (existing) {
        byKey.set(key, {
          ...existing,
          address: row.address ?? existing.address,
          standard: row.address ? 'erc20' : existing.standard,
        })
      } else if (row.address) {
        byKey.set(key, {
          symbol: row.symbol,
          name: row.name,
          decimals: row.decimals,
          address: row.address,
          standard: 'erc20',
          tradable: true,
          transferable: true,
          swappable: isMeshStable(row.symbol),
        })
      }
    }
    return [...byKey.values()].filter((t) => {
      const flags = defaultTokenFlags(activeChainId, t)
      return flags.transferable || t.standard === 'native'
    })
  }, [activeChainId, balances])

  const [symbol, setSymbol] = useState(sendTokens[0]?.symbol ?? chain?.tokens[0]?.symbol ?? 'ETH')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [hash, setHash] = useState<string | null>(null)

  const selected =
    sendTokens.find((t) => t.symbol === symbol) ??
    sendTokens.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase())

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeAccount || !chain) return
    setError('')
    setBusy(true)
    setHash(null)
    try {
      const token = selected
      if (!token) throw new Error('Token not found')

      const gate = canTransferToken(activeChainId, token)
      if (!gate.ok) throw new Error(gate.reason)

      const value = validateTransferAmount(amount, token.decimals)

      if (connected) {
        await ensureActiveChain(activeChainId)
      }

      const injected = connected ? await getInjectedSigner() : null
      let sender
      if (injected) {
        sender = injected
      } else if (isUnlocked()) {
        const rpc = chain.rpcUrls[0]
        if (!rpc) throw new Error('No RPC')
        const provider = new JsonRpcProvider(rpc, chain.id, { staticNetwork: true })
        sender = getSigner(0).connect(provider)
      } else {
        throw new Error('Connect a Web3 wallet or unlock Nova Wallet to send')
      }

      const isNative = token.standard === 'native'
      if (!isNative && !token.address) {
        throw new Error(`${token.symbol} contract missing — cannot transfer`)
      }

      let txHash: string
      if (isNative) {
        const built = buildNativeTransfer(to, value)
        const req = toTransactionRequest(activeAccount.address, built)
        const tx = await sender.sendTransaction(req)
        txHash = tx.hash
      } else {
        const built = buildErc20Transfer(token.address!, to, value)
        const req = toTransactionRequest(activeAccount.address, built)
        const tx = await sender.sendTransaction(req)
        txHash = tx.hash
      }

      appendActivity(activeAccount.address, {
        id: createActivityId(),
        chainId: activeChainId,
        hash: txHash,
        from: activeAccount.address,
        to,
        value: amount,
        symbol: token.symbol,
        timestamp: Date.now(),
        status: 'pending',
        kind: 'send',
      })
      setHash(txHash)
      setAmount('')
      setTo('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <TopBar title="Send" backTo={ROUTES.portfolio} />
      <div className="page-container">
        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <p className="text-xs text-nova-muted">
            {connected
              ? 'Signing with connected Web3 wallet · network auto-switches'
              : 'Unlock Nova Wallet or connect MetaMask / Trust / SafePal / Gate'}
          </p>
          <select
            className="input-field w-full"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {sendTokens.map((t) => (
              <option key={`${t.symbol}:${t.address ?? 'native'}`} value={t.symbol}>
                {t.symbol}
                {isMeshStable(t.symbol) ? ' · stable' : ''}
                {t.standard === 'erc20' && !t.address ? ' · pending contract' : ''}
                {defaultTokenFlags(activeChainId, t).transferable ? '' : ' · locked'}
              </option>
            ))}
          </select>
          <input
            className="input-field"
            placeholder="Recipient address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
          />
          <input
            className="input-field"
            inputMode="decimal"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-nova-danger">{error}</p> : null}
          {hash ? (
            <p className="text-xs font-mono text-nova-accent break-all">Submitted: {hash}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy || !sendTokens.length}>
            {busy ? 'Sending…' : 'Send'}
          </Button>
        </form>
      </div>
    </>
  )
}
