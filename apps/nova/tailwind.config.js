/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nova: {
          bg: 'var(--color-bg)',
          'bg-alt': 'var(--color-bg-alt)',
          surface: 'var(--color-surface)',
          'surface-raised': 'var(--color-surface-raised)',
          accent: 'var(--color-accent)',
          highlight: 'var(--color-highlight)',
          ink: 'var(--color-ink)',
          muted: 'var(--color-muted)',
          border: 'var(--color-border)',
          danger: 'var(--color-danger)',
          success: 'var(--color-success)',
        },
        novaone: '#0EA5E9',
        nrw: '#14B8A6',
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        heading: ['"Sora"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        teal: '0 0 0 1px rgba(20,184,166,0.35), 0 8px 32px rgba(7,20,34,0.55)',
        soft: '0 10px 40px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'teal-gradient': 'var(--teal-gradient)',
        'nova-atmosphere':
          'radial-gradient(1200px 600px at 50% -10%, rgba(20,184,166,0.28), transparent 55%), radial-gradient(800px 400px at 80% 20%, rgba(34,211,238,0.12), transparent 50%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-teal': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(20,184,166,0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(20,184,166,0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s ease-out both',
        'pulse-teal': 'pulse-teal 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
