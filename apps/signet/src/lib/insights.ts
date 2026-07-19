import type { TokenBalanceRow } from '@/types'
import { convertFromUsd, formatMoney, getDisplayCurrency } from './settings'

export interface PortfolioInsight {
  id: string
  message: string
  severity: 'info' | 'warning' | 'positive'
}

export function buildPortfolioInsights(
  rows: TokenBalanceRow[],
  totalUsd: number,
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = []
  const currency = getDisplayCurrency()

  if (rows.length === 0) {
    insights.push({
      id: 'empty',
      message: 'Your portfolio is empty. Receive or bridge assets to get started.',
      severity: 'info',
    })
    return insights
  }

  if (totalUsd > 0) {
    insights.push({
      id: 'total',
      message: `Estimated portfolio value: ${formatMoney(convertFromUsd(totalUsd, currency), currency)}.`,
      severity: 'info',
    })
  }

  const stables = rows.filter((r) => r.usdValue != null && r.symbol.match(/^(USDC|USDT|DAI|USD)$/i))
  const stableUsd = stables.reduce((s, r) => s + (r.usdValue ?? 0), 0)
  if (totalUsd > 0 && stableUsd / totalUsd > 0.7) {
    insights.push({
      id: 'stable-heavy',
      message: 'Most of your holdings are stablecoins — consider diversifying.',
      severity: 'warning',
    })
  }

  const chains = new Set(rows.filter((r) => r.balanceRaw > 0n).map((r) => r.chainId))
  if (chains.size > 3) {
    insights.push({
      id: 'multi-chain',
      message: `Assets spread across ${chains.size} networks — review bridge fees before consolidating.`,
      severity: 'info',
    })
  }

  const top = [...rows]
    .filter((r) => (r.usdValue ?? 0) > 0)
    .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0))[0]
  if (top) {
    insights.push({
      id: 'top-holding',
      message: `Largest position: ${top.symbol} on ${top.chainName}.`,
      severity: 'positive',
    })
  }

  return insights
}
