import { useState, type FormEvent } from 'react'
import { useTokenTransfer } from '@/hooks/useTokenTransfer'
import { useWallet } from '@/context/WalletContext'
import { Button } from '@/components/common/Button'
import { Spinner } from '@/components/common/Spinner'

export function SendPage() {
  const { activeChain, balances } = useWallet()
  const { send, pending } = useTokenTransfer()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [tokenAddress, setTokenAddress] = useState<string>('')

  const native = balances.find((b) => !b.address)
  const selected = tokenAddress
    ? balances.find((b) => b.address?.toLowerCase() === tokenAddress.toLowerCase())
    : native

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await send({
      to,
      amount,
      tokenAddress: tokenAddress || null,
      decimals: selected?.decimals ?? 18,
    })
  }

  return (
    <div className="page-container max-w-md animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Send</h1>
      <p className="mt-1 text-sm text-signet-ink-muted">On {activeChain?.name}</p>
      <form className="mt-6 space-y-3" onSubmit={(e) => void submit(e)}>
        <select
          className="input-field"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        >
          <option value="">Native ({native?.symbol ?? 'ETH'})</option>
          {balances
            .filter((b) => b.address)
            .map((b) => (
              <option key={b.address!} value={b.address!}>
                {b.symbol}
              </option>
            ))}
        </select>
        <input className="input-field" placeholder="Recipient address" value={to} onChange={(e) => setTo(e.target.value)} />
        <input className="input-field" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : 'Send transaction'}
        </Button>
      </form>
    </div>
  )
}
