import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { BRAND } from '@/lib/brand'
import { ROUTES } from '@/lib/routes'

export function Landing() {
  return (
    <section className="relative min-h-[100dvh] hero-gradient flex flex-col">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-nova-accent/20 blur-3xl animate-pulse-teal" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-nova-highlight/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p
          className="font-display text-[clamp(4rem,18vw,7rem)] font-extrabold leading-none tracking-tighter text-transparent bg-clip-text bg-teal-gradient animate-fade-up"
          style={{ animationDelay: '0ms' }}
        >
          NOVA
        </p>
        <h1
          className="mt-4 font-display text-2xl sm:text-3xl font-semibold text-nova-ink animate-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          {BRAND.headline}
        </h1>
        <p
          className="mt-3 max-w-sm text-nova-muted text-base animate-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          Mobile signer for NovaONE and NRW World. Swap stables, track balances, sign on the mesh.
        </p>
        <div className="mt-10 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <Link to={ROUTES.onboarding}>
            <Button className="min-w-[200px] animate-pulse-teal">Open wallet</Button>
          </Link>
        </div>
      </div>

      <footer className="relative z-10 pb-8 text-center text-xs text-nova-muted">
        {BRAND.name} · {BRAND.bundleId}
      </footer>
    </section>
  )
}
