import type { AutolockMinutes, DisplayCurrency } from '@/types'
import { getPref, setPref } from './prefs'

const CURRENCY_KEY = 'displayCurrency'
const AUTOLOCK_KEY = 'autolockMinutes'
const HIDE_BALANCES_KEY = 'hideBalances'

export const FX_FROM_USD: Record<DisplayCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
}

const CURRENCY_SYMBOL: Record<DisplayCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
}

export function getDisplayCurrency(): DisplayCurrency {
  return getPref<DisplayCurrency>(CURRENCY_KEY, 'USD')
}

export function setDisplayCurrency(currency: DisplayCurrency): void {
  setPref(CURRENCY_KEY, currency)
}

export function getAutolockMinutes(): AutolockMinutes {
  return getPref<AutolockMinutes>(AUTOLOCK_KEY, 15)
}

export function setAutolockMinutes(minutes: AutolockMinutes): void {
  setPref(AUTOLOCK_KEY, minutes)
}

export function getHideBalances(): boolean {
  return getPref<boolean>(HIDE_BALANCES_KEY, false)
}

export function setHideBalances(hide: boolean): void {
  setPref(HIDE_BALANCES_KEY, hide)
}

export function convertFromUsd(usd: number, currency: DisplayCurrency = getDisplayCurrency()): number {
  return usd * FX_FROM_USD[currency]
}

export function formatMoney(amount: number, currency: DisplayCurrency = getDisplayCurrency()): string {
  const sym = CURRENCY_SYMBOL[currency]
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
