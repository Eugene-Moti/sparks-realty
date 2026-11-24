/**
 * Online payments — DEFERRED (owner decision).
 *
 * Short stays currently use "Request to book" (an enquiry) and "Book on
 * WhatsApp"; staff confirm availability and send payment details by hand.
 * This module is only a typed seam so M-Pesa (Daraja STK Push) or Paystack can
 * be plugged in later without touching the booking UI. No SDKs, keys or
 * payment UI are included, and nothing calls `getPaymentProvider()` yet.
 */

export type PaymentProviderId = "mpesa_daraja" | "paystack";

export type PaymentCurrency = "KES" | "USD";

export type PaymentRequest = {
  /** The enquiry this payment settles (enquiries.id). */
  enquiryId: string;
  amount: number;
  currency: PaymentCurrency;
  /** Shown to the payer, e.g. "SP-0012 · 3 nights". */
  description: string;
  /** Payer phone in E.164 (M-Pesa STK Push) and/or email (Paystack). */
  phone?: string;
  email?: string;
};

export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";

export type PaymentSession = {
  provider: PaymentProviderId;
  /** Provider reference (CheckoutRequestID / Paystack reference). */
  reference: string;
  status: PaymentStatus;
  /** Paystack: hosted checkout URL. M-Pesa: none (the prompt appears on the phone). */
  redirectUrl?: string;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  /** Start a payment (STK Push / Paystack transaction initialise). */
  createPayment(request: PaymentRequest): Promise<PaymentSession>;
  /** Look up the latest status (used by the webhook/callback and polling). */
  getStatus(reference: string): Promise<PaymentStatus>;
}

export class PaymentsNotEnabledError extends Error {
  constructor() {
    super("Online payments are not enabled. Short stays are booked by request and confirmed by the team.");
    this.name = "PaymentsNotEnabledError";
  }
}

/** Flip to true only when a provider is implemented, keyed and approved by the owner. */
export const PAYMENTS_ENABLED = false as const;

const notEnabled: PaymentProvider = {
  id: "mpesa_daraja",
  async createPayment() {
    throw new PaymentsNotEnabledError();
  },
  async getStatus() {
    throw new PaymentsNotEnabledError();
  },
};

/** The configured provider. Today: a stub that always throws PaymentsNotEnabledError. */
export function getPaymentProvider(): PaymentProvider {
  return notEnabled;
}
