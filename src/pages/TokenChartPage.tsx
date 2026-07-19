import { useParams, Link } from 'react-router-dom'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useVisibleTokenRows } from '@/hooks/useVisibleTokenRows'
import { ROUTES } from '@/lib/routes'

const MOCK = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  price: 0.95 + Math.sin(i / 2) * 0.08 + i * 0.002,
}))

export function TokenChartPage() {
  const { symbol } = useParams()
  const rows = useVisibleTokenRows()
  const row = rows.find((r) => r.symbol.toLowerCase() === (symbol ?? '').toLowerCase())

  return (
    <div className="page-container animate-fade-up">
      <Link to={ROUTES.tokens} className="text-sm text-signet-gold-muted hover:text-signet-gold">
        ← Tokens
      </Link>
      <h1 className="mt-4 font-display text-3xl text-signet-gold-light">
        {row?.symbol ?? symbol} chart
      </h1>
      <div className="card-interactive mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK}>
            <defs>
              <linearGradient id="chartGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8C2A3E" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#8C2A3E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#7A6E65" fontSize={11} />
            <YAxis stroke="#7A6E65" fontSize={11} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#2E1418', border: '1px solid rgba(201,168,76,0.22)' }} />
            <Area type="monotone" dataKey="price" stroke="#C9A84C" fill="url(#chartGold)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
