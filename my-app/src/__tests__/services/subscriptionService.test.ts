/**
 * subscriptionService.test.ts
 *
 * Integration tests proving frontend service correctly wires to backend endpoints.
 * Covers: cancelSubscription re-fetch + normalize, decrementUploadQuota normalize,
 * and response normalization (GO_PLUS → "GO+", adsEnabled → perks.adFree).
 */

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
  adsEnabled: true,
  canDownload: false,
  uploadLimit: 3,
  uploadedTracks: 2,
  remainingUploads: 1,
};

const PRO_BACKEND_RESPONSE = {
  userId: "usr_1",
  planCode: "PRO",
  subscriptionType: "PRO",
  adsEnabled: false,
  canDownload: true,
  uploadLimit: 100,
  uploadedTracks: 10,
  remainingUploads: 90,
};

const GO_PLUS_BACKEND_RESPONSE = {
  userId: "usr_1",
  planCode: "GO_PLUS",
  subscriptionType: "GO_PLUS",
  adsEnabled: false,
  canDownload: true,
  uploadLimit: 1000,
  uploadedTracks: 5,
  remainingUploads: 995,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("subscriptionService (non-mock mode)", () => {
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
    });

    it("normalizes PRO response correctly", async () => {
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });
      const { getMySubscription } = await import("@/src/services/subscriptionService");

      const result = await getMySubscription();

      expect(result.subscriptionType).toBe("PRO");
      expect(result.perks.adFree).toBe(true);
      expect(result.perks.offlineListening).toBe(true);
      expect(result.uploadLimit).toBe(100);
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
  });

  // ── cancelSubscription ─────────────────────────────────────────────────────

  describe("cancelSubscription", () => {
    it("POSTs to /subscriptions/cancel then re-fetches /subscriptions/me", async () => {
      mockApiPost.mockResolvedValue({ data: { message: "Cancelled", cancelAtPeriodEnd: true } });
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });

      const { cancelSubscription } = await import("@/src/services/subscriptionService");
      const result = await cancelSubscription();

      expect(mockApiPost).toHaveBeenCalledWith("/subscriptions/cancel", {});
      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/me");
    });

    it("returns normalized SubscriptionDetails after cancel (not raw cancel response)", async () => {
      mockApiPost.mockResolvedValue({ data: { message: "Cancelled", cancelAtPeriodEnd: true } });
      // After cancel, user still has PRO access (cancelAtPeriodEnd=true, access until period end)
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });

      const { cancelSubscription } = await import("@/src/services/subscriptionService");
      const result = await cancelSubscription();

      // Must be a SubscriptionDetails, not the raw cancel response
      expect(result).toHaveProperty("subscriptionType");
      expect(result).toHaveProperty("perks");
      expect(result).toHaveProperty("uploadLimit");
      expect(result.subscriptionType).toBe("PRO");
      // Must NOT be the raw cancel response shape
      expect(result).not.toHaveProperty("message");
      expect(result).not.toHaveProperty("cancelledAt");
    });

    it("returns FREE subscription details when re-fetch shows FREE (after cancel expires)", async () => {
      mockApiPost.mockResolvedValue({ data: { message: "Cancelled" } });
      mockApiGet.mockResolvedValue({ data: FREE_BACKEND_RESPONSE });

      const { cancelSubscription } = await import("@/src/services/subscriptionService");
      const result = await cancelSubscription();

      expect(result.subscriptionType).toBe("FREE");
      expect(result.perks.adFree).toBe(false);
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
      expect(result).toHaveProperty("perks");
      expect(result.perks.adFree).toBe(false);
    });

    it("returns normalized PRO data after upload (backend is source of truth for quota)", async () => {
      mockApiGet.mockResolvedValue({ data: PRO_BACKEND_RESPONSE });

      const { decrementUploadQuota } = await import("@/src/services/subscriptionService");
      const result = await decrementUploadQuota();

      expect(result.subscriptionType).toBe("PRO");
      expect(result.uploadLimit).toBe(100);
      // Must NOT be raw response (no planCode at top level)
      expect(result).not.toHaveProperty("planCode");
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
  });

  // ── getOfflineTrack ────────────────────────────────────────────────────────

  describe("getOfflineTrack", () => {
    it("calls GET /subscriptions/offline/:trackId", async () => {
      mockApiGet.mockResolvedValue({
        data: {
          trackId: "trk_1",
          title: "My Track",
          artist: "Artist",
          downloadUrl: "https://cdn.example.com/track.mp3",
        },
      });

      const { getOfflineTrack } = await import("@/src/services/subscriptionService");
      const result = await getOfflineTrack("trk_1");

      expect(mockApiGet).toHaveBeenCalledWith("/subscriptions/offline/trk_1");
      expect(result.downloadUrl).toBe("https://cdn.example.com/track.mp3");
    });

    it("throws DownloadForbiddenError when backend returns 403", async () => {
      mockApiGet.mockRejectedValue({ response: { status: 403 } });

      const { getOfflineTrack, DownloadForbiddenError } = await import(
        "@/src/services/subscriptionService"
      );
      await expect(getOfflineTrack("trk_1")).rejects.toBeInstanceOf(DownloadForbiddenError);
    });
  });
});
