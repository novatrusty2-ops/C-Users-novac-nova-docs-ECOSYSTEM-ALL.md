import { useEnabledChains } from '@/hooks/useEnabledChains'
import { allKnownChains } from '@/lib/networks'

export function SettingsNetworkPage() {
  const { enabledIds, toggle } = useEnabledChains()
  const chains = allKnownChains().filter((c) => c.isDefault)

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl text-signet-gold-light">Networks</h1>
      <ul className="mt-4 divide-y divide-signet-border/40">
        {chains.map((chain) => (
          <li key={chain.id}>
            <label className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chain.iconColor }} />
                {chain.name}
              </span>
              <input
                type="checkbox"
                checked={enabledIds.includes(chain.id)}
                onChange={() => toggle(chain.id)}
                className="h-5 w-5 accent-signet-gold"
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
