import type { AutolockMinutes, DisplayCurrency } from '@/types'
import { getPref, setPref } from './prefs'
import { BRIDGE_CURRENCIES, type BridgeCurrencySymbol } from './bridgeCurrencies'

const CURRENCY_KEY = 'displayCurrency'
const AUTOLOCK_KEY = 'autolockMinutes'
const HIDE_BALANCES_KEY = 'hideBalances'

export const DISPLAY_CURRENCIES: DisplayCurrency[] = [
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'CHF',
  'JPY',
  'SDG',
]

/** Units of display currency per 1 USD */
export const FX_FROM_USD: Record<DisplayCurrency, number> = Object.fromEntries(
  BRIDGE_CURRENCIES.map((c) => [c.symbol, c.perUsd]),
) as Record<DisplayCurrency, number>

const CURRENCY_SYMBOL: Record<DisplayCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CHF: 'CHF ',
  JPY: '¥',
  SDG: 'SDG ',
}

export function getDisplayCurrency(): DisplayCurrency {
  const raw = getPref<string>(CURRENCY_KEY, 'USD')
  return (DISPLAY_CURRENCIES as string[]).includes(raw) ? (raw as DisplayCurrency) : 'USD'
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
  return usd * (FX_FROM_USD[currency] ?? 1)
}

export function formatMoney(amount: number, currency: DisplayCurrency = getDisplayCurrency()): string {
  const sym = CURRENCY_SYMBOL[currency] ?? ''
  const digits = currency === 'JPY' ? 0 : 2
  // amount is already in display currency when passed from formatMoney(convertFromUsd(...))
  // Our portfolio passes USD totals through formatMoney — convert here.
  const converted = convertFromUsd(amount, currency)
  return `${sym}${converted.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`
}

export function bridgeCurrencyLabel(symbol: BridgeCurrencySymbol): string {
  return BRIDGE_CURRENCIES.find((c) => c.symbol === symbol)?.name ?? symbol
}
