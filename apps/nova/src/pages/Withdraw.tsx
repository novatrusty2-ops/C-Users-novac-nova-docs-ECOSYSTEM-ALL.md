import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { JsonRpcProvider } from 'ethers'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { TokenChart } from '@/components/tokens/TokenChart'
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
import { isMeshStable } from '@/lib/tokenCapabilities'
import {
  canWithdrawToken,
  destinationExplorerTx,
  validateWithdrawAddress,
  withdrawDestinationsForToken,
  withdrawWarning,
  withdrawableTokens,
  type WithdrawDestination,
} from '@/lib/withdraw'
import { getEnabledChainIds, setEnabledChainIds } from '@/lib/networks'
import type { ChainToken } from '@/types'

export function Withdraw() {
  const { activeChainId, activeAccount, balances, switchChain } = useWallet()
  const { connected, ensureActiveChain, getInjectedSigner, switchWalletChain } = useWeb3()
  const [params] = useSearchParams()

  const [symbol, setSymbol] = useState(() => params.get('symbol') || 'USDT')
  const [destId, setDestId] = useState(() => {
    const fromChain = Number(params.get('chainId'))
    if (fromChain === 138) return 'dbis-138'
    if (fromChain === 22016) return 'nova-one'
    if (fromChain === 33001) return 'nrw-world'
    if (fromChain === 1) return 'ethereum'
    if (fromChain === 56) return 'bnb'
    return 'dbis-138'
  })
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [hash, setHash] = useState<string | null>(null)

  const destinations = useMemo(() => withdrawDestinationsForToken(symbol), [symbol])
  const dest: WithdrawDestination =
    destinations.find((d) => d.id === destId) ?? destinations[0]!
  const destChainId = dest?.chainId ?? activeChainId

  const catalog = useMemo(() => {
    const base = tokensOnChain(destChainId)
    const map = new Map<string, ChainToken>()
    for (const t of base) {
      map.set(`${t.symbol.toUpperCase()}:${(t.address ?? 'native').toLowerCase()}`, t)
    }
    for (const row of balances.filter((b) => b.chainId === destChainId)) {
      const key = `${row.symbol.toUpperCase()}:${(row.address ?? 'native').toLowerCase()}`
      const prev = map.get(key)
      if (prev) {
        map.set(key, { ...prev, address: row.address ?? prev.address })
      } else if (row.address || row.symbol) {
        map.set(key, {
          symbol: row.symbol,
          name: row.name,
          decimals: row.decimals,
          address: row.address,
          standard: row.address ? 'erc20' : 'native',
          tradable: true,
          transferable: true,
          swappable: isMeshStable(row.symbol),
        })
      }
    }
    return withdrawableTokens(destChainId, [...map.values()])
  }, [destChainId, balances])

  const stablesFirst = useMemo(
    () =>
      [...catalog].sort((a, b) => {
        const as = isMeshStable(a.symbol) ? 0 : 1
        const bs = isMeshStable(b.symbol) ? 0 : 1
        return as - bs || a.symbol.localeCompare(b.symbol)
      }),
    [catalog],
  )

  const token =
    stablesFirst.find((t) => t.symbol === symbol) ??
    stablesFirst.find((t) => t.symbol.toUpperCase() === symbol.toUpperCase())

  useEffect(() => {
    if (!destinations.some((d) => d.id === destId) && destinations[0]) {
      setDestId(destinations[0].id)
    }
  }, [destinations, destId])

  useEffect(() => {
    if (stablesFirst.length && !stablesFirst.some((t) => t.symbol === symbol)) {
      setSymbol(stablesFirst[0]!.symbol)
    }
  }, [stablesFirst, symbol])

  const midPrice =
    balances.find((b) => b.chainId === destChainId && b.symbol === symbol)?.usdPrice ??
    (isMeshStable(symbol) ? 1 : null)

  const warning = dest ? withdrawWarning(dest, symbol) : null

  async function selectDestination(next: WithdrawDestination) {
    setDestId(next.id)
    setHash(null)
    setError('')
    // Ensure optional public chains (ETH/BSC) are enabled for balances + send
    const enabled = getEnabledChainIds()
    if (!enabled.includes(next.chainId)) {
      setEnabledChainIds([...enabled, next.chainId])
    }
    if (connected) {
      try {
        await switchWalletChain(next.chainId)
        return
      } catch {
        /* fall through */
      }
    }
    switchChain(next.chainId)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeAccount || !token || !dest) return
    setError('')
    setBusy(true)
    setHash(null)
    try {
      const recipient = validateWithdrawAddress(to)
      const gate = canWithdrawToken(dest.chainId, token)
      if (!gate.ok) throw new Error(gate.reason)

      // Ensure app + wallet are on destination network before signing
      if (connected) {
        await ensureActiveChain(dest.chainId)
      } else {
        switchChain(dest.chainId)
      }

      const chain = getChain(dest.chainId)
      if (!chain) throw new Error('Unknown destination network')

      // Re-resolve token on destination chain (may differ from source catalog)
      const destTokens = withdrawableTokens(dest.chainId, tokensOnChain(dest.chainId))
      const destToken =
        destTokens.find((t) => t.symbol.toUpperCase() === token.symbol.toUpperCase()) ?? token
      const destGate = canWithdrawToken(dest.chainId, destToken)
      if (!destGate.ok) throw new Error(destGate.reason)

      const value = validateTransferAmount(amount, destToken.decimals)
      const injected = connected ? await getInjectedSigner() : null
      let sender
      if (injected) {
        sender = injected
      } else if (isUnlocked()) {
        const rpc = chain.rpcUrls[0]
        if (!rpc) throw new Error('No RPC for destination')
        sender = getSigner(0).connect(
          new JsonRpcProvider(rpc, chain.id, { staticNetwork: true }),
        )
      } else {
        throw new Error('Connect a Web3 wallet or unlock Nova Wallet to withdraw')
      }

      const isNative = destToken.standard === 'native'
      if (!isNative && !destToken.address) {
        throw new Error(
          `${destToken.symbol} has no contract on ${chain.name} — enable the network and refresh balances`,
        )
      }

      let txHash: string
      if (isNative) {
        const built = buildNativeTransfer(recipient, value)
        const tx = await sender.sendTransaction(
          toTransactionRequest(activeAccount.address, built),
        )
        txHash = tx.hash
      } else {
        const built = buildErc20Transfer(destToken.address!, recipient, value)
        const tx = await sender.sendTransaction(
          toTransactionRequest(activeAccount.address, built),
        )
        txHash = tx.hash
      }

      appendActivity(activeAccount.address, {
        id: createActivityId(),
        chainId: dest.chainId,
        hash: txHash,
        from: activeAccount.address,
        to: recipient,
        value: amount,
        symbol: destToken.symbol,
        timestamp: Date.now(),
        status: 'pending',
        kind: 'withdraw',
      })
      setHash(txHash)
      setAmount('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed')
    } finally {
      setBusy(false)
    }
  }

  const explorer = hash ? destinationExplorerTx(dest.chainId, hash) : null

  return (
    <>
      <TopBar title="Withdraw" backTo={ROUTES.portfolio} />
      <div className="page-container space-y-5">
        <section className="space-y-1">
          <p className="text-sm text-nova-muted">
            External withdraw · stables tradable & transferable · production Web3
          </p>
          {token ? (
            <TokenChart
              chainId={dest?.chainId ?? activeChainId}
              symbol={symbol}
              midPrice={midPrice}
              height={120}
              compact
            />
          ) : null}
        </section>

        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <label className="block space-y-1.5">
            <span className="text-xs text-nova-muted">Asset</span>
            <select
              className="input-field w-full"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
            >
              {stablesFirst.map((t) => (
                <option key={`${t.symbol}:${t.address ?? 'n'}`} value={t.symbol}>
                  {t.symbol}
                  {isMeshStable(t.symbol) ? ' · stable' : ''}
                  {t.standard === 'erc20' && !t.address ? ' · pending contract' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-nova-muted">Destination network</span>
            <select
              className="input-field w-full"
              value={dest.id}
              onChange={(e) => {
                const next = destinations.find((d) => d.id === e.target.value)
                if (next) void selectDestination(next)
              }}
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            <span className="block text-[11px] text-nova-muted">{dest.hint}</span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-nova-muted">External address</span>
            <input
              className="input-field"
              placeholder="0x… CEX deposit or self-custody"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-nova-muted">Amount</span>
            <input
              className="input-field"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>

          {warning ? (
            <p className="rounded-xl bg-nova-surface px-3 py-2 text-xs text-nova-accent">{warning}</p>
          ) : null}
          {error ? <p className="text-sm text-nova-danger">{error}</p> : null}
          {hash ? (
            <div className="space-y-1 text-xs">
              <p className="font-mono text-nova-accent break-all">Submitted: {hash}</p>
              {explorer ? (
                <a href={explorer} target="_blank" rel="noreferrer" className="text-nova-accent">
                  View on explorer →
                </a>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy || !stablesFirst.length}>
            {busy ? 'Withdrawing…' : connected ? 'Withdraw with Web3' : 'Withdraw'}
          </Button>
        </form>

        <p className="text-center text-[11px] text-nova-muted">
          Need a simple same-wallet transfer?{' '}
          <Link to={ROUTES.send} className="text-nova-accent">
            Use Send
          </Link>
        </p>
      </div>
    </>
  )
}
