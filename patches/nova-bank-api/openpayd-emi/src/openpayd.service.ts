import { Injectable, Logger } from '@nestjs/common';
import {
  loadOpenPaydConfig,
  redactConfig,
} from './openpayd.config.mjs';
import { OpenPaydClient } from './openpayd.client.mjs';
import {
  extractSignatureHeader,
  verifyOpenPaydWebhookSignature,
} from './openpayd.webhook.mjs';

export type OpenPaydConfig = ReturnType<typeof loadOpenPaydConfig>;

export interface OpenPaydLedgerHook {
  /**
   * Called after a verified OpenPayd webhook. Implement against Nova ledger.
   * Default no-op keeps the patch installable without host adapters.
   */
  onVerifiedEvent?(event: {
    provider: 'openpayd';
    eventType: string;
    payload: unknown;
    rawBody: string;
  }): Promise<void> | void;
}

@Injectable()
export class OpenPaydService {
  private readonly logger = new Logger(OpenPaydService.name);
  private readonly config: OpenPaydConfig;
  private readonly client: OpenPaydClient;
  private readonly ledger?: OpenPaydLedgerHook;

  constructor(ledger?: OpenPaydLedgerHook) {
    this.ledger = ledger;
    this.config = loadOpenPaydConfig();
    this.client = new OpenPaydClient(this.config);
  }

  getConfigSummary() {
    return {
      provider: 'openpayd',
      legalEntity: this.config.legalEntity,
      novaCatalogId: 'openpayd',
      novaConfigHint: 'EMI_OPENPAYD_API_KEY',
      ...redactConfig(this.config),
      configured: Boolean(
        this.config.username &&
          this.config.password &&
          this.config.accountHolderId,
      ),
    };
  }

  async health() {
    const summary = this.getConfigSummary();
    if (!summary.configured) {
      return {
        ok: false,
        status: 'not_configured',
        ...summary,
        hint: 'Set OPENPAYD_USERNAME, OPENPAYD_PASSWORD (or EMI_OPENPAYD_API_KEY), OPENPAYD_ACCOUNT_HOLDER_ID on Railway',
      };
    }
    try {
      const token = await this.client.getAccessToken(true);
      const accounts = await this.client.listAccounts({
        currency: this.config.settlementCurrency,
      });
      return {
        ok: true,
        status: 'connected',
        ...summary,
        oauth: {
          tokenType: token.token_type ?? 'bearer',
          accountHolderId:
            token.accountHolderId ?? this.config.accountHolderId,
        },
        accountsPreview: Array.isArray(accounts)
          ? { count: accounts.length }
          : { shape: typeof accounts },
      };
    } catch (err) {
      this.logger.error(
        `OpenPayd health failed: ${err instanceof Error ? err.message : err}`,
      );
      return {
        ok: false,
        status: 'error',
        ...summary,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  listAccounts(currency?: string) {
    return this.client.listAccounts({
      currency: currency || this.config.settlementCurrency,
    });
  }

  getDefaultAccount() {
    if (!this.config.accountId) {
      throw new Error('OPENPAYD_ACCOUNT_ID not set');
    }
    return this.client.getAccount(this.config.accountId);
  }

  async handleWebhook(options: {
    rawBody: string | Buffer;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
  }) {
    const signatureHeader = extractSignatureHeader(options.headers);
    const raw =
      typeof options.rawBody === 'string'
        ? options.rawBody
        : options.rawBody.toString('utf8');

    if (this.config.webhookSecret) {
      const verified = verifyOpenPaydWebhookSignature({
        rawBody: raw,
        signatureHeader,
        secret: this.config.webhookSecret,
      });
      if (!verified.ok) {
        return {
          accepted: false,
          provider: 'openpayd',
          reason: verified.reason ?? 'invalid_signature',
        };
      }
    } else {
      this.logger.warn(
        'OPENPAYD_WEBHOOK_SECRET unset — accepting webhook without signature verify (dev only)',
      );
    }

    const eventType =
      (options.body as { eventType?: string; type?: string } | null)
        ?.eventType ||
      (options.body as { type?: string } | null)?.type ||
      'unknown';

    await this.ledger?.onVerifiedEvent?.({
      provider: 'openpayd',
      eventType,
      payload: options.body,
      rawBody: raw,
    });

    return {
      accepted: true,
      provider: 'openpayd',
      eventType,
      legalEntity: this.config.legalEntity,
    };
  }
}

export function assertAdminKey(
  provided: string | undefined,
  expected: string | undefined,
): void {
  if (!expected || !provided || provided !== expected) {
    const err = new Error('Unauthorized');
    (err as Error & { statusCode?: number }).statusCode = 401;
    throw err;
  }
}
