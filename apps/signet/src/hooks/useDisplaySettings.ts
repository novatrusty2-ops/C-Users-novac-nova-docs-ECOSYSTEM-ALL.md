import { useCallback, useSyncExternalStore } from 'react'
import type { DisplayCurrency, DisplaySettings } from '@/types'
import {
  convertFromUsd,
  formatMoney,
  getAutolockMinutes,
  getDisplayCurrency,
  setAutolockMinutes,
  setDisplayCurrency,
} from '@/lib/settings'
import { getPref, setPref } from '@/lib/prefs'

const DISPLAY_KEY = 'displaySettings'

const DEFAULT: DisplaySettings = {
  currency: 'USD',
  hideBalances: false,
  hideSmallBalances: true,
  smallBalanceThresholdUsd: 1,
  spamFilter: true,
}

function readDisplay(): DisplaySettings {
  const stored = getPref<Partial<DisplaySettings>>(DISPLAY_KEY, {})
  return {
    ...DEFAULT,
    ...stored,
    currency: getDisplayCurrency(),
  }
}

function subscribe(cb: () => void): () => void {
  const handler = () => cb()
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

export function useDisplaySettings() {
  const settings = useSyncExternalStore(subscribe, readDisplay, readDisplay)

  const update = useCallback((patch: Partial<DisplaySettings>) => {
    const next = { ...readDisplay(), ...patch }
    setPref(DISPLAY_KEY, {
      hideBalances: next.hideBalances,
      hideSmallBalances: next.hideSmallBalances,
      smallBalanceThresholdUsd: next.smallBalanceThresholdUsd,
      spamFilter: next.spamFilter,
    })
    if (patch.currency) setDisplayCurrency(patch.currency)
    if (patch.currency === undefined && next.currency) setDisplayCurrency(next.currency)
    window.dispatchEvent(new Event('storage'))
  }, [])

  const setCurrency = useCallback((currency: DisplayCurrency) => {
    setDisplayCurrency(currency)
    update({ currency })
  }, [update])

  const setAutolock = useCallback((minutes: ReturnType<typeof getAutolockMinutes>) => {
    setAutolockMinutes(minutes)
  }, [])

  return {
    settings,
    autolockMinutes: getAutolockMinutes(),
    update,
    setCurrency,
    setAutolock,
    formatUsd: (usd: number) => formatMoney(convertFromUsd(usd, settings.currency), settings.currency),
  }
}
