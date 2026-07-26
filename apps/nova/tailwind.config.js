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
        novaone: '#34D399',
        nrw: '#0ECB81',
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        heading: ['"Sora"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        teal: '0 0 0 1px rgba(14,203,129,0.4), 0 8px 32px rgba(4,20,15,0.55)',
        soft: '0 10px 40px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'teal-gradient': 'var(--teal-gradient)',
        'nova-atmosphere':
          'radial-gradient(1200px 600px at 50% -10%, rgba(14,203,129,0.32), transparent 55%), radial-gradient(800px 400px at 80% 20%, rgba(52,211,153,0.16), transparent 50%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-teal': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(14,203,129,0.45)' },
          '50%': { boxShadow: '0 0 0 10px rgba(14,203,129,0)' },
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
