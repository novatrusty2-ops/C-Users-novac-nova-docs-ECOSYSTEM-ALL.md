/** Trim only fractional trailing zeros; never chop integer zeros (`110` stays `110`). */
export function trimHumanAmount(value: string): string {
  if (!value.includes('.')) return value
  return value.replace(/\.?0+$/, '')
}
