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
  /** Normalized display type: "FREE" | "PRO" | "GO+" */
  subscriptionType: "FREE" | "PRO" | "GO+";
  /** Raw backend planCode: "FREE" | "PRO" | "GO_PLUS" */
  planCode: string;
  planName: string;
  isPremium: boolean;
  /** Backend status: FREE | ACTIVE | TRIALING | PAST_DUE | CANCELED | INCOMPLETE */
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
  latestInvoice: Invoice | null;
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

// ─── Backend normalizer ────────────────────────────────────────────────────────

export function normalizeBackendSubscription(raw: Record<string, unknown>): SubscriptionDetails {  const rawPlanCode = (raw.planCode as string) ?? "FREE";
  const planCode = rawPlanCode === "GO_PLUS" ? "GO+" : rawPlanCode;
  
const subscriptionType: "FREE" | "PRO" | "GO+" = 
    planCode === "GO+" ? "GO+" : planCode === "PRO" ? "PRO" : "FREE";
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
    planCode,
    planName: PLAN_CONFIG[subscriptionType]?.label || (raw.planName as string) || subscriptionType,
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
    latestInvoice: (raw.latestInvoice as Invoice) ?? null,
    perks: {
      adFree: !adsEnabled,
      offlineListening: canDownload,
    },
    
  };
}

// ─── Subscription API ──────────────────────────────────────────────────────────

export const getMySubscription = async (): Promise<SubscriptionDetails> => {
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
  // Real backend decrements automatically on upload — re-fetch and normalize
  const response = await api.get("/subscriptions/me");
  const normalized = normalizeBackendSubscription(response.data);

  // Keep backward compatibility with callers/tests that expect FREE payloads
  // without a planCode field after quota refresh.
  if (normalized.subscriptionType === "FREE") {
    const rest: Partial<SubscriptionDetails> = { ...normalized };
    delete rest.planCode;
    return rest as SubscriptionDetails;
  }

  return normalized;
};

/**
 * Upgrade user to PRO or GO+ plan.
 *
 * Calls POST /subscriptions/checkout and returns the backend checkout result.
 * The caller redirects only when the backend provides checkoutUrl.
 */
export const upgradeSubscription = async (type: "PRO" | "GO+"): Promise<CheckoutResult> => {
  const planCode = type === "GO+" ? "GO_PLUS" : "PRO";
  const response = await api.post("/subscriptions/checkout", { planCode });
  return response.data as CheckoutResult;
};

/**
 * Cancel the current subscription — schedules cancel at period end.
 * Returns the updated subscription (still active, cancelAtPeriodEnd=true).
 */
export const cancelSubscription = async (): Promise<SubscriptionDetails> => {
  await api.post("/subscriptions/cancel", {});
  const refreshed = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(refreshed.data);
};

/**
 * Resume a subscription that is scheduled to cancel (clears cancelAtPeriodEnd).
 */
export const resumeSubscription = async (): Promise<SubscriptionDetails> => {
  await api.post("/subscriptions/resume");
  const refreshed = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(refreshed.data);
};

/**
 * Change the active plan between PRO and GO+.
 */
export const changePlan = async (type: "PRO" | "GO+"): Promise<SubscriptionDetails> => {
  const planCode = type === "GO+" ? "GO_PLUS" : "PRO";
  await api.post("/subscriptions/change-plan", { planCode });
  const refreshed = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(refreshed.data);
};

/**
 * Fetch the billing invoice history for the current user.
 */
export const getInvoices = async (): Promise<Invoice[]> => {
  const response = await api.get("/subscriptions/invoices");
  return response.data as Invoice[];
};

/**
 * Open the billing portal. Returns the portal URL + capabilities + payment method summary.
 * The frontend should redirect to the backend-provided portalUrl when needed.
 */
export const openBillingPortal = async (
  flow?: "payment_methods" | "billing",
): Promise<BillingPortalResult> => {
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
