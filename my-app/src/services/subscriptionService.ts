import api from "./api";
import { PLAN_CONFIG } from "@/src/config/plans";
/**
 * Data structures for Subscription and Offline tracks
 */
export interface SubscriptionDetails {
  userId: string;
  subscriptionType: "FREE" | "PRO" | "GO+";
  uploadLimit: number;
  uploadedTracks: number;
  remainingUploads: number;
  perks: {
    adFree: boolean;
    offlineListening: boolean;
  };
}

export interface OfflineTrack {
  trackId: string;
  title: string;
  artist: string;
  downloadUrl: string;
}

/**
 * This allows simulating a real upgrade during development
 */
let MOCK_SUBSCRIPTION: SubscriptionDetails = {
  userId: "usr_123",
  subscriptionType: "FREE",
  uploadLimit: PLAN_CONFIG.FREE.uploadLimit,   
  uploadedTracks: 1,
  remainingUploads: PLAN_CONFIG.FREE.uploadLimit - 1,
  perks: { adFree: false, offlineListening: false },
};
/**
 * Helper to check if we should use mock data from environment variables
 */
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/**
 * Get current user's subscription and upload quota
 */
/**
 * Normalize the backend /subscriptions/me response to the frontend SubscriptionDetails shape.
 * Backend uses planCode "GO_PLUS" and top-level adsEnabled/canDownload fields.
 * Frontend expects subscriptionType "GO+" and a perks object.
 */
function normalizeBackendSubscription(raw: Record<string, unknown>): SubscriptionDetails {
  const planCode = (raw.planCode as string) ?? "FREE";
  const subscriptionType: "FREE" | "PRO" | "GO+" =
    planCode === "GO_PLUS" ? "GO+" : planCode === "PRO" ? "PRO" : "FREE";
  const adsEnabled = (raw.adsEnabled as boolean) ?? true;
  const canDownload = (raw.canDownload as boolean) ?? false;
  return {
    userId: (raw.userId as string) ?? "",
    subscriptionType,
    uploadLimit: (raw.uploadLimit as number) ?? 3,
    uploadedTracks: (raw.uploadedTracks as number) ?? 0,
    remainingUploads: (raw.remainingUploads as number) ?? 3,
    perks: {
      adFree: !adsEnabled,
      offlineListening: canDownload,
    },
  };
}

export const getMySubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...MOCK_SUBSCRIPTION };
  }
  const response = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(response.data);
};

/**
 * Called ONLY after a successful uploadTrack() — mirrors what the real
 * backend does: it decrements the quota when it receives the file.
 */
export const decrementUploadQuota = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    if (MOCK_SUBSCRIPTION.remainingUploads > 0) {
      MOCK_SUBSCRIPTION = {
        ...MOCK_SUBSCRIPTION,
        remainingUploads: MOCK_SUBSCRIPTION.remainingUploads - 1,
        uploadedTracks: MOCK_SUBSCRIPTION.uploadedTracks + 1,
      };
    }
    console.log(
      "[Mock] Upload quota decremented → remaining:",
      MOCK_SUBSCRIPTION.remainingUploads,
    );
    return { ...MOCK_SUBSCRIPTION };
  }
  // Real backend decrements automatically on upload — just re-fetch and normalize
  const response = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(response.data);
};



/**
 * Upgrade user to PRO or GO+ plan
 * Implements the logic to update status and perks 
 */
export const upgradeSubscription = async (type: "PRO" | "GO+") => {
  if (!USE_MOCK) {
    // Map frontend plan key to backend planCode
    const planCode = type === "GO+" ? "GO_PLUS" : "PRO";
    const response = await api.post("/subscriptions/checkout", { planCode });
    return response.data;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  MOCK_SUBSCRIPTION = {
  ...MOCK_SUBSCRIPTION,
  subscriptionType: type,
  uploadLimit: PLAN_CONFIG[type].uploadLimit,       // ← 100 for PRO / 1000 for GO+
  remainingUploads: PLAN_CONFIG[type].uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
  perks: { adFree: true, offlineListening: true },
};

  MOCK_SUBSCRIPTION.remainingUploads = MOCK_SUBSCRIPTION.uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks;

  return { success: true, newType: type };
};

/**
 * Cancel the current subscription — backend sets type back to FREE
 */
export const cancelSubscription = async (): Promise<SubscriptionDetails> => 
    {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    MOCK_SUBSCRIPTION = {
  ...MOCK_SUBSCRIPTION,
  subscriptionType: "FREE",
  uploadLimit: PLAN_CONFIG.FREE.uploadLimit,        // ← 3
  remainingUploads: PLAN_CONFIG.FREE.uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
  perks: { adFree: false, offlineListening: false },
};
    return { ...MOCK_SUBSCRIPTION };
  }
  // POST to cancel (backend schedules cancel at period end), then re-fetch to get
  // the updated subscription (still active, cancelAtPeriodEnd=true)
  await api.post("/subscriptions/cancel", {});
  const refreshed = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(refreshed.data);
};
/**
 * Get secure download link for offline listening
 * Only accessible if subscription perks allow 
 */
export class DownloadForbiddenError extends Error {
  constructor() {
    super("DOWNLOAD_FORBIDDEN");
    this.name = "DownloadForbiddenError";
  }
}

export const getOfflineTrack = async (trackId: string): Promise<OfflineTrack> => {
  if (USE_MOCK) {
    // Guard: check the current mock subscription tier
    if (
      MOCK_SUBSCRIPTION.subscriptionType === "FREE" ||
      !MOCK_SUBSCRIPTION.perks.offlineListening
    ) {
      // Simulate exactly what the real backend returns → 403 Forbidden
      throw new DownloadForbiddenError();
    }

    return {
      trackId,
      title: "Mock PRO Track",
      artist: "Mock Artist",
      downloadUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    };
  }

  try {
    const response = await api.get(`/subscriptions/offline/${trackId}`);
    return response.data;
  } catch (err: unknown) {
    // Re-map real backend 403 → DownloadForbiddenError
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 403) throw new DownloadForbiddenError();
    throw err;
  }
};

/**
 * Check if the user has remaining upload quota
 * Prevents exceeding limits as per Module 12 rules 
 */
export const canUserUpload = async (): Promise<boolean> => {
  const sub = await getMySubscription();
  // Returns true only if remaining quota is greater than 0 
  return sub.remainingUploads > 0;
};