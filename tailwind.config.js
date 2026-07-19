/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        signet: {
          bg: 'var(--color-bg)',
          'bg-alt': 'var(--color-bg-alt)',
          'bg-deep': 'var(--color-bg-deep)',
          surface: 'var(--color-surface)',
          'surface-raised': 'var(--color-surface-raised)',
          gold: 'var(--color-gold)',
          'gold-light': 'var(--color-gold-light)',
          'gold-bright': 'var(--color-gold-bright)',
          'gold-muted': 'var(--color-gold-muted)',
          'gold-dim': 'var(--color-gold-dim)',
          ink: 'var(--color-ink)',
          'ink-muted': 'var(--color-ink-muted)',
          'ink-dim': 'var(--color-ink-dim)',
          burgundy: 'var(--color-burgundy)',
          'burgundy-bright': 'var(--color-burgundy-bright)',
          'burgundy-dark': 'var(--color-burgundy-dark)',
          border: 'var(--color-border)',
          danger: 'var(--color-danger)',
          success: 'var(--color-success)',
        },
        novaone: '#8B5CF6',
        nrw: '#A855F7',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        heading: ['"Cormorant Garamond"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(201,168,76,0.35), 0 8px 32px rgba(26,10,10,0.45)',
        soft: '0 10px 40px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'gold-gradient': 'var(--gold-gradient)',
        'regal-radial':
          'radial-gradient(1200px 600px at 50% -10%, rgba(140,42,62,0.45), transparent 55%), radial-gradient(800px 400px at 80% 20%, rgba(201,168,76,0.12), transparent 50%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.35)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201,168,76,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s ease-out both',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-gold': 'pulseGold 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
