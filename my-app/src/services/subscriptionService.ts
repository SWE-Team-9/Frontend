import api from "./api";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─── Backend response types ────────────────────────────────────────────────────

export interface PaymentMethodSummary {
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  invoiceId: string | null;
  amountDueCents: number;
  amountPaidCents: number;
  currency: string;
  status: string;
  planName: string;
  planTier: string;
  dueAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface PendingDowngrade {
  planCode: string;
  planId: string;
  planName: string;
  effectiveAt: string;
}

export interface SubscriptionDetails {
  userId: string;
  subscriptionType: "FREE" | "PRO" | "GO+";
  planName: string;
  isPremium: boolean;
  subscriptionStatus: string | null;
  uploadLimit: number;
  uploadedTracks: number;
  remainingUploads: number | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  renewalDate: string | null;
  expiresAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  paymentMethodSummary: PaymentMethodSummary | null;
  pendingDowngrade: PendingDowngrade | null;
  perks: {
    adFree: boolean;
    offlineListening: boolean;
  };
}

export interface OfflineTrackMeta {
  trackId: string;
  title: string;
  artist: string;
  handle: string;
  durationMs: number;
  coverArtUrl: string;
  downloadUrl: string;
  expiresAt: string;
  expiresInSeconds: number;
  planCode: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  tier: string;
  priceCents: number;
  priceDisplay: string;
  billingInterval: string;
  uploadLimit: number;
  uploadLimitDisplay: string;
  isUnlimited: boolean;
  trialDays: number;
  adsEnabled: boolean;
  canDownload: boolean;
  supportLevel: string;
  highlightedFeatures: string[];
}

export interface CheckoutResult {
  subscriptionId?: string;
  checkoutSessionId?: string;
  checkoutUrl?: string | null;
  planCode?: string;
  trialEligible?: boolean;
  trialDays?: number;
  amountDueNowCents?: number;
  renewsAt?: string;
  trialEndsAt?: string | null;
  priceCents?: number;
  scheduled?: boolean;
  effectiveAt?: string;
  currentPlan?: string;
  newPlan?: string;
  message?: string;
}

export interface BillingPortalResult {
  portalSessionId: string;
  portalUrl: string;
  capabilities: {
    canUpdatePaymentMethod: boolean;
    canCancel: boolean;
    canChangePlan: boolean;
    canViewReceipts: boolean;
    canViewPaymentMethods: boolean;
    canAddPaymentMethod: boolean;
    canRemovePaymentMethod: boolean;
    canSetDefaultPaymentMethod: boolean;
  };
  currentPlanCode?: string;
  paymentMethodSummary?: PaymentMethodSummary | null;
}

// ─── Mock helpers ──────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

let MOCK_SUBSCRIPTION: SubscriptionDetails = {
  userId: "usr_123",
  subscriptionType: "FREE",
  planName: "Free",
  isPremium: false,
  subscriptionStatus: null,
  uploadLimit: PLAN_CONFIG.FREE.uploadLimit,
  uploadedTracks: 1,
  remainingUploads: PLAN_CONFIG.FREE.uploadLimit - 1,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  renewalDate: null,
  expiresAt: null,
  trialStart: null,
  trialEnd: null,
  paymentMethodSummary: null,
  pendingDowngrade: null,
  perks: { adFree: false, offlineListening: false },
};

// ─── Backend normalizer ────────────────────────────────────────────────────────

function normalizeBackendSubscription(raw: Record<string, unknown>): SubscriptionDetails {
  const planCode = (raw.planCode as string) ?? "FREE";
  const subscriptionType: "FREE" | "PRO" | "GO+" =
    planCode === "GO_PLUS" ? "GO+" : planCode === "PRO" ? "PRO" : "FREE";

  const adsEnabled = (raw.adsEnabled as boolean) ?? true;
  const canDownload = (raw.canDownload as boolean) ?? false;

  // Backend sends both `paymentMethod` (object) and `paymentMethodSummary` (string).
  // We use the object so the UI can display brand/last4/expiry directly.
  const pmObj = raw.paymentMethod as {
    brand?: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
  } | null ?? null;

  const paymentMethodSummary: PaymentMethodSummary | null =
    pmObj && pmObj.brand && pmObj.last4
      ? {
          brand: pmObj.brand,
          last4: pmObj.last4,
          expiryMonth: pmObj.expiryMonth ?? 0,
          expiryYear: pmObj.expiryYear ?? 0,
          isDefault: pmObj.isDefault ?? true,
        }
      : null;

  const rawUploadLimit = raw.uploadLimit as number;
  const uploadLimit = rawUploadLimit < 0 ? Infinity : rawUploadLimit;

  return {
    userId: (raw.userId as string) ?? "",
    subscriptionType,
    planName: (raw.planName as string) ?? subscriptionType,
    isPremium: (raw.isPremium as boolean) ?? planCode !== "FREE",
    subscriptionStatus: (raw.subscriptionStatus as string) ?? null,
    uploadLimit,
    uploadedTracks: (raw.uploadedTracks as number) ?? 0,
    remainingUploads: raw.remainingUploads === null ? null : ((raw.remainingUploads as number) ?? uploadLimit),
    cancelAtPeriodEnd: (raw.cancelAtPeriodEnd as boolean) ?? false,
    currentPeriodEnd: (raw.currentPeriodEnd as string) ?? null,
    renewalDate: (raw.renewalDate as string) ?? null,
    expiresAt: (raw.expiresAt as string) ?? null,
    trialStart: (raw.trialStart as string) ?? null,
    trialEnd: (raw.trialEnd as string) ?? null,
    paymentMethodSummary,
    pendingDowngrade: (raw.pendingDowngrade as PendingDowngrade) ?? null,
    perks: {
      adFree: !adsEnabled,
      offlineListening: canDownload,
    },
  };
}

// ─── Subscription API ──────────────────────────────────────────────────────────

export const getMySubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...MOCK_SUBSCRIPTION };
  }
  const response = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(response.data);
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await api.get("/subscriptions/plans");
  return response.data as SubscriptionPlan[];
};

/**
 * Called ONLY after a successful uploadTrack() — mirrors what the real
 * backend does: it decrements the quota when it receives the file.
 */
export const decrementUploadQuota = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    if (
      MOCK_SUBSCRIPTION.remainingUploads !== null &&
      MOCK_SUBSCRIPTION.remainingUploads > 0
    ) {
      MOCK_SUBSCRIPTION = {
        ...MOCK_SUBSCRIPTION,
        remainingUploads: MOCK_SUBSCRIPTION.remainingUploads - 1,
        uploadedTracks: MOCK_SUBSCRIPTION.uploadedTracks + 1,
      };
    }
    return { ...MOCK_SUBSCRIPTION };
  }
  // Real backend decrements automatically on upload — re-fetch and normalize
  const response = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(response.data);
};

/**
 * Upgrade user to PRO or GO+ plan.
 *
 * Mock mode (NEXT_PUBLIC_USE_MOCK=true):
 *   Simulates an instant upgrade, no network call.
 *
 * Real mode (NEXT_PUBLIC_USE_MOCK=false):
 *   Calls POST /subscriptions/checkout.
 *
 *   - Mock billing provider (BILLING_PROVIDER=mock_stripe on server):
 *     Activates subscription immediately. Returns CheckoutResult.
 *
 *   - Real Stripe (BILLING_PROVIDER=stripe on server):
 *     Returns { checkoutUrl: 'https://checkout.stripe.com/...' }.
 *     Redirects the browser to that URL. Function will NOT return in this case.
 *     After payment, Stripe redirects to /subscriptions/success?session_id=...
 */
export const upgradeSubscription = async (type: "PRO" | "GO+"): Promise<CheckoutResult> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      subscriptionType: type,
      planName: type === "GO+" ? "GO+" : "Artist Pro",
      isPremium: true,
      subscriptionStatus: "ACTIVE",
      uploadLimit: PLAN_CONFIG[type].uploadLimit,
      remainingUploads: PLAN_CONFIG[type].uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: null,
      paymentMethodSummary: { brand: "visa", last4: "4242", expiryMonth: 12, expiryYear: 2030, isDefault: true },
      perks: { adFree: true, offlineListening: true },
    };
    return { subscriptionId: "sub_mock", planCode: type === "GO+" ? "GO_PLUS" : "PRO" };
  }

  const planCode = type === "GO+" ? "GO_PLUS" : "PRO";
  const response = await api.post("/subscriptions/checkout", { planCode });
  const data = response.data as CheckoutResult;

  // Real Stripe: redirect browser to hosted checkout. This function does not return.
  if (
    data.checkoutUrl &&
    data.checkoutUrl.startsWith("https://checkout.stripe.com")
  ) {
    window.location.href = data.checkoutUrl;
  }

  return data;
};

/**
 * Cancel the current subscription — schedules cancel at period end.
 * Returns the updated subscription (still active, cancelAtPeriodEnd=true).
 */
export const cancelSubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      cancelAtPeriodEnd: true,
      expiresAt: MOCK_SUBSCRIPTION.currentPeriodEnd,
      renewalDate: null,
    };
    return { ...MOCK_SUBSCRIPTION };
  }
  await api.post("/subscriptions/cancel", {});
  const refreshed = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(refreshed.data);
};

/**
 * Resume a subscription that is scheduled to cancel (clears cancelAtPeriodEnd).
 */
export const resumeSubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      cancelAtPeriodEnd: false,
      expiresAt: null,
      renewalDate: MOCK_SUBSCRIPTION.currentPeriodEnd,
    };
    return { ...MOCK_SUBSCRIPTION };
  }
  await api.post("/subscriptions/resume");
  const refreshed = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(refreshed.data);
};

/**
 * Change the active plan between PRO and GO+.
 */
export const changePlan = async (type: "PRO" | "GO+"): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      subscriptionType: type,
      planName: type === "GO+" ? "GO+" : "Artist Pro",
      uploadLimit: PLAN_CONFIG[type].uploadLimit,
      remainingUploads: PLAN_CONFIG[type].uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
    };
    return { ...MOCK_SUBSCRIPTION };
  }
  const planCode = type === "GO+" ? "GO_PLUS" : "PRO";
  await api.post("/subscriptions/change-plan", { planCode });
  const refreshed = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(refreshed.data);
};

/**
 * Fetch the billing invoice history for the current user.
 */
export const getInvoices = async (): Promise<Invoice[]> => {
  if (USE_MOCK) {
    return [];
  }
  const response = await api.get("/subscriptions/invoices");
  return response.data as Invoice[];
};

/**
 * Open the billing portal. Returns the portal URL + capabilities + payment method summary.
 * In real Stripe mode, the frontend should redirect to portalUrl.
 * In mock mode, returns a mock portal URL.
 */
export const openBillingPortal = async (
  flow?: "payment_methods" | "billing",
): Promise<BillingPortalResult> => {
  if (USE_MOCK) {
    return {
      portalSessionId: "bps_mock_123",
      portalUrl: "#",
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
      paymentMethodSummary: MOCK_SUBSCRIPTION.paymentMethodSummary,
    };
  }
  const body: Record<string, string> = {
    returnUrl: typeof window !== "undefined" ? `${window.location.origin}/settings?tab=subscription` : "/settings",
  };
  if (flow) body.flow = flow;

  const response = await api.post("/subscriptions/portal", body);
  return response.data as BillingPortalResult;
};

// ─── Offline listening ─────────────────────────────────────────────────────────

/**
 * Step 1: Check offline entitlement and get track metadata (PRO / GO+ only).
 * Returns track metadata. If 403, throws DownloadForbiddenError.
 */
export class DownloadForbiddenError extends Error {
  constructor(message?: string) {
    super(message ?? "DOWNLOAD_FORBIDDEN");
    this.name = "DownloadForbiddenError";
  }
}

export const getOfflineTrack = async (trackId: string): Promise<OfflineTrackMeta> => {
  if (USE_MOCK) {
    if (
      MOCK_SUBSCRIPTION.subscriptionType === "FREE" ||
      !MOCK_SUBSCRIPTION.perks.offlineListening
    ) {
      throw new DownloadForbiddenError();
    }
    return {
      trackId,
      title: "Mock PRO Track",
      artist: "Mock Artist",
      handle: "mockartist",
      durationMs: 214000,
      coverArtUrl: "/logo.png",
      downloadUrl: "(use /stream endpoint)",
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      expiresInSeconds: 900,
      planCode: MOCK_SUBSCRIPTION.subscriptionType === "GO+" ? "GO_PLUS" : "PRO",
    };
  }

  try {
    const response = await api.get(`/subscriptions/offline/${trackId}`);
    return response.data as OfflineTrackMeta;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 403) throw new DownloadForbiddenError();
    throw err;
  }
};

/**
 * Step 2: Download audio bytes for offline caching.
 * Returns a Blob (audio/mpeg). Store in IndexedDB via offlineAudioCache.
 */
export const downloadOfflineTrack = async (trackId: string): Promise<Blob> => {
  if (USE_MOCK) {
    if (!MOCK_SUBSCRIPTION.perks.offlineListening) {
      throw new DownloadForbiddenError();
    }
    // Return a minimal valid blob for tests/mock
    return new Blob(["mock-audio-bytes"], { type: "audio/mpeg" });
  }

  try {
    const response = await api.get(`/subscriptions/offline/${trackId}/stream`, {
      responseType: "blob",
    });
    return response.data as Blob;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 403) throw new DownloadForbiddenError();
    throw err;
  }
};

// ─── Upload quota helpers ──────────────────────────────────────────────────────

export const canUserUpload = async (): Promise<boolean> => {
  const sub = await getMySubscription();
  if (sub.remainingUploads === null) return true; // unlimited
  return sub.remainingUploads > 0;
};
