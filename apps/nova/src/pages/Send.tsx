import { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/common/Button'
import { useWallet } from '@/context/WalletContext'
import { getChain } from '@/lib/chains'
import { findToken } from '@/lib/tokens'
import { buildErc20Transfer, buildNativeTransfer, toTransactionRequest } from '@/lib/transfer'
import { appendActivity, createActivityId } from '@/lib/activity'
import { ROUTES } from '@/lib/routes'
import { getSigner } from '@/lib/keystore'
import { JsonRpcProvider } from 'ethers'

export function Send() {
  const { activeChainId, activeAccount } = useWallet()
  const chain = getChain(activeChainId)
  const [symbol, setSymbol] = useState(chain?.tokens[0]?.symbol ?? 'NOVA')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [hash, setHash] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeAccount || !chain) return
    setError('')
    setBusy(true)
    setHash(null)
    try {
      const token = findToken(activeChainId, symbol)
      if (!token) throw new Error('Token not found')

      const signer = getSigner(0)
      const rpc = chain.rpcUrls[0]
      if (!rpc) throw new Error('No RPC')

      const provider = new JsonRpcProvider(rpc, chain.id, { staticNetwork: true })
      const connected = signer.connect(provider)

      let txHash: string
      if (token.address == null) {
        const built = buildNativeTransfer(to, BigInt(Math.floor(Number(amount) * 1e18)))
        const req = toTransactionRequest(activeAccount.address, built)
        const tx = await connected.sendTransaction(req)
        txHash = tx.hash
      } else {
        const built = buildErc20Transfer(
          token.address,
          to,
          BigInt(Math.floor(Number(amount) * 10 ** token.decimals)),
        )
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
          <select
            className="input-field w-full"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {chain?.tokens.map((t) => (
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
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send'}
          </Button>
        </form>
      </div>
    </>
  )
}
