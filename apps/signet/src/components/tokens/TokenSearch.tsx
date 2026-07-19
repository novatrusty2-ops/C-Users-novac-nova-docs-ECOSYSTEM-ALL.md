interface TokenSearchProps {
  value: string
  onChange: (value: string) => void
}

export function TokenSearch({ value, onChange }: TokenSearchProps) {
  return (
    <input
      type="search"
      placeholder="Search tokens…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field"
    />
  )
}
