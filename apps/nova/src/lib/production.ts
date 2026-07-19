/** Nova Wallet production — fully separate host from Signet Wallet */
export const NOVA_PRODUCTION = {
  url: 'https://novablockchain.it.com/',
  separateFrom: {
    product: 'Signet Wallet',
    canonical: 'https://signetwallet.com',
    note: 'Signet is not hosted on novablockchain.it.com — partner link only',
  },
} as const
