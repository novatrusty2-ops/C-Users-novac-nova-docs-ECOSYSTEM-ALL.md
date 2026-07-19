import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deploySafe } from '@/lib/safe/deploy'
import { addMultisigAccount } from '@/lib/accounts'
import { useWallet } from '@/context/WalletContext'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/common/Button'

export function CreateSafePage() {
  const { activeChainId, activeAccount } = useWallet()
  const navigate = useNavigate()
  const [owners, setOwners] = useState(activeAccount?.address ?? '')
  const [threshold, setThreshold] = useState(1)
  const [name, setName] = useState('Team Safe')
  const [loading, setLoading] = useState(false)

  const create = async () => {
    setLoading(true)
    try {
      const ownerList = owners.split(/[\s,]+/).filter(Boolean)
      const predicted = await deploySafe({ chainId: activeChainId, owners: ownerList, threshold })
      addMultisigAccount({
        name,
        address: predicted.address,
        safeAddress: predicted.address,
        owners: ownerList,
        threshold,
        chainId: activeChainId,
      })
      navigate(ROUTES.multisigPending)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container max-w-lg animate-fade-up">
      <h1 className="font-display text-3xl text-signet-gold-light">Create Safe</h1>
      <div className="card-interactive mt-6 space-y-3">
        <input className="input-field" placeholder="Safe name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          className="input-field min-h-24"
          placeholder="Owner addresses (space or comma separated)"
          value={owners}
          onChange={(e) => setOwners(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="input-field"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />
        <Button className="w-full" disabled={loading} onClick={() => void create()}>
          Predict & save Safe
        </Button>
      </div>
    </div>
  )
}
