/** Nova Wallet production — separate product & path from Signet Wallet */
export const NOVA_PRODUCTION = {
  /** Nova owns the Pages apex */
  url: 'https://novablockchain.it.com/',
  /** Signet is a different product (subpath mirror + canonical domain) */
  separateFrom: {
    product: 'Signet Wallet',
    pagesMirror: 'https://novablockchain.it.com/signet/',
    canonical: 'https://signetwallet.com',
  },
} as const
