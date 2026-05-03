import api from "./api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  cardholderName: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface SetupIntentResult {
  clientSecret: string;
}

export interface AttachPaymentMethodDto {
  stripePaymentMethodId: string;
  setAsDefault?: boolean;
}

export interface DeletePaymentMethodResult {
  subscriptionScheduledToCancel?: boolean;
  expiresAt?: string;
}


// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * Step 1 of adding a card.
 * Returns a Stripe SetupIntent clientSecret for use with Stripe.js.
 */
export const createSetupIntent = async (): Promise<SetupIntentResult> => {
  const response = await api.post("/payment-methods/setup-intent");
  return response.data as SetupIntentResult;
};

/**
 * Step 2 of adding a card.
 * Attaches a confirmed Stripe PaymentMethod to the user's account.
 */
export const attachPaymentMethod = async (
  dto: AttachPaymentMethodDto,
): Promise<PaymentMethod> => {
  const response = await api.post("/payment-methods/attach", dto);
  return response.data as PaymentMethod;
};

/**
 * List all saved payment methods for the current user.
 * Returns default-first, then newest-first.
 */
export const listPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await api.get("/payment-methods");
  return response.data as PaymentMethod[];
};

/**
 * Set a payment method as the default.
 */
export const setDefaultPaymentMethod = async (id: string): Promise<PaymentMethod> => {
  const response = await api.post(`/payment-methods/${id}/default`);
  return response.data as PaymentMethod;
};

/**
 * Delete a saved payment method.
 * If the last card is removed while subscribed, the backend auto-schedules
 * subscription cancellation and returns { subscriptionScheduledToCancel, expiresAt }.
 */
export const deletePaymentMethod = async (
  id: string,
): Promise<DeletePaymentMethodResult> => {
  const response = await api.delete(`/payment-methods/${id}`);
  return (response.data ?? {}) as DeletePaymentMethodResult;
};

/** Backwards-compatible test helper; payment state now comes from the backend. */
export const _resetMockPaymentMethods = (_methods: PaymentMethod[] = []): void => {
  void _methods;
};
