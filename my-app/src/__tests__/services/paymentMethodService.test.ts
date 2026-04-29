/**
 * paymentMethodService.test.ts
 *
 * Tests for all payment method API service functions.
 * Covers both mock mode (NEXT_PUBLIC_USE_MOCK=true) and real API mode.
 */

export {};

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiDelete = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}));

// ── Shared fixtures ───────────────────────────────────────────────────────────

const VISA_METHOD = {
  id: "pm-uuid-1",
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2028,
  cardholderName: "Jane Doe",
  isDefault: true,
  createdAt: "2026-04-28T10:00:00.000Z",
};

const MC_METHOD = {
  id: "pm-uuid-2",
  brand: "mastercard",
  last4: "5555",
  expMonth: 6,
  expYear: 2027,
  cardholderName: null,
  isDefault: false,
  createdAt: "2026-03-01T08:00:00.000Z",
};

// ── Real API mode tests ───────────────────────────────────────────────────────

describe("paymentMethodService (real API mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";
  });

  // ── createSetupIntent ──────────────────────────────────────────────────────

  describe("createSetupIntent", () => {
    it("POSTs to /payment-methods/setup-intent and returns clientSecret", async () => {
      mockApiPost.mockResolvedValue({ data: { clientSecret: "seti_xxx_secret_yyy" } });

      const { createSetupIntent } = await import("@/src/services/paymentMethodService");
      const result = await createSetupIntent();

      expect(mockApiPost).toHaveBeenCalledWith("/payment-methods/setup-intent");
      expect(result.clientSecret).toBe("seti_xxx_secret_yyy");
    });

    it("propagates API errors", async () => {
      mockApiPost.mockRejectedValue(new Error("Stripe error"));

      const { createSetupIntent } = await import("@/src/services/paymentMethodService");
      await expect(createSetupIntent()).rejects.toThrow("Stripe error");
    });
  });

  // ── attachPaymentMethod ────────────────────────────────────────────────────

  describe("attachPaymentMethod", () => {
    it("POSTs to /payment-methods/attach with stripePaymentMethodId", async () => {
      mockApiPost.mockResolvedValue({ data: VISA_METHOD });

      const { attachPaymentMethod } = await import("@/src/services/paymentMethodService");
      const result = await attachPaymentMethod({
        stripePaymentMethodId: "pm_1NnBCc2eZvKYlo2CxwSUkEoc",
      });

      expect(mockApiPost).toHaveBeenCalledWith("/payment-methods/attach", {
        stripePaymentMethodId: "pm_1NnBCc2eZvKYlo2CxwSUkEoc",
      });
      expect(result.brand).toBe("visa");
      expect(result.last4).toBe("4242");
      expect(result.isDefault).toBe(true);
    });

    it("passes setAsDefault flag when provided", async () => {
      mockApiPost.mockResolvedValue({ data: { ...VISA_METHOD, isDefault: false } });

      const { attachPaymentMethod } = await import("@/src/services/paymentMethodService");
      await attachPaymentMethod({
        stripePaymentMethodId: "pm_test",
        setAsDefault: false,
      });

      expect(mockApiPost).toHaveBeenCalledWith("/payment-methods/attach", {
        stripePaymentMethodId: "pm_test",
        setAsDefault: false,
      });
    });

    it("throws 409 when payment method already saved", async () => {
      const conflictErr = { response: { status: 409, data: { message: "This payment method is already saved" } } };
      mockApiPost.mockRejectedValue(conflictErr);

      const { attachPaymentMethod } = await import("@/src/services/paymentMethodService");
      await expect(
        attachPaymentMethod({ stripePaymentMethodId: "pm_duplicate" }),
      ).rejects.toMatchObject({ response: { status: 409 } });
    });
  });

  // ── listPaymentMethods ─────────────────────────────────────────────────────

  describe("listPaymentMethods", () => {
    it("GETs /payment-methods and returns array", async () => {
      mockApiGet.mockResolvedValue({ data: [VISA_METHOD, MC_METHOD] });

      const { listPaymentMethods } = await import("@/src/services/paymentMethodService");
      const result = await listPaymentMethods();

      expect(mockApiGet).toHaveBeenCalledWith("/payment-methods");
      expect(result).toHaveLength(2);
      expect(result[0].brand).toBe("visa");
      expect(result[1].brand).toBe("mastercard");
    });

    it("returns empty array when no methods saved", async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      const { listPaymentMethods } = await import("@/src/services/paymentMethodService");
      const result = await listPaymentMethods();

      expect(result).toEqual([]);
    });
  });

  // ── setDefaultPaymentMethod ────────────────────────────────────────────────

  describe("setDefaultPaymentMethod", () => {
    it("POSTs to /payment-methods/:id/default", async () => {
      const updated = { ...MC_METHOD, isDefault: true };
      mockApiPost.mockResolvedValue({ data: updated });

      const { setDefaultPaymentMethod } = await import("@/src/services/paymentMethodService");
      const result = await setDefaultPaymentMethod("pm-uuid-2");

      expect(mockApiPost).toHaveBeenCalledWith("/payment-methods/pm-uuid-2/default");
      expect(result.isDefault).toBe(true);
      expect(result.id).toBe("pm-uuid-2");
    });

    it("throws 404 when payment method not found", async () => {
      mockApiPost.mockRejectedValue({
        response: { status: 404, data: { message: "Payment method not found" } },
      });

      const { setDefaultPaymentMethod } = await import("@/src/services/paymentMethodService");
      await expect(setDefaultPaymentMethod("nonexistent")).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });

  // ── deletePaymentMethod ────────────────────────────────────────────────────

  describe("deletePaymentMethod", () => {
    it("DELETEs /payment-methods/:id and returns empty object for normal case", async () => {
      mockApiDelete.mockResolvedValue({ data: {} });

      const { deletePaymentMethod } = await import("@/src/services/paymentMethodService");
      const result = await deletePaymentMethod("pm-uuid-1");

      expect(mockApiDelete).toHaveBeenCalledWith("/payment-methods/pm-uuid-1");
      expect(result).toEqual({});
      expect(result.subscriptionScheduledToCancel).toBeUndefined();
    });

    it("returns subscriptionScheduledToCancel when last card removed with active sub", async () => {
      const autoCancel = {
        subscriptionScheduledToCancel: true,
        expiresAt: "2026-05-28T00:00:00.000Z",
      };
      mockApiDelete.mockResolvedValue({ data: autoCancel });

      const { deletePaymentMethod } = await import("@/src/services/paymentMethodService");
      const result = await deletePaymentMethod("pm-uuid-1");

      expect(result.subscriptionScheduledToCancel).toBe(true);
      expect(result.expiresAt).toBe("2026-05-28T00:00:00.000Z");
    });

    it("handles null response data gracefully", async () => {
      mockApiDelete.mockResolvedValue({ data: null });

      const { deletePaymentMethod } = await import("@/src/services/paymentMethodService");
      const result = await deletePaymentMethod("pm-uuid-1");

      expect(result).toEqual({});
    });

    it("throws 404 when payment method not found", async () => {
      mockApiDelete.mockRejectedValue({
        response: { status: 404, data: { message: "Payment method not found" } },
      });

      const { deletePaymentMethod } = await import("@/src/services/paymentMethodService");
      await expect(deletePaymentMethod("nonexistent")).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});

// ── Mock mode tests ───────────────────────────────────────────────────────────

describe("paymentMethodService (mock mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "true";
  });

  it("createSetupIntent returns fake clientSecret without API call", async () => {
    const { createSetupIntent } = await import("@/src/services/paymentMethodService");
    const result = await createSetupIntent();

    expect(result.clientSecret).toBeTruthy();
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("listPaymentMethods returns mock data without API call", async () => {
    const { listPaymentMethods, _resetMockPaymentMethods } = await import(
      "@/src/services/paymentMethodService"
    );
    _resetMockPaymentMethods([
      {
        id: "pm_mock_001",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        cardholderName: "Mock User",
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const result = await listPaymentMethods();

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].brand).toBe("visa");
  });

  it("attachPaymentMethod adds a mock card without API call", async () => {
    const { attachPaymentMethod, listPaymentMethods, _resetMockPaymentMethods } = await import(
      "@/src/services/paymentMethodService"
    );
    _resetMockPaymentMethods([]);

    const added = await attachPaymentMethod({
      stripePaymentMethodId: "pm_mock_test_1234",
      setAsDefault: true,
    });

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(added.isDefault).toBe(true);

    const methods = await listPaymentMethods();
    expect(methods).toHaveLength(1);
    expect(methods[0].id).toBe(added.id);
  });

  it("setDefaultPaymentMethod promotes card to default without API call", async () => {
    const { setDefaultPaymentMethod, listPaymentMethods, _resetMockPaymentMethods } = await import(
      "@/src/services/paymentMethodService"
    );
    _resetMockPaymentMethods([
      {
        id: "pm_mock_001",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        cardholderName: null,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "pm_mock_002",
        brand: "mastercard",
        last4: "5555",
        expMonth: 6,
        expYear: 2027,
        cardholderName: null,
        isDefault: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    await setDefaultPaymentMethod("pm_mock_002");

    expect(mockApiPost).not.toHaveBeenCalled();
    const methods = await listPaymentMethods();
    const newDefault = methods.find((m) => m.id === "pm_mock_002");
    const oldDefault = methods.find((m) => m.id === "pm_mock_001");
    expect(newDefault?.isDefault).toBe(true);
    expect(oldDefault?.isDefault).toBe(false);
  });

  it("deletePaymentMethod removes card without API call", async () => {
    const { deletePaymentMethod, listPaymentMethods, _resetMockPaymentMethods } = await import(
      "@/src/services/paymentMethodService"
    );
    _resetMockPaymentMethods([
      {
        id: "pm_mock_001",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        cardholderName: null,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "pm_mock_002",
        brand: "mastercard",
        last4: "5555",
        expMonth: 6,
        expYear: 2027,
        cardholderName: null,
        isDefault: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    const result = await deletePaymentMethod("pm_mock_002");

    expect(mockApiDelete).not.toHaveBeenCalled();
    expect(result).toEqual({});

    const methods = await listPaymentMethods();
    expect(methods).toHaveLength(1);
    expect(methods[0].id).toBe("pm_mock_001");
  });

  it("deletePaymentMethod on last card returns subscriptionScheduledToCancel", async () => {
    const { deletePaymentMethod, _resetMockPaymentMethods } = await import(
      "@/src/services/paymentMethodService"
    );
    _resetMockPaymentMethods([
      {
        id: "pm_mock_001",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        cardholderName: null,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
    ]);

    const result = await deletePaymentMethod("pm_mock_001");

    expect(result.subscriptionScheduledToCancel).toBe(true);
    expect(result.expiresAt).toBeTruthy();
  });

  it("deletePaymentMethod promotes next card to default when default is removed", async () => {
    const { deletePaymentMethod, listPaymentMethods, _resetMockPaymentMethods } = await import(
      "@/src/services/paymentMethodService"
    );
    _resetMockPaymentMethods([
      {
        id: "pm_mock_001",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2030,
        cardholderName: null,
        isDefault: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: "pm_mock_002",
        brand: "mastercard",
        last4: "5555",
        expMonth: 6,
        expYear: 2027,
        cardholderName: null,
        isDefault: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    await deletePaymentMethod("pm_mock_001");
    const methods = await listPaymentMethods();
    expect(methods).toHaveLength(1);
    expect(methods[0].isDefault).toBe(true);
    expect(methods[0].id).toBe("pm_mock_002");
  });
});
