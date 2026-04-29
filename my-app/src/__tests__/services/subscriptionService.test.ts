export {};

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockListPaymentMethods = jest.fn();
const mockDeletePaymentMethod = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

jest.mock("@/src/services/paymentMethodsService", () => ({
  __esModule: true,
  listPaymentMethods: (...args: unknown[]) => mockListPaymentMethods(...args),
  deletePaymentMethod: (...args: unknown[]) => mockDeletePaymentMethod(...args),
}));

const FREE_SUBSCRIPTION_RESPONSE = {
  userId: "usr_1",
  planCode: "FREE",
  subscriptionType: "FREE",
  adsEnabled: true,
  canDownload: false,
  uploadLimit: 3,
  uploadedTracks: 2,
  remainingUploads: 1,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  paymentMethodSummary: null,
};

const PRO_SUBSCRIPTION_RESPONSE = {
  userId: "usr_1",
  planCode: "PRO",
  subscriptionType: "PRO",
  adsEnabled: false,
  canDownload: true,
  uploadLimit: 100,
  uploadedTracks: 10,
  remainingUploads: 90,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-05-28T00:00:00.000Z",
  paymentMethodSummary: {
    brand: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2030,
    isDefault: true,
  },
};

const GO_PLUS_SUBSCRIPTION_RESPONSE = {
  userId: "usr_1",
  planCode: "GO_PLUS",
  subscriptionType: "GO_PLUS",
  adsEnabled: false,
  canDownload: true,
  uploadLimit: 1000,
  uploadedTracks: 5,
  remainingUploads: 995,
  cancelAtPeriodEnd: true,
  currentPeriodEnd: "2026-05-28T00:00:00.000Z",
  paymentMethodSummary: null,
};

describe("subscriptionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK =
      "false";
    window.history.pushState({}, "", "/settings?tab=billing");
  });

  describe("getMySubscription", () => {
    it("normalizes FREE responses from /subscriptions/me", async () => {
      mockApiGet.mockResolvedValue({ data: FREE_SUBSCRIPTION_RESPONSE });
      const { getMySubscription } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await getMySubscription();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result.subscriptionType).toBe("FREE");
      expect(result.perks.adFree).toBe(false);
      expect(result.perks.offlineListening).toBe(false);
      expect(result.remainingUploads).toBe(1);
    });

    it("normalizes GO_PLUS responses to GO+", async () => {
      mockApiGet.mockResolvedValue({ data: GO_PLUS_SUBSCRIPTION_RESPONSE });
      const { getMySubscription } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await getMySubscription();

      expect(result.subscriptionType).toBe("GO+");
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.perks.adFree).toBe(true);
      expect(result.perks.offlineListening).toBe(true);
    });
  });

  describe("getPlans", () => {
    it("calls /subscriptions/plans", async () => {
      mockApiGet.mockResolvedValue({
        data: [{ code: "PRO" }, { code: "GO_PLUS" }],
      });
      const { getPlans } = await import("@/src/services/subscriptionService");

      const result = await getPlans();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/plans");
      expect(result).toEqual([{ code: "PRO" }, { code: "GO_PLUS" }]);
    });
  });

  describe("decrementUploadQuota", () => {
    it("re-fetches /subscriptions/me and normalizes the response", async () => {
      mockApiGet.mockResolvedValue({ data: PRO_SUBSCRIPTION_RESPONSE });
      const { decrementUploadQuota } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await decrementUploadQuota();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result.subscriptionType).toBe("PRO");
      expect(result.uploadLimit).toBe(100);
    });
  });

  describe("upgradeSubscription", () => {
    it("posts to /subscriptions/checkout and returns a redirect when Stripe checkout is required", async () => {
      mockApiPost.mockResolvedValue({
        data: { checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123" },
      });
      const { upgradeSubscription } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await upgradeSubscription("PRO");

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/checkout", {
        planCode: "PRO",
      });
      expect(result).toEqual({
        status: "redirect",
        checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
      });
    });

    it("maps GO+ to GO_PLUS and treats immediate activation as activated", async () => {
      mockApiPost.mockResolvedValue({
        data: {
          status: "active",
          checkoutUrl: "https://mock-checkout.example.com/pay?session=cs_mock",
        },
      });
      const { upgradeSubscription } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await upgradeSubscription("GO+");

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/checkout", {
        planCode: "GO_PLUS",
      });
      expect(result).toEqual({ status: "activated" });
    });

    it("treats scheduled downgrades as activated without redirecting", async () => {
      mockApiPost.mockResolvedValue({
        data: { scheduled: true, effectiveAt: "2026-05-28T00:00:00.000Z" },
      });
      const { upgradeSubscription } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await upgradeSubscription("PRO");

      expect(result).toEqual({ status: "activated" });
    });
  });

  describe("cancelSubscription", () => {
    it("posts to /subscriptions/cancel and re-fetches the subscription", async () => {
      mockApiPost.mockResolvedValue({ data: { ok: true } });
      mockApiGet.mockResolvedValue({ data: GO_PLUS_SUBSCRIPTION_RESPONSE });
      const { cancelSubscription } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await cancelSubscription();

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/cancel", {});
      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result.subscriptionType).toBe("GO+");
      expect(result.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe("resumeSubscription", () => {
    it("posts to /subscriptions/resume and re-fetches the subscription", async () => {
      mockApiPost.mockResolvedValue({ data: { ok: true } });
      mockApiGet.mockResolvedValue({ data: PRO_SUBSCRIPTION_RESPONSE });
      const { resumeSubscription } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await resumeSubscription();

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/resume");
      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result.subscriptionType).toBe("PRO");
    });
  });

  describe("changePlan", () => {
    it("posts to /subscriptions/change-plan with the canonical plan code and re-fetches the subscription", async () => {
      mockApiPost.mockResolvedValue({ data: { ok: true } });
      mockApiGet.mockResolvedValue({ data: GO_PLUS_SUBSCRIPTION_RESPONSE });
      const { changePlan } = await import("@/src/services/subscriptionService");

      const result = await changePlan("GO+");

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/change-plan", {
        planCode: "GO_PLUS",
      });
      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result.subscriptionType).toBe("GO+");
    });
  });

  describe("getInvoices", () => {
    it("calls /subscriptions/invoices", async () => {
      mockApiGet.mockResolvedValue({
        data: [{ id: "inv_1", amountPaidCents: 999 }],
      });
      const { getInvoices } = await import("@/src/services/subscriptionService");

      const result = await getInvoices();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/invoices");
      expect(result).toEqual([{ id: "inv_1", amountPaidCents: 999 }]);
    });
  });

  describe("openBillingPortal", () => {
    it("posts the new portal body with returnUrl and flow", async () => {
      mockApiPost.mockResolvedValue({
        data: {
          portalUrl: "https://billing.stripe.com/session/bps_test_123",
          paymentMethodSummary: PRO_SUBSCRIPTION_RESPONSE.paymentMethodSummary,
          currentPlanCode: "PRO",
          capabilities: { canUpdatePaymentMethod: true },
        },
      });
      const { openBillingPortal } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await openBillingPortal({ flow: "payment_methods" });

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/portal", {
        returnUrl: "http://localhost/settings?tab=billing",
        flow: "payment_methods",
      });
      expect(result.portalUrl).toBe(
        "https://billing.stripe.com/session/bps_test_123",
      );
      expect(result.currentPlanCode).toBe("PRO");
      expect(result.paymentMethodSummary?.last4).toBe("4242");
    });
  });

  describe("getOfflineTrack", () => {
    it("calls /subscriptions/offline/:trackId", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          trackId: "trk_1",
          title: "My Track",
          artist: "Artist",
          downloadUrl: "https://cdn.example.com/track.mp3",
          expiresInSeconds: 900,
        },
      });
      const { getOfflineTrack } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await getOfflineTrack("trk_1");

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/offline/trk_1");
      expect(result.expiresInSeconds).toBe(900);
    });

    it("maps backend 403 responses to DownloadForbiddenError", async () => {
      mockApiGet.mockRejectedValue({ response: { status: 403 } });
      const { DownloadForbiddenError, getOfflineTrack } = await import(
        "@/src/services/subscriptionService"
      );

      await expect(getOfflineTrack("trk_1")).rejects.toBeInstanceOf(
        DownloadForbiddenError,
      );
    });
  });

  describe("canUserUpload", () => {
    it("returns true when the user still has quota", async () => {
      mockApiGet.mockResolvedValue({ data: FREE_SUBSCRIPTION_RESPONSE });
      const { canUserUpload } = await import(
        "@/src/services/subscriptionService"
      );

      await expect(canUserUpload()).resolves.toBe(true);
    });
  });

  describe("removePaymentMethod", () => {
    it("deletes the default saved payment method and refreshes the subscription", async () => {
      mockListPaymentMethods.mockResolvedValue([
        {
          id: "pm_1",
          isDefault: false,
        },
        {
          id: "pm_2",
          isDefault: true,
        },
      ]);
      mockDeletePaymentMethod.mockResolvedValue({});
      mockApiGet.mockResolvedValue({ data: FREE_SUBSCRIPTION_RESPONSE });
      const { removePaymentMethod } = await import(
        "@/src/services/subscriptionService"
      );

      const result = await removePaymentMethod();

      expect(mockListPaymentMethods).toHaveBeenCalledTimes(1);
      expect(mockDeletePaymentMethod).toHaveBeenCalledWith("pm_2");
      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result.subscriptionType).toBe("FREE");
    });

    it("uses an explicit payment method id when one is supplied", async () => {
      mockListPaymentMethods.mockResolvedValue([
        {
          id: "pm_default",
          isDefault: true,
        },
        {
          id: "pm_target",
          isDefault: false,
        },
      ]);
      mockDeletePaymentMethod.mockResolvedValue({});
      mockApiGet.mockResolvedValue({ data: PRO_SUBSCRIPTION_RESPONSE });
      const { removePaymentMethod } = await import(
        "@/src/services/subscriptionService"
      );

      await removePaymentMethod("pm_target");

      expect(mockDeletePaymentMethod).toHaveBeenCalledWith("pm_target");
    });

    it("throws when there are no saved payment methods", async () => {
      mockListPaymentMethods.mockResolvedValue([]);
      const { removePaymentMethod } = await import(
        "@/src/services/subscriptionService"
      );

      await expect(removePaymentMethod()).rejects.toThrow(
        "No saved payment method found.",
      );
    });
  });
});
