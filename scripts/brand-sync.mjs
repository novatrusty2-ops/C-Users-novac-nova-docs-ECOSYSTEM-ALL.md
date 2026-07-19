#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const tokensPath = path.join(root, 'branding/brand-tokens.json')
const outTs = path.join(root, 'src/lib/brand.generated.ts')
const outCss = path.join(root, 'src/brand/tokens.css')

const raw = fs.readFileSync(tokensPath, 'utf8')
const json = JSON.parse(raw)

const colors = json.colors ?? {}
const chainColors = json.chainColors ?? {}

const ts = `/** Auto-synced from branding/brand-tokens.json — do not hand-edit; run npm run brand:sync */
export const BRAND = {
  name: ${JSON.stringify(json.name ?? 'Signet Wallet')},
  shortName: 'Signet',
  domain: ${JSON.stringify(json.domain ?? 'signetwallet.com')},
  organization: ${JSON.stringify(json.organization ?? 'Anakatech')},
  colors: {
    bg: ${JSON.stringify(colors.bg)},
    bgAlt: ${JSON.stringify(colors.bgAlt)},
    bgDeep: ${JSON.stringify(colors.bgDeep)},
    surface: ${JSON.stringify(colors.surface)},
    surfaceRaised: ${JSON.stringify(colors.surfaceRaised)},
    gold: ${JSON.stringify(colors.gold)},
    goldLight: ${JSON.stringify(colors.goldLight)},
    goldBright: ${JSON.stringify(colors.goldBright)},
    goldMuted: ${JSON.stringify(colors.goldMuted)},
    goldDim: ${JSON.stringify(colors.goldDim)},
    ink: ${JSON.stringify(colors.ink)},
    inkMuted: ${JSON.stringify(colors.inkMuted)},
    inkDim: ${JSON.stringify(colors.inkDim)},
    burgundy: ${JSON.stringify(colors.burgundy)},
    burgundyBright: ${JSON.stringify(colors.burgundyBright)},
    burgundyDark: ${JSON.stringify(colors.burgundyDark)},
    cream: ${JSON.stringify(colors.cream ?? colors.ink)},
    danger: ${JSON.stringify(colors.danger)},
    success: ${JSON.stringify(colors.success)},
  },
  chainColors: {
    novaone: ${JSON.stringify(chainColors.novaone)},
    nrw: ${JSON.stringify(chainColors.nrw)},
    anakachain: ${JSON.stringify(chainColors.anakachain)},
    defiOracle: ${JSON.stringify(chainColors.defiOracle)},
    alltra: ${JSON.stringify(chainColors.alltra)},
  },
} as const
`

const css = `:root {
  --color-bg: ${colors.bg};
  --color-bg-alt: ${colors.bgAlt};
  --color-bg-deep: ${colors.bgDeep};
  --color-surface: ${colors.surface};
  --color-surface-raised: ${colors.surfaceRaised};
  --color-gold: ${colors.gold};
  --color-gold-light: ${colors.goldLight};
  --color-gold-bright: ${colors.goldBright};
  --color-gold-muted: ${colors.goldMuted};
  --color-gold-dim: ${colors.goldDim};
  --color-ink: ${colors.ink};
  --color-ink-muted: ${colors.inkMuted};
  --color-ink-dim: ${colors.inkDim};
  --color-burgundy: ${colors.burgundy};
  --color-burgundy-bright: ${colors.burgundyBright};
  --color-burgundy-dark: ${colors.burgundyDark};
  --color-border: ${colors.border ?? 'rgba(201, 168, 76, 0.22)'};
  --color-danger: ${colors.danger};
  --color-success: ${colors.success};
  --gold-gradient: linear-gradient(135deg, ${colors.gold} 0%, ${colors.goldBright ?? colors.goldLight} 50%, ${colors.gold} 100%);
  --font-display: "${json.fonts?.display ?? 'Cormorant Garamond'}", Georgia, serif;
  --font-heading: "${json.fonts?.display ?? 'Cormorant Garamond'}", system-ui, sans-serif;
  --font-body: "${json.fonts?.body ?? 'DM Sans'}", system-ui, sans-serif;
  --font-mono: "${json.fonts?.mono ?? 'JetBrains Mono'}", ui-monospace, monospace;
}
`

fs.writeFileSync(outTs, ts)
fs.writeFileSync(outCss, css)
console.log('brand:sync →', path.relative(root, outTs), path.relative(root, outCss))
