import { useCallback, useSyncExternalStore } from 'react'
import type { DisplayCurrency } from '@/types'
import {
  getDisplayCurrency,
  getHideBalances,
  setDisplayCurrency,
  setHideBalances,
} from '@/lib/settings'

export function useDisplaySettings() {
  const currency = useSyncExternalStore(
    () => () => {},
    () => getDisplayCurrency(),
    () => 'USD' as DisplayCurrency,
  )

  const hideBalances = useSyncExternalStore(
    () => () => {},
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

  return { currency, hideBalances, updateCurrency, updateHideBalances }
}
