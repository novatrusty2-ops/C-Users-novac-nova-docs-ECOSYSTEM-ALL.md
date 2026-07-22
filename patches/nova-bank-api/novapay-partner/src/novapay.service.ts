import { HttpException, HttpStatus } from '@nestjs/common';
import { createNovaPayClient } from './novapay.client.mjs';
import {
  assertNovaPayReady,
  loadNovaPayConfig,
  redactConfig,
} from './novapay.config.mjs';
import {
  extractSignatureHeader,
  verifyNovaPayWebhookSignature,
} from './novapay.webhook.mjs';

export type NovaPayLedgerHook = {
  onVerifiedEvent?: (event: unknown) => Promise<void> | void;
};

export function assertAdminKey(
  provided: string | undefined,
  expected: string | undefined,
) {
  if (!expected || !provided || provided !== expected) {
    throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
  }
}

export class NovaPayService {
  private readonly ledger: NovaPayLedgerHook;

  constructor(ledger?: NovaPayLedgerHook) {
    this.ledger = ledger ?? {};
  }

  getConfigSummary() {
    const config = loadNovaPayConfig();
    return {
      partner: 'novapay',
      wiredToNovaBank: true,
      ...redactConfig(config),
    };
  }

  async health() {
    const config = loadNovaPayConfig();
    assertNovaPayReady(config);
    const client = createNovaPayClient(config);
    const status = await client.status();
    return {
      ok: Boolean(status?.enabled && status?.configured),
      status,
      config: redactConfig(config),
    };
  }

  async receive(payload: Record<string, unknown>) {
    const config = loadNovaPayConfig();
    assertNovaPayReady(config);
    return createNovaPayClient(config).receive(payload);
  }

  async send(payload: Record<string, unknown>) {
    const config = loadNovaPayConfig();
    assertNovaPayReady(config);
    return createNovaPayClient(config).send(payload);
  }

  async events() {
    const config = loadNovaPayConfig();
    assertNovaPayReady(config);
    return createNovaPayClient(config).events();
  }

  async handleWebhook(options: {
    rawBody: string | Buffer;
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
  }) {
    const config = loadNovaPayConfig();
    const signatureHeader = extractSignatureHeader(options.headers);
    const verified = verifyNovaPayWebhookSignature({
      secret: config.webhookSecret,
      signatureHeader,
      rawBody: options.rawBody,
    });
    if (!verified.ok) {
      throw new HttpException(
        { accepted: false, reason: verified.reason },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (this.ledger.onVerifiedEvent) {
      await this.ledger.onVerifiedEvent(options.body);
    }
    return {
      accepted: true,
      partner: 'novapay',
      matched: verified.matched,
      message: 'NovaPay webhook received',
    };
  }
}
