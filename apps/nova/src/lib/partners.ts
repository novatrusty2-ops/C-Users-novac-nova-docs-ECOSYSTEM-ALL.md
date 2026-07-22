/** Ecosystem partner integrations for Nova Wallet */

export interface PartnerWallet {
  id: string
  name: string
  role: string
  url: string
  secondaryUrl?: string
  accent: string
  /** Same HD address works across these chain IDs */
  sharedChains: number[]
  notes: string
}

export const PARTNERS: PartnerWallet[] = [
  {
    id: 'pouchpay',
    name: 'PouchPay Wallet',
    role: 'ALLTRA / PouchPay payments wallet',
    url: 'https://play.google.com/store/apps/details?id=global.alltra.app',
    secondaryUrl: 'https://alltra.global/',
    accent: '#E8D48B',
    sharedChains: [651940, 22016, 33001, 138],
    notes:
      'PouchPay-Alltra is the ALLTRA ecosystem wallet. Enable Alltra Global World (651940) and DeFi Oracle (138) in Nova Networks, then use the same EVM address for PouchPay / custody deposits when supported.',
  },
  {
    id: 'novapay',
    name: 'NovaPay Sandbox',
    role: 'Nova Bank fiat payout partner sandbox (EUR)',
    url: 'https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/status',
    secondaryUrl:
      'https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/manifest',
    accent: '#14B8A6',
    sharedChains: [22016, 33001, 138, 9001],
    notes:
      'NovaPay sandbox is wired to Nova Bank Online on Railway (receive/send/callback/events — no live funds). Run npm run test:novapay. Client onboarding pack: docs/novapay-onboarding.md (awaiting external provider invite).',
  },
]

export const ECOSYSTEM_LINKS = {
  novaBank: 'https://nova-bank-api-production-7311.up.railway.app',
  novaSwap: 'https://nova-bank-api-production-7311.up.railway.app/swap',
  novaOneExplorer: 'https://novaone.anakatech.llc/',
  nrwCentralBank: 'https://nrw-central-bank-api-production.up.railway.app',
  walletNetworksApi: 'https://nova-bank-api-production-7311.up.railway.app/api/v1/wallet/networks',
  ecosystemTokensApi:
    'https://nova-bank-api-production-7311.up.railway.app/api/v1/chains/ecosystem/tokens',
  partnersStatus:
    'https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/status',
  novaPaySandbox:
    'https://nova-bank-api-production-7311.up.railway.app/api/v1/partners/novapay/sandbox/status',
  defiOracleWallet: 'https://wallet.defi-oracle.io/wallet/',
} as const

export function getPartner(id: string): PartnerWallet | undefined {
  return PARTNERS.find((p) => p.id === id)
}
