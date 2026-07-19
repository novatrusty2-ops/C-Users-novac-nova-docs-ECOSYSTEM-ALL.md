import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { addUserToken } from '@/lib/usertokens'
import { useWallet } from '@/context/WalletContext'
import { useToast } from '@/context/ToastContext'

interface AddTokenModalProps {
  open: boolean
  onClose: () => void
}

export function AddTokenModal({ open, onClose }: AddTokenModalProps) {
  const { activeChainId } = useWallet()
  const { push } = useToast()
  const [address, setAddress] = useState('')
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [decimals, setDecimals] = useState('18')

  const submit = () => {
    addUserToken({
      chainId: activeChainId,
      address: address || null,
      symbol: symbol.toUpperCase(),
      name,
      decimals: Number(decimals) || 18,
    })
    push('Token added', 'success')
    onClose()
    setAddress('')
    setSymbol('')
    setName('')
  }

  return (
    <Modal open={open} onClose={onClose} title="Add custom token">
      <div className="space-y-3">
        <input className="input-field" placeholder="Contract address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <input className="input-field" placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
        <input className="input-field" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-field" placeholder="Decimals" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
        <Button className="w-full" onClick={submit}>
          Add token
        </Button>
      </div>
    </Modal>
  )
}
