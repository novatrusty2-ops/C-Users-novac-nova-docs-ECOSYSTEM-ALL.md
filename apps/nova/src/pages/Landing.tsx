import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { BRAND } from '@/lib/brand'
import { ROUTES } from '@/lib/routes'

export function Landing() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col hero-gradient">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-nova-accent/15 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-[clamp(3.5rem,16vw,6rem)] font-extrabold leading-none tracking-tighter text-nova-ink animate-fade-up">
          NOVA
        </p>
        <p
          className="mt-3 text-sm font-medium tracking-wide text-nova-accent animate-fade-up"
          style={{ animationDelay: '60ms' }}
        >
          Wallet · Bank · Trade
        </p>
        <h1
          className="mt-4 max-w-xs font-display text-xl font-semibold text-nova-ink animate-fade-up"
          style={{ animationDelay: '120ms' }}
        >
          {BRAND.headline}
        </h1>
        <p
          className="mt-3 max-w-sm text-sm text-nova-muted animate-fade-up"
          style={{ animationDelay: '180ms' }}
        >
          OKX-style assets dashboard for NovaONE, NRW, and the mesh — separate from Signet Wallet.
        </p>
        <div className="mt-10 w-full max-w-xs space-y-3 animate-fade-up" style={{ animationDelay: '240ms' }}>
          <Link to={ROUTES.onboarding} className="block">
            <Button className="w-full">Create / import wallet</Button>
          </Link>
          <Link
            to={ROUTES.unlock}
            className="block text-center text-sm text-nova-muted hover:text-nova-accent"
          >
            I already have a wallet
          </Link>
        </div>
      </div>

      <footer className="relative z-10 pb-8 text-center text-[11px] text-nova-muted">
        {BRAND.name} · not Signet
      </footer>
    </section>
  )
}
