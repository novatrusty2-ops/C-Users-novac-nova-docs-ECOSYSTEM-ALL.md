/**
 * INTEGRATION SNIPPET — GET /api/v1/accounts/:accountNumber
 *
 * After building the public account object, attach hasWallet:
 *
 *   return this.walletIntegrity.enrichAccountLookup({
 *     accountNumber: account.accountNumber,
 *     id: account.id,           // include when available
 *     iban: account.iban,
 *     swiftBic: account.swiftBic,
 *     currency: account.currency,
 *     label: account.label,
 *     protocol: account.protocol,
 *     isOwn: account.userId === req.user.id,
 *   });
 *
 * Response shape:
 *   { ..., "hasWallet": true | false }
 */
export {};
