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

// ─── Mock store ────────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let MOCK_METHODS: PaymentMethod[] = [
  {
    id: "pm_mock_001",
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2030,
    cardholderName: "Mock User",
    isDefault: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

let MOCK_ID_COUNTER = 2;

function mockId(): string {
  return `pm_mock_${String(MOCK_ID_COUNTER++).padStart(3, "0")}`;
}

// ─── API functions ─────────────────────────────────────────────────────────────

/**
 * Step 1 of adding a card.
 * Returns a Stripe SetupIntent clientSecret for use with Stripe.js.
 * In mock mode, returns a fake clientSecret.
 */
export const createSetupIntent = async (): Promise<SetupIntentResult> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return { clientSecret: "seti_mock_secret_test" };
  }
  const response = await api.post("/payment-methods/setup-intent");
  return response.data as SetupIntentResult;
};

/**
 * Step 2 of adding a card.
 * Attaches a confirmed Stripe PaymentMethod to the user's account.
 * In mock mode, creates a fake payment method entry.
 */
export const attachPaymentMethod = async (
  dto: AttachPaymentMethodDto,
): Promise<PaymentMethod> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const isFirst = MOCK_METHODS.length === 0;
    const makeDefault = dto.setAsDefault ?? isFirst;
    if (makeDefault) {
      MOCK_METHODS = MOCK_METHODS.map((m) => ({ ...m, isDefault: false }));
    }
    const newMethod: PaymentMethod = {
      id: mockId(),
      brand: "visa",
      last4: dto.stripePaymentMethodId.slice(-4).replace(/\D/g, "") || "4242",
      expMonth: 12,
      expYear: 2028,
      cardholderName: null,
      isDefault: makeDefault,
      createdAt: new Date().toISOString(),
    };
    MOCK_METHODS = makeDefault
      ? [newMethod, ...MOCK_METHODS]
      : [...MOCK_METHODS, newMethod];
    return newMethod;
  }
  const response = await api.post("/payment-methods/attach", dto);
  return response.data as PaymentMethod;
};

/**
 * List all saved payment methods for the current user.
 * Returns default-first, then newest-first.
 */
export const listPaymentMethods = async (): Promise<PaymentMethod[]> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return [...MOCK_METHODS];
  }
  const response = await api.get("/payment-methods");
  return response.data as PaymentMethod[];
};

/**
 * Set a payment method as the default.
 */
export const setDefaultPaymentMethod = async (id: string): Promise<PaymentMethod> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    MOCK_METHODS = MOCK_METHODS.map((m) => ({ ...m, isDefault: m.id === id }));
    const updated = MOCK_METHODS.find((m) => m.id === id);
    if (!updated) throw new Error("Payment method not found");
    // Re-sort: default first
    MOCK_METHODS = [
      ...MOCK_METHODS.filter((m) => m.isDefault),
      ...MOCK_METHODS.filter((m) => !m.isDefault),
    ];
    return updated;
  }
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
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    const target = MOCK_METHODS.find((m) => m.id === id);
    if (!target) throw new Error("Payment method not found");

    const wasDefault = target.isDefault;
    const wasLast = MOCK_METHODS.length === 1;

    MOCK_METHODS = MOCK_METHODS.filter((m) => m.id !== id);

    // Promote next card to default if the deleted one was default
    if (wasDefault && MOCK_METHODS.length > 0) {
      MOCK_METHODS[0] = { ...MOCK_METHODS[0], isDefault: true };
    }

    if (wasLast) {
      return {
        subscriptionScheduledToCancel: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    return {};
  }
  const response = await api.delete(`/payment-methods/${id}`);
  return (response.data ?? {}) as DeletePaymentMethodResult;
};

/** Reset mock data - used in tests only */
export const _resetMockPaymentMethods = (methods: PaymentMethod[] = []): void => {
  MOCK_METHODS = methods;
  MOCK_ID_COUNTER = 2;
};
