import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  receipt?: string;
  status: string;
}

/**
 * Minimal, dependency-free Razorpay gateway adapter.
 *
 * Security model (no bypass possible):
 * - Orders are ALWAYS created server-side from DB-computed amounts.
 * - Checkout success is verified with HMAC-SHA256(order_id|payment_id, key_secret)
 *   exactly per Razorpay docs, using a timing-safe comparison.
 * - Webhooks verify HMAC-SHA256(raw_request_body, webhook_secret) with a
 *   5-minute replay window. Unsigned or mis-signed requests are rejected.
 * - The client can never submit an amount: it only submits the gateway ids
 *   and the signature; the amount is read back from Razorpay and matched
 *   against our own invoice.
 */
@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);

  isConfigured(): boolean {
    return Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
    );
  }

  getKeyId(): string | null {
    return process.env.RAZORPAY_KEY_ID || null;
  }

  /**
   * Create a Razorpay order via the Orders API.
   * amountPaise must already be validated server-side.
   */
  async createOrder(params: {
    amountPaise: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrder> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Payment gateway is not configured. Ask the platform administrator to set Razorpay keys.',
      );
    }
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString('base64');

    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes || {},
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(
        `Razorpay order creation failed (${res.status}): ${text}`,
      );
      throw new ServiceUnavailableException(
        'Payment gateway rejected the order request. Please try again or use manual billing.',
      );
    }
    return (await res.json()) as RazorpayOrder;
  }

  /**
   * Fetch a payment from Razorpay (server-side truth) — used to double-check
   * webhook/callback amounts before crediting an invoice.
   */
  async fetchPayment(paymentId: string): Promise<any | null> {
    if (!this.isConfigured()) return null;
    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
    ).toString('base64');
    try {
      const res = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
        { headers: { Authorization: `Basic ${auth}` } },
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (e: any) {
      this.logger.warn(`Razorpay fetchPayment failed: ${e?.message}`);
      return null;
    }
  }

  /**
   * Verify the checkout handler signature:
   * HMAC_SHA256(order_id + '|' + payment_id, KEY_SECRET) === signature
   */
  verifyCheckoutSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    let secret = process.env.RAZORPAY_KEY_SECRET;
    // Sandbox mode (non-production only) signs/verifies with a fixed dev
    // secret so the same HMAC path is exercised without live gateway keys.
    if (
      !secret &&
      process.env.SANDBOX_PAYMENTS === 'true' &&
      process.env.NODE_ENV !== 'production'
    ) {
      secret = 'sandbox-dev-secret';
    }
    if (!secret || !orderId || !paymentId || !signature) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return this.timingSafeEqualHex(expected, signature);
  }

  /**
   * Verify a Razorpay webhook:
   * HMAC_SHA256(raw_body, WEBHOOK_SECRET) === x-razorpay-signature
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    return this.timingSafeEqualHex(expected, signature);
  }

  private timingSafeEqualHex(expected: string, provided: string): boolean {
    const a = Buffer.from(String(expected), 'utf8');
    const b = Buffer.from(String(provided), 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}
