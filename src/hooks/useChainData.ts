import { useMemo } from 'react'
import { allKnownChains } from '@/lib/networks'
import { getChain } from '@/lib/chains'
import { useWallet } from '@/context/WalletContext'
import { canViewPrivateBankingChains } from '@/lib/privateAccess'

export function useChainData() {
  const { activeChainId } = useWallet()

  const activeChain = useMemo(() => getChain(activeChainId), [activeChainId])

  const visibleChains = useMemo(() => {
    const all = allKnownChains()
    if (canViewPrivateBankingChains()) return all
    return all.filter((c) => c.tier !== 'private-banking' || c.isDefault)
  }, [])

  return { activeChain, activeChainId, visibleChains, getChain }
}
