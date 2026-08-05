/** Collapse colon/semicolon runs so `11:11` matches listed `11::11`. */
function collapseSeparators(value: string): string {
  return value.replace(/[:;]+/g, ':')
}

function alnumKey(value: string): string {
  return value.replace(/[^A-Z0-9$]/gi, '').toUpperCase()
}

/** Token picker search — aliases like `11:11` / `11;11` match `11::11`. */
export function tokenMatchesSearch(symbol: string, query: string): boolean {
  const needle = query.trim().toUpperCase()
  if (!needle) return true
  const sym = symbol.toUpperCase()
  if (sym.includes(needle)) return true
  if (collapseSeparators(sym).includes(collapseSeparators(needle))) return true
  const digitsNeedle = alnumKey(needle)
  if (digitsNeedle && alnumKey(sym).includes(digitsNeedle)) return true
  return false
}
