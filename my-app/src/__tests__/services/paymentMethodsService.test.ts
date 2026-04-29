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

describe("paymentMethodsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a setup intent", async () => {
    mockApiPost.mockResolvedValue({
      data: { clientSecret: "seti_test_secret" },
    });
    const { createSetupIntent } = await import(
      "@/src/services/paymentMethodsService"
    );

    const result = await createSetupIntent();

    expect(mockApiPost).toHaveBeenCalledWith("/payment-methods/setup-intent");
    expect(result.clientSecret).toBe("seti_test_secret");
  });

  it("attaches a confirmed payment method", async () => {
    mockApiPost.mockResolvedValue({
      data: { id: "pm_saved_1", isDefault: true },
    });
    const { attachPaymentMethod } = await import(
      "@/src/services/paymentMethodsService"
    );

    const result = await attachPaymentMethod({
      paymentMethodId: "pm_stripe_1",
      setAsDefault: true,
    });

    expect(mockApiPost).toHaveBeenCalledWith("/payment-methods/attach", {
      paymentMethodId: "pm_stripe_1",
      setAsDefault: true,
    });
    expect(result.id).toBe("pm_saved_1");
  });

  it("lists payment methods", async () => {
    mockApiGet.mockResolvedValue({
      data: [{ id: "pm_saved_1" }, { id: "pm_saved_2" }],
    });
    const { listPaymentMethods } = await import(
      "@/src/services/paymentMethodsService"
    );

    const result = await listPaymentMethods();

    expect(mockApiGet).toHaveBeenCalledWith("/payment-methods");
    expect(result).toHaveLength(2);
  });

  it("sets a payment method as default", async () => {
    mockApiPost.mockResolvedValue({
      data: { id: "pm_saved_2", isDefault: true },
    });
    const { setDefaultPaymentMethod } = await import(
      "@/src/services/paymentMethodsService"
    );

    const result = await setDefaultPaymentMethod("pm_saved_2");

    expect(mockApiPost).toHaveBeenCalledWith(
      "/payment-methods/pm_saved_2/default",
    );
    expect(result.isDefault).toBe(true);
  });

  it("deletes a payment method", async () => {
    mockApiDelete.mockResolvedValue({
      data: {
        subscriptionScheduledToCancel: true,
        expiresAt: "2026-05-28T00:00:00.000Z",
      },
    });
    const { deletePaymentMethod } = await import(
      "@/src/services/paymentMethodsService"
    );

    const result = await deletePaymentMethod("pm_saved_2");

    expect(mockApiDelete).toHaveBeenCalledWith("/payment-methods/pm_saved_2");
    expect(result.subscriptionScheduledToCancel).toBe(true);
  });
});
