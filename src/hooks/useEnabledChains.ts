import { useCallback, useEffect, useState } from 'react'
import {
  allKnownChains,
  getEnabledChainIds,
  onNetworksChange,
  setEnabledChainIds,
  toggleChain,
} from '@/lib/networks'

export function useEnabledChains() {
  const [enabledIds, setEnabledIds] = useState<number[]>(() => getEnabledChainIds())

  useEffect(() => {
    return onNetworksChange(() => setEnabledIds(getEnabledChainIds()))
  }, [])

  const enabledChains = allKnownChains().filter((c) => enabledIds.includes(c.id))

  const enable = useCallback((id: number) => {
    const ids = new Set(getEnabledChainIds())
    ids.add(id)
    setEnabledChainIds([...ids])
  }, [])

  const disable = useCallback((id: number) => {
    const ids = getEnabledChainIds().filter((x) => x !== id)
    setEnabledChainIds(ids.length ? ids : getEnabledChainIds())
  }, [])

  const toggle = useCallback((id: number) => {
    toggleChain(id)
  }, [])

  return { enabledIds, enabledChains, enable, disable, toggle }
}
