import { useCallback, useSyncExternalStore } from 'react'
import type { DisplayCurrency } from '@/types'
import {
  getDisplayCurrency,
  getHideBalances,
  setDisplayCurrency,
  setHideBalances,
} from '@/lib/settings'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('nova-settings', onStoreChange)
  return () => window.removeEventListener('nova-settings', onStoreChange)
}

export function useDisplaySettings() {
  const currency = useSyncExternalStore(
    subscribe,
    () => getDisplayCurrency(),
    () => 'USD' as DisplayCurrency,
  )

  const hideBalances = useSyncExternalStore(
    subscribe,
    () => getHideBalances(),
    () => false,
  )

  const updateCurrency = useCallback((c: DisplayCurrency) => {
    setDisplayCurrency(c)
    window.dispatchEvent(new Event('nova-settings'))
  }, [])

  const updateHideBalances = useCallback((hide: boolean) => {
    setHideBalances(hide)
    window.dispatchEvent(new Event('nova-settings'))
  }, [])

  const toggleHideBalances = useCallback(() => {
    setHideBalances(!getHideBalances())
    window.dispatchEvent(new Event('nova-settings'))
  }, [])

  return { currency, hideBalances, updateCurrency, updateHideBalances, toggleHideBalances }
}
