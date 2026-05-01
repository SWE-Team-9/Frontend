/**
 * subscriptionService.test.ts
 *
 * Tests for all subscription API service functions.
 * Covers both mock mode and real API mode, including offline entitlement,
 * billing portal, plan change, resume, and download flows.
 */

export {};

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

// ── Shared backend response shapes ────────────────────────────────────────────

const FREE_BACKEND_RESPONSE = {
  userId: "usr_1",
  planCode: "FREE",
  subscriptionType: "FREE",
  planName: "Free",
  isPremium: false,
  subscriptionStatus: null,
  adsEnabled: true,
  canDownload: false,
  uploadLimit: 3,
  uploadedTracks: 2,
  remainingUploads: 1,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  renewalDate: null,
  expiresAt: null,
  trialStart: null,
  trialEnd: null,
  paymentMethod: null,
  pendingDowngrade: null,
  latestInvoice: null,
};

const PRO_BACKEND_RESPONSE = {
  userId: "usr_1",
  planCode: "PRO",
  subscriptionType: "PRO",
  planName: "Artist Pro",
  isPremium: true,
  subscriptionStatus: "ACTIVE",
  adsEnabled: false,
  canDownload: true,
  uploadLimit: 100,
  uploadedTracks: 10,
  remainingUploads: 90,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-05-28T00:00:00.000Z",
  renewalDate: "2026-05-28T00:00:00.000Z",
  expiresAt: null,
  trialStart: null,
  trialEnd: null,
  paymentMethod: { brand: "visa", last4: "4242", expiryMonth: 12, expiryYear: 2030, isDefault: true },
  pendingDowngrade: null,
  latestInvoice: null,
};

const GO_PLUS_BACKEND_RESPONSE = {
  userId: "usr_1",
  planCode: "GO_PLUS",
  subscriptionType: "GO_PLUS",
  planName: "GO+",
  isPremium: true,
  subscriptionStatus: "ACTIVE",
  adsEnabled: false,
  canDownload: true,
  uploadLimit: 1000,
  uploadedTracks: 5,
  remainingUploads: 995,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-05-28T00:00:00.000Z",
  renewalDate: "2026-05-28T00:00:00.000Z",
  expiresAt: null,
  trialStart: null,
  trialEnd: null,
  paymentMethod: null,
  pendingDowngrade: null,
  latestInvoice: null,
};

const PRO_CANCEL_PENDING_RESPONSE = {
  ...PRO_BACKEND_RESPONSE,
  cancelAtPeriodEnd: true,
  expiresAt: "2026-05-28T00:00:00.000Z",
  renewalDate: null,
};

// ── Real API mode tests ───────────────────────────────────────────────────────

describe("subscriptionService (real API mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "false";
  });

  // ── getMySubscription ──────────────────────────────────────────────────────

  describe("getMySubscription", () => {
    it("calls GET /subscriptions/me and normalizes FREE response", async () => {
      mockApiGet.mockResolvedValue({ data: FREE_BACKEND_RESPONSE });
      const { getMySubscription } = await import("@/src/services/subscriptionService");

      const result = await getMySubscription();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result.subscriptionType).toBe("FREE");
      expect(result.perks.adFree).toBe(false);
      expect(result.perks.offlineListening).toBe(false);
      expect(result.uploadLimit).toBe(3);
      expect(result.remainingUploads).toBe(1);
      expect(result.isPremium).toBe(false);
      expect(result.cancelAtPeriodEnd).toBe(false);
    });

    it("normalizes PRO response with paymentMethod object", async () => {
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });
      const { getMySubscription } = await import("@/src/services/subscriptionService");

      const result = await getMySubscription();

      expect(result.subscriptionType).toBe("PRO");
      expect(result.perks.adFree).toBe(true);
      expect(result.perks.offlineListening).toBe(true);
      expect(result.uploadLimit).toBe(100);
      expect(result.isPremium).toBe(true);
      expect(result.paymentMethodSummary?.brand).toBe("visa");
      expect(result.paymentMethodSummary?.last4).toBe("4242");
    });

    it("normalizes GO_PLUS → 'GO+' and sets adFree/offlineListening true", async () => {
      mockApiGet.mockResolvedValue({ data: GO_PLUS_BACKEND_RESPONSE });
      const { getMySubscription } = await import("@/src/services/subscriptionService");

      const result = await getMySubscription();

      expect(result.subscriptionType).toBe("GO+");
      expect(result.perks.adFree).toBe(true);
      expect(result.perks.offlineListening).toBe(true);
      expect(result.uploadLimit).toBe(1000);
    });

    it("sets paymentMethodSummary to null when no paymentMethod in response", async () => {
      mockApiGet.mockResolvedValue({ data: GO_PLUS_BACKEND_RESPONSE });
      const { getMySubscription } = await import("@/src/services/subscriptionService");

      const result = await getMySubscription();

      expect(result.paymentMethodSummary).toBeNull();
    });

    it("sets cancelAtPeriodEnd and expiresAt when subscription is canceling", async () => {
      mockApiGet.mockResolvedValue({ data: PRO_CANCEL_PENDING_RESPONSE });
      const { getMySubscription } = await import("@/src/services/subscriptionService");

      const result = await getMySubscription();

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.expiresAt).toBe("2026-05-28T00:00:00.000Z");
      expect(result.renewalDate).toBeNull();
    });
  });

  // ── getSubscriptionPlans ──────────────────────────────────────────────────

  describe("getSubscriptionPlans", () => {
    it("calls GET /subscriptions/plans and returns plan array", async () => {
      const mockPlans = [
        { id: "plan-1", code: "FREE", name: "Free", tier: "FREE", priceCents: 0 },
        { id: "plan-2", code: "PRO", name: "Artist Pro", tier: "PRO", priceCents: 999 },
      ];
      mockApiGet.mockResolvedValue({ data: mockPlans });
      const { getSubscriptionPlans } = await import("@/src/services/subscriptionService");

      const result = await getSubscriptionPlans();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/plans");
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe("FREE");
    });
  });

  // ── cancelSubscription ─────────────────────────────────────────────────────

  describe("cancelSubscription", () => {
    it("POSTs to /subscriptions/cancel then re-fetches /subscriptions/me", async () => {
      mockApiPost.mockResolvedValue({ data: { message: "Cancelled", cancelAtPeriodEnd: true } });
      mockApiGet.mockResolvedValue({ data: PRO_CANCEL_PENDING_RESPONSE });

      const { cancelSubscription } = await import("@/src/services/subscriptionService");
      await cancelSubscription();

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/cancel", {});
      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
    });

    it("returns normalized SubscriptionDetails after cancel", async () => {
      mockApiPost.mockResolvedValue({ data: { message: "Cancelled", cancelAtPeriodEnd: true } });
      mockApiGet.mockResolvedValue({ data: PRO_CANCEL_PENDING_RESPONSE });

      const { cancelSubscription } = await import("@/src/services/subscriptionService");
      const result = await cancelSubscription();

      expect(result).toHaveProperty("subscriptionType");
      expect(result).toHaveProperty("perks");
      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result).not.toHaveProperty("message");
    });

    it("returns FREE subscription details when re-fetch shows FREE", async () => {
      mockApiPost.mockResolvedValue({ data: { message: "Cancelled" } });
      mockApiGet.mockResolvedValue({ data: FREE_BACKEND_RESPONSE });

      const { cancelSubscription } = await import("@/src/services/subscriptionService");
      const result = await cancelSubscription();

      expect(result.subscriptionType).toBe("FREE");
      expect(result.perks.adFree).toBe(false);
    });
  });

  // ── resumeSubscription ─────────────────────────────────────────────────────

  describe("resumeSubscription", () => {
    it("POSTs to /subscriptions/resume then re-fetches subscription", async () => {
      mockApiPost.mockResolvedValue({ data: { message: "Resumed" } });
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });

      const { resumeSubscription } = await import("@/src/services/subscriptionService");
      const result = await resumeSubscription();

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/resume");
      expect(result.cancelAtPeriodEnd).toBe(false);
    });
  });

  // ── changePlan ─────────────────────────────────────────────────────────────

  describe("changePlan", () => {
    it("maps 'PRO' and POSTs to /subscriptions/change-plan with planCode", async () => {
      mockApiPost.mockResolvedValue({ data: {} });
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });

      const { changePlan } = await import("@/src/services/subscriptionService");
      await changePlan("PRO");

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/change-plan", { planCode: "PRO" });
    });

    it("maps 'GO+' → 'GO_PLUS' in change-plan request", async () => {
      mockApiPost.mockResolvedValue({ data: {} });
      mockApiGet.mockResolvedValue({ data: GO_PLUS_BACKEND_RESPONSE });

      const { changePlan } = await import("@/src/services/subscriptionService");
      const result = await changePlan("GO+");

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/change-plan", { planCode: "GO_PLUS" });
      expect(result.subscriptionType).toBe("GO+");
    });
  });

  // ── upgradeSubscription ────────────────────────────────────────────────────

  describe("upgradeSubscription", () => {
    it("POSTs to /subscriptions/checkout with PRO planCode", async () => {
      mockApiPost.mockResolvedValue({ data: { subscriptionId: "sub_1", planCode: "PRO" } });

      const { upgradeSubscription } = await import("@/src/services/subscriptionService");
      await upgradeSubscription("PRO");

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/checkout", { planCode: "PRO" });
    });

    it("maps 'GO+' to 'GO_PLUS' planCode for backend", async () => {
      mockApiPost.mockResolvedValue({ data: { subscriptionId: "sub_2", planCode: "GO_PLUS" } });

      const { upgradeSubscription } = await import("@/src/services/subscriptionService");
      await upgradeSubscription("GO+");

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/checkout", { planCode: "GO_PLUS" });
    });

    it("returns checkout result in mock billing provider mode (no Stripe URL)", async () => {
      const mockResult = {
        subscriptionId: "sub_mock_123",
        planCode: "PRO",
        trialEligible: false,
        checkoutUrl: "https://mock-checkout.example.com/pay?session=cs_mock_abc",
      };
      mockApiPost.mockResolvedValue({ data: mockResult });

      const { upgradeSubscription } = await import("@/src/services/subscriptionService");
      const result = await upgradeSubscription("PRO");

      expect(result.subscriptionId).toBe("sub_mock_123");
      expect(result.checkoutUrl).toContain("mock-checkout.example.com");
    });

    it("returns downgrade scheduled result when server schedules a downgrade", async () => {
      const downgradeResult = {
        scheduled: true,
        effectiveAt: "2026-05-28T00:00:00.000Z",
        currentPlan: "GO_PLUS",
        newPlan: "PRO",
        message: "Your plan will downgrade on 2026-05-28.",
      };
      mockApiPost.mockResolvedValue({ data: downgradeResult });

      const { upgradeSubscription } = await import("@/src/services/subscriptionService");
      const result = await upgradeSubscription("PRO");

      expect(result.scheduled).toBe(true);
      expect(result.effectiveAt).toBe("2026-05-28T00:00:00.000Z");
    });
  });

  // ── getInvoices ────────────────────────────────────────────────────────────

  describe("getInvoices", () => {
    it("calls GET /subscriptions/invoices and returns invoice array", async () => {
      const mockInvoices = [
        {
          id: "inv-1",
          invoiceId: "in_stripe_123",
          amountDueCents: 999,
          amountPaidCents: 999,
          currency: "usd",
          status: "PAID",
          planName: "Artist Pro",
          planTier: "PRO",
          dueAt: "2026-04-28T00:00:00.000Z",
          paidAt: "2026-04-28T00:00:00.000Z",
          createdAt: "2026-04-28T00:00:00.000Z",
        },
      ];
      mockApiGet.mockResolvedValue({ data: mockInvoices });

      const { getInvoices } = await import("@/src/services/subscriptionService");
      const result = await getInvoices();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/invoices");
      expect(result).toHaveLength(1);
      expect(result[0].amountPaidCents).toBe(999);
      expect(result[0].planName).toBe("Artist Pro");
    });

    it("returns empty array when no invoices", async () => {
      mockApiGet.mockResolvedValue({ data: [] });

      const { getInvoices } = await import("@/src/services/subscriptionService");
      const result = await getInvoices();

      expect(result).toEqual([]);
    });
  });

  // ── openBillingPortal ──────────────────────────────────────────────────────

  describe("openBillingPortal", () => {
    it("POSTs to /subscriptions/portal and returns portal data", async () => {
      const mockPortal = {
        portalSessionId: "bps_test_abc",
        portalUrl: "https://billing.stripe.com/session/bps_test_abc",
        capabilities: {
          canUpdatePaymentMethod: true,
          canCancel: true,
          canChangePlan: true,
          canViewReceipts: true,
          canViewPaymentMethods: true,
          canAddPaymentMethod: true,
          canRemovePaymentMethod: true,
          canSetDefaultPaymentMethod: true,
        },
        paymentMethodSummary: null,
      };
      mockApiPost.mockResolvedValue({ data: mockPortal });

      const { openBillingPortal } = await import("@/src/services/subscriptionService");
      const result = await openBillingPortal();

      expect(mockApiPost).toHaveBeenCalledWith(
        "/subscriptions/portal",
        expect.objectContaining({ returnUrl: expect.any(String) }),
      );
      expect(result.portalUrl).toBe("https://billing.stripe.com/session/bps_test_abc");
    });

    it("includes flow parameter when provided", async () => {
      mockApiPost.mockResolvedValue({
        data: { portalSessionId: "bps_1", portalUrl: "#", capabilities: {} },
      });

      const { openBillingPortal } = await import("@/src/services/subscriptionService");
      await openBillingPortal("payment_methods");

      expect(mockApiPost).toHaveBeenCalledWith(
        "/subscriptions/portal",
        expect.objectContaining({ flow: "payment_methods" }),
      );
    });
  });

  // ── decrementUploadQuota ───────────────────────────────────────────────────

  describe("decrementUploadQuota", () => {
    it("calls GET /subscriptions/me and returns normalized SubscriptionDetails", async () => {
      mockApiGet.mockResolvedValue({ data: FREE_BACKEND_RESPONSE });

      const { decrementUploadQuota } = await import("@/src/services/subscriptionService");
      const result = await decrementUploadQuota();

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
      expect(result).toHaveProperty("subscriptionType", "FREE");
      expect(result).not.toHaveProperty("planCode");
    });

    it("returns normalized PRO data after upload", async () => {
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });

      const { decrementUploadQuota } = await import("@/src/services/subscriptionService");
      const result = await decrementUploadQuota();

      expect(result.subscriptionType).toBe("PRO");
      expect(result.uploadLimit).toBe(100);
    });
  });

  // ── getOfflineTrack ────────────────────────────────────────────────────────

  describe("getOfflineTrack", () => {
    it("calls GET /subscriptions/offline/:trackId and returns track metadata", async () => {
      const meta = {
        trackId: "trk_1",
        title: "Midnight Drive",
        artist: "DJ Nova",
        handle: "djnova",
        durationMs: 214000,
        coverArtUrl: "https://cdn.example.com/cover.jpg",
        downloadUrl: "(use /stream)",
        expiresAt: "2026-04-28T14:00:00.000Z",
        expiresInSeconds: 900,
        planCode: "PRO",
      };
      mockApiGet.mockResolvedValue({ data: meta });

      const { getOfflineTrack } = await import("@/src/services/subscriptionService");
      const result = await getOfflineTrack("trk_1");

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/offline/trk_1");
      expect(result.title).toBe("Midnight Drive");
      expect(result.expiresInSeconds).toBe(900);
    });

    it("throws DownloadForbiddenError when backend returns 403", async () => {
      mockApiGet.mockRejectedValue({ response: { status: 403 } });

      const { getOfflineTrack, DownloadForbiddenError } = await import(
        "@/src/services/subscriptionService"
      );
      await expect(getOfflineTrack("trk_1")).rejects.toBeInstanceOf(DownloadForbiddenError);
    });

    it("re-throws non-403 errors unchanged", async () => {
      mockApiGet.mockRejectedValue({ response: { status: 404 } });

      const { getOfflineTrack, DownloadForbiddenError } = await import(
        "@/src/services/subscriptionService"
      );
      const err = await getOfflineTrack("trk_1").catch((e) => e);
      expect(err).not.toBeInstanceOf(DownloadForbiddenError);
      expect(err.response.status).toBe(404);
    });
  });

  // ── downloadOfflineTrack ───────────────────────────────────────────────────

  describe("downloadOfflineTrack", () => {
    it("calls GET /subscriptions/offline/:trackId/stream with responseType blob", async () => {
      const audioBlob = new Blob(["audio-bytes"], { type: "audio/mpeg" });
      mockApiGet.mockResolvedValue({ data: audioBlob });

      const { downloadOfflineTrack } = await import("@/src/services/subscriptionService");
      const result = await downloadOfflineTrack("trk_1");

      expect(mockApiGet).toHaveBeenCalledWith(
        "/subscriptions/offline/trk_1/stream",
        { responseType: "blob" },
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it("throws DownloadForbiddenError when backend returns 403", async () => {
      mockApiGet.mockRejectedValue({ response: { status: 403 } });

      const { downloadOfflineTrack, DownloadForbiddenError } = await import(
        "@/src/services/subscriptionService"
      );
      await expect(downloadOfflineTrack("trk_1")).rejects.toBeInstanceOf(DownloadForbiddenError);
    });
  });

  // ── canUserUpload ──────────────────────────────────────────────────────────

  describe("canUserUpload", () => {
    it("returns true when remainingUploads > 0", async () => {
      mockApiGet.mockResolvedValue({ data: FREE_BACKEND_RESPONSE });

      const { canUserUpload } = await import("@/src/services/subscriptionService");
      const result = await canUserUpload();

      expect(result).toBe(true);
    });

    it("returns true when uploadLimit is -1 (unlimited)", async () => {
      mockApiGet.mockResolvedValue({
        data: { ...GO_PLUS_BACKEND_RESPONSE, uploadLimit: -1, remainingUploads: null },
      });

      const { canUserUpload } = await import("@/src/services/subscriptionService");
      const result = await canUserUpload();

      expect(result).toBe(true);
    });
  });
});

// ── Mock mode tests ───────────────────────────────────────────────────────────

describe("subscriptionService (mock mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (process.env as Record<string, string | undefined>).NEXT_PUBLIC_USE_MOCK = "true";
  });

  it("getMySubscription returns mock FREE data without API call", async () => {
    const { getMySubscription } = await import("@/src/services/subscriptionService");
    const result = await getMySubscription();

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(result.subscriptionType).toBe("FREE");
  });

  it("getInvoices returns empty array in mock mode without API call", async () => {
    const { getInvoices } = await import("@/src/services/subscriptionService");
    const result = await getInvoices();

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it("upgradeSubscription updates mock state without API call", async () => {
    const { upgradeSubscription, getMySubscription } = await import(
      "@/src/services/subscriptionService"
    );

    await upgradeSubscription("PRO");
    const sub = await getMySubscription();

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(sub.subscriptionType).toBe("PRO");
    expect(sub.perks.adFree).toBe(true);
  });

  it("cancelSubscription sets cancelAtPeriodEnd in mock mode", async () => {
    const { upgradeSubscription, cancelSubscription } = await import(
      "@/src/services/subscriptionService"
    );

    await upgradeSubscription("PRO");
    const cancelled = await cancelSubscription();

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(cancelled.cancelAtPeriodEnd).toBe(true);
    expect(cancelled.subscriptionType).toBe("PRO");
  });

  it("getOfflineTrack throws DownloadForbiddenError on FREE plan in mock mode", async () => {
    const { getOfflineTrack, DownloadForbiddenError } = await import(
      "@/src/services/subscriptionService"
    );

    await expect(getOfflineTrack("trk_1")).rejects.toBeInstanceOf(DownloadForbiddenError);
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it("getOfflineTrack succeeds after upgrade to PRO in mock mode", async () => {
    const { upgradeSubscription, getOfflineTrack } = await import(
      "@/src/services/subscriptionService"
    );

    await upgradeSubscription("PRO");
    const result = await getOfflineTrack("trk_1");

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(result.trackId).toBe("trk_1");
    expect(result.title).toBeTruthy();
  });

  it("downloadOfflineTrack returns a Blob in mock mode after upgrade", async () => {
    const { upgradeSubscription, downloadOfflineTrack } = await import(
      "@/src/services/subscriptionService"
    );

    await upgradeSubscription("PRO");
    const blob = await downloadOfflineTrack("trk_1");

    expect(mockApiGet).not.toHaveBeenCalled();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("audio/mpeg");
  });

  it("openBillingPortal returns mock portal data without API call", async () => {
    const { openBillingPortal } = await import("@/src/services/subscriptionService");
    const result = await openBillingPortal();

    expect(mockApiPost).not.toHaveBeenCalled();
    expect(result.portalUrl).toBeTruthy();
    expect(result.capabilities).toBeTruthy();
  });
});
