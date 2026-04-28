import api from "./api";
import { PLAN_CONFIG } from "@/src/config/plans";
/**
 * Data structures for Subscription and Offline tracks
 */
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
  amountPaidCents: number;
  currency: string;
  status: string;
  planName: string;
  paidAt: string | null;
  createdAt: string;
}

export interface SubscriptionDetails {
  userId: string;
  subscriptionType: "FREE" | "PRO" | "GO+";
  uploadLimit: number;
  uploadedTracks: number;
  remainingUploads: number;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  paymentMethodSummary: PaymentMethodSummary | null;
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
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  paymentMethodSummary: null,
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
    cancelAtPeriodEnd: (raw.cancelAtPeriodEnd as boolean) ?? false,
    currentPeriodEnd: (raw.currentPeriodEnd as string) ?? null,
    paymentMethodSummary: (raw.paymentMethodSummary as PaymentMethodSummary) ?? null,
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
 * Upgrade user to PRO or GO+ plan.
 *
 * Mock mode (NEXT_PUBLIC_USE_MOCK=true):
 *   Simulates an instant upgrade, no network call.
 *
 * Real mode (NEXT_PUBLIC_USE_MOCK=false):
 *   Calls POST /subscriptions/checkout.
 *
 *   - Mock billing provider (BILLING_PROVIDER=mock_stripe on server):
 *     Returns { status: 'active', ... } — subscription activated immediately.
 *
 *   - Real Stripe (BILLING_PROVIDER=stripe on server):
 *     Returns { checkoutUrl: 'https://checkout.stripe.com/...' }.
 *     This function redirects the browser to that URL so Stripe can collect
 *     payment. The function will NOT return in this case — the page navigates away.
 *     After payment, Stripe redirects to /subscriptions/success.
 */
export const upgradeSubscription = async (type: "PRO" | "GO+") => {
  if (!USE_MOCK) {
    // Map frontend plan key to backend planCode
    const planCode = type === "GO+" ? "GO_PLUS" : "PRO";
    const response = await api.post("/subscriptions/checkout", { planCode });
    const data = response.data as {
      checkoutUrl?: string;
      scheduled?: boolean;
      [key: string]: unknown;
    };

    // Real Stripe: redirect the browser to the Stripe Hosted Checkout page.
    // The browser navigates away — this function effectively does not return.
    if (
      data.checkoutUrl &&
      (data.checkoutUrl.startsWith("https://checkout.stripe.com/") ||
        data.checkoutUrl.startsWith("https://checkout.stripe.com"))
    ) {
      window.location.href = data.checkoutUrl;
      // Return a sentinel so TypeScript is satisfied (navigation is async)
      return data;
    }

    // Mock billing provider or downgrade scheduled: return as-is
    return data;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));

  MOCK_SUBSCRIPTION = {
  ...MOCK_SUBSCRIPTION,
  subscriptionType: type,
  uploadLimit: PLAN_CONFIG[type].uploadLimit,
  remainingUploads: PLAN_CONFIG[type].uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  paymentMethodSummary: { brand: "visa", last4: "4242", expiryMonth: 12, expiryYear: 2030, isDefault: true },
  perks: { adFree: true, offlineListening: true },
};

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
  uploadLimit: PLAN_CONFIG.FREE.uploadLimit,
  remainingUploads: PLAN_CONFIG.FREE.uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  paymentMethodSummary: null,
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
  constructor(message?: string) {
    super(message ?? "DOWNLOAD_FORBIDDEN");
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

/**
 * Resume a subscription that is scheduled to cancel (clears cancelAtPeriodEnd).
 */
export const resumeSubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    MOCK_SUBSCRIPTION = { ...MOCK_SUBSCRIPTION, cancelAtPeriodEnd: false };
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
    const planCode = type === "GO+" ? "GO_PLUS" : "PRO";
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      subscriptionType: type,
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
 * Open the billing portal and return the portal URL + payment method summary.
 * Redirects to Stripe's hosted portal in production; returns mock data in dev.
 */
export const openBillingPortal = async (): Promise<{ portalUrl: string; paymentMethodSummary: PaymentMethodSummary | null }> => {
  if (USE_MOCK) {
    return {
      portalUrl: "#",
      paymentMethodSummary: MOCK_SUBSCRIPTION.paymentMethodSummary,
    };
  }
  const response = await api.post("/subscriptions/portal", {
    returnUrl: window.location.href,
  });
  return {
    portalUrl: response.data.portalUrl as string,
    paymentMethodSummary: (response.data.paymentMethodSummary as PaymentMethodSummary) ?? null,
  };
};