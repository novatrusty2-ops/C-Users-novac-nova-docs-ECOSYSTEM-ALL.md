/**
 * Market sentiment derived from mesh / synthetic liquidity.
 * Used when live DEX depth is unavailable so stables stay workable (swappable / transferable).
 */

export type SentimentLabel = 'strong' | 'steady' | 'thin' | 'weak'

export interface MarketSentiment {
  label: SentimentLabel
  /** 0–100 composite score */
  score: number
  /** Short UI copy */
  headline: string
  /** Whether pair is safe enough for stable swap / transfer UX */
  workable: boolean
  /** Source of depth numbers */
  mode: 'mesh' | 'sentiment'
}

export function scoreSentiment(opts: {
  liquidityUsd: number
  volume24hUsd: number
  isStable?: boolean
  fromBook?: boolean
}): MarketSentiment {
  const liq = Math.max(0, opts.liquidityUsd)
  const vol = Math.max(0, opts.volume24hUsd)
  const turnover = liq > 0 ? vol / liq : 0

  // Depth score (0–70) + turnover score (0–30)
  const depthScore = Math.min(70, (liq / 3_000_000) * 70)
  const turnScore = Math.min(30, turnover * 100)
  let score = Math.round(depthScore + turnScore)

  // Stables get a floor — peg markets should always look workable
  if (opts.isStable) score = Math.max(score, 62)
  // Curated mesh books with real depth are at least steady/workable
  if (opts.fromBook && liq >= 40_000) score = Math.max(score, 58)

  let label: SentimentLabel
  if (score >= 75) label = 'strong'
  else if (score >= 55) label = 'steady'
  else if (score >= 35) label = 'thin'
  else label = 'weak'

  const workable = opts.isStable ? score >= 55 : score >= 40
  const mode: 'mesh' | 'sentiment' = opts.fromBook ? 'mesh' : 'sentiment'

  const headline =
    label === 'strong'
      ? 'Deep liquidity · bullish flow'
      : label === 'steady'
        ? 'Healthy liquidity · neutral-to-positive'
        : label === 'thin'
          ? 'Thin books · trade smaller size'
          : 'Weak depth · prefer transfer / wait'

  return { label, score, headline, workable, mode }
}

export function sentimentTone(label: SentimentLabel): string {
  switch (label) {
    case 'strong':
      return 'text-nova-success'
    case 'steady':
      return 'text-nova-accent'
    case 'thin':
      return 'text-nova-muted'
    case 'weak':
      return 'text-nova-danger'
  }
}

export function pairSentiment(
  fromLiq: number,
  toLiq: number,
  fromVol: number,
  toVol: number,
  stablePair: boolean,
  fromBook: boolean,
): MarketSentiment {
  return scoreSentiment({
    liquidityUsd: Math.min(fromLiq, toLiq),
    volume24hUsd: (fromVol + toVol) / 2,
    isStable: stablePair,
    fromBook,
  })
}
