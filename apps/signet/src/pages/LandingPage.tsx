import { Link } from 'react-router-dom'
import { BRAND, brandMarkUrl } from '@/lib/brand'
import { ROUTES } from '@/lib/routes'
import { Button } from '@/components/common/Button'

export function LandingPage() {
  return (
    <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-regal-radial opacity-90"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-signet-burgundy/25 via-transparent to-signet-bg-deep" />
      <div
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-novaone/20 blur-3xl animate-pulse-gold"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-1/4 h-64 w-64 rounded-full bg-nrw/15 blur-3xl"
        aria-hidden
      />
      <div className="relative z-10 animate-fade-up max-w-xl space-y-8">
        <img
          src={brandMarkUrl()}
          alt=""
          className="mx-auto h-20 w-20 rounded-2xl ring-1 ring-signet-gold/40 shadow-gold animate-pulse-gold"
        />
        <div className="space-y-3">
          <p className="font-display text-6xl tracking-[0.08em] text-signet-gold-bright md:text-7xl">
            {BRAND.shortName}
          </p>
          <h1 className="font-heading text-xl text-signet-ink md:text-2xl">
            Self-custody, regal by design
          </h1>
          <p className="text-base text-signet-ink-muted">
            Multi-chain wallet for NovaOne, NRW World, and the Anaka mesh.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to={ROUTES.onboarding}>
            <Button shimmer className="text-base px-8 py-3">
              Open Wallet
            </Button>
          </Link>
          <Link
            to={ROUTES.import}
            className="text-sm text-signet-gold-muted underline-offset-4 hover:text-signet-gold hover:underline"
          >
            Import existing
          </Link>
        </div>
      </div>
    </section>
  )
}
