import api from "./api";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─── Backend response types ────────────────────────────────────────────────────

export type SubscriptionUiType = "FREE" | "PRO" | "GO+";
export type BackendPlanCode = "FREE" | "PRO" | "GO_PLUS";

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
  subscriptionType: SubscriptionUiType;
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

export interface BillingPortalOptions {
  flow?: "payment_methods" | "billing";
  returnUrl?: string;
}

export type BillingPortalSession = BillingPortalResult;

interface SavedPaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

// ─── Mock helpers ──────────────────────────────────────────────────────────────

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const getMockPeriodEnd = (): string =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

const toPlanCode = (type: SubscriptionUiType | BackendPlanCode): BackendPlanCode => {
  if (type === "GO+") return "GO_PLUS";
  if (type === "GO_PLUS") return "GO_PLUS";
  if (type === "PRO") return "PRO";
  return "FREE";
};

const toSubscriptionUiType = (planCode?: string | null): SubscriptionUiType => {
  if (planCode === "GO_PLUS" || planCode === "GO+") return "GO+";
  if (planCode === "PRO") return "PRO";
  return "FREE";
};

const getPlanConfig = (type: SubscriptionUiType) => {
  return PLAN_CONFIG[type] ?? PLAN_CONFIG.FREE;
};

let MOCK_HAS_USED_PRO_TRIAL = false;

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

const normalizePaymentMethod = (
  raw: Record<string, unknown>,
): PaymentMethodSummary | null => {
  const paymentMethod =
    (raw.paymentMethod as Partial<PaymentMethodSummary> | null | undefined) ??
    (raw.paymentMethodSummary &&
    typeof raw.paymentMethodSummary === "object"
      ? (raw.paymentMethodSummary as Partial<PaymentMethodSummary>)
      : null);

  if (!paymentMethod?.brand || !paymentMethod?.last4) {
    return null;
  }

  return {
    brand: paymentMethod.brand,
    last4: paymentMethod.last4,
    expiryMonth: paymentMethod.expiryMonth ?? 0,
    expiryYear: paymentMethod.expiryYear ?? 0,
    isDefault: paymentMethod.isDefault ?? true,
  };
};

const normalizePendingDowngrade = (
  value: unknown,
): PendingDowngrade | null => {
  if (!value || typeof value !== "object") return null;

  const pending = value as Partial<PendingDowngrade>;

  if (!pending.planCode || !pending.effectiveAt) return null;

  return {
    planCode: pending.planCode,
    planId: pending.planId ?? "",
    planName: pending.planName ?? toSubscriptionUiType(pending.planCode),
    effectiveAt: pending.effectiveAt,
  };
};

export function normalizeBackendSubscription(
  raw: Record<string, unknown>,
): SubscriptionDetails {
  const rawPlanCode =
    (raw.planCode as string | null | undefined) ??
    (raw.subscriptionType as string | null | undefined) ??
    "FREE";

  const subscriptionType = toSubscriptionUiType(rawPlanCode);
  const planCode = toPlanCode(subscriptionType);

  const adsEnabled = (raw.adsEnabled as boolean | undefined) ?? true;
  const canDownload = (raw.canDownload as boolean | undefined) ?? false;

  const rawUploadLimit =
    typeof raw.uploadLimit === "number"
      ? raw.uploadLimit
      : PLAN_CONFIG.FREE.uploadLimit;

  const uploadLimit = rawUploadLimit < 0 ? Infinity : rawUploadLimit;

  const uploadedTracks =
    typeof raw.uploadedTracks === "number" ? raw.uploadedTracks : 0;

  const remainingUploads =
    raw.remainingUploads === null
      ? null
      : typeof raw.remainingUploads === "number"
        ? raw.remainingUploads
        : uploadLimit === Infinity
          ? null
          : Math.max(uploadLimit - uploadedTracks, 0);

  return {
    userId: typeof raw.userId === "string" ? raw.userId : "",
    subscriptionType,
    planName:
      typeof raw.planName === "string" && raw.planName.trim().length > 0
        ? raw.planName
        : subscriptionType,
    isPremium:
      typeof raw.isPremium === "boolean" ? raw.isPremium : planCode !== "FREE",
    subscriptionStatus:
      typeof raw.subscriptionStatus === "string"
        ? raw.subscriptionStatus
        : null,
    uploadLimit,
    uploadedTracks,
    remainingUploads,
    cancelAtPeriodEnd:
      typeof raw.cancelAtPeriodEnd === "boolean"
        ? raw.cancelAtPeriodEnd
        : false,
    currentPeriodEnd:
      typeof raw.currentPeriodEnd === "string" ? raw.currentPeriodEnd : null,
    renewalDate: typeof raw.renewalDate === "string" ? raw.renewalDate : null,
    expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : null,
    trialStart: typeof raw.trialStart === "string" ? raw.trialStart : null,
    trialEnd: typeof raw.trialEnd === "string" ? raw.trialEnd : null,
    paymentMethodSummary: normalizePaymentMethod(raw),
    pendingDowngrade: normalizePendingDowngrade(raw.pendingDowngrade),
    perks: {
      adFree: !adsEnabled,
      offlineListening: canDownload,
    },
  };
}

const fetchAndNormalizeSubscription = async (): Promise<SubscriptionDetails> => {
  const response = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(response.data);
};

// ─── Subscription API ──────────────────────────────────────────────────────────

export const getMySubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...MOCK_SUBSCRIPTION };
  }

  return fetchAndNormalizeSubscription();
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await api.get("/subscriptions/plans");
  return response.data as SubscriptionPlan[];
};

/**
 * Called ONLY after a successful uploadTrack().
 * The real backend decrements quota on upload, so real mode just re-fetches.
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

  return fetchAndNormalizeSubscription();
};

/**
 * Start checkout / upgrade flow for PRO or GO+.
 *
 * Important business rules:
 * - Free trial is PRO only.
 * - Trial is only for first-time PRO subscription.
 * - GO+ must not be treated as trial by the frontend.
 * - Real checkout amounts must come from the backend response.
 */
export const upgradeSubscription = async (
  type: "PRO" | "GO+",
): Promise<CheckoutResult> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const planCode = toPlanCode(type);
    const plan = getPlanConfig(type);
    const periodEnd = getMockPeriodEnd();

    const trialEligible = type === "PRO" && !MOCK_HAS_USED_PRO_TRIAL;
    const trialDays = trialEligible ? plan.trialDays ?? 0 : 0;
    const trialEndsAt =
      trialEligible && trialDays > 0
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      subscriptionType: type,
      planName: type === "GO+" ? "GO+" : "Artist Pro",
      isPremium: true,
      subscriptionStatus: trialEligible ? "TRIALING" : "ACTIVE",
      uploadLimit: plan.uploadLimit,
      remainingUploads:
        plan.uploadLimit < 0
          ? null
          : Math.max(plan.uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks, 0),
      cancelAtPeriodEnd: false,
      currentPeriodEnd: periodEnd,
      renewalDate: periodEnd,
      expiresAt: null,
      trialStart: trialEligible ? new Date().toISOString() : null,
      trialEnd: trialEndsAt,
      pendingDowngrade: null,
      paymentMethodSummary: {
        brand: "visa",
        last4: "4242",
        expiryMonth: 12,
        expiryYear: 2030,
        isDefault: true,
      },
      perks: {
        adFree: true,
        offlineListening: true,
      },
    };

    if (trialEligible) {
      MOCK_HAS_USED_PRO_TRIAL = true;
    }

    return {
      subscriptionId: "sub_mock",
      planCode,
      trialEligible,
      trialDays,
      trialEndsAt,
      amountDueNowCents: trialEligible ? 0 : plan.priceCents ?? 0,
      priceCents: plan.priceCents ?? 0,
      renewsAt: periodEnd,
    };
  }

  const planCode = toPlanCode(type);
  const response = await api.post("/subscriptions/checkout", { planCode });
  const data = response.data as CheckoutResult;

  if (
    data.checkoutUrl &&
    data.checkoutUrl.startsWith("https://checkout.stripe.com")
  ) {
    window.location.href = data.checkoutUrl;
  }

  return data;
};

/**
 * Alias kept for checkout pages that use a more explicit name.
 */
export const createCheckoutSession = upgradeSubscription;

/**
 * Cancel the current subscription.
 * This schedules cancellation at period end.
 * It must NOT create or display a pending downgrade.
 */
export const cancelSubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      cancelAtPeriodEnd: true,
      expiresAt: MOCK_SUBSCRIPTION.currentPeriodEnd ?? getMockPeriodEnd(),
      renewalDate: null,
      pendingDowngrade: null,
    };

    return { ...MOCK_SUBSCRIPTION };
  }

  await api.post("/subscriptions/cancel", {});
  return fetchAndNormalizeSubscription();
};

/**
 * Resume a subscription that is scheduled to cancel.
 */
export const resumeSubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));

    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      cancelAtPeriodEnd: false,
      expiresAt: null,
      renewalDate: MOCK_SUBSCRIPTION.currentPeriodEnd ?? getMockPeriodEnd(),
    };

    return { ...MOCK_SUBSCRIPTION };
  }

  await api.post("/subscriptions/resume");
  return fetchAndNormalizeSubscription();
};

/**
 * Schedule a plan change.
 *
 * Important:
 * - Downgrades/switches should not be shown as immediately applied unless the
 *   backend explicitly applies them.
 * - The UI should use pendingDowngrade/effectiveAt to show a scheduled change.
 */
export const changePlan = async (
  type: "PRO" | "GO+",
): Promise<
  SubscriptionDetails & {
    scheduled?: boolean;
    effectiveAt?: string;
    message?: string;
  }
> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const effectiveAt =
      MOCK_SUBSCRIPTION.currentPeriodEnd ?? MOCK_SUBSCRIPTION.renewalDate ?? getMockPeriodEnd();

    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      cancelAtPeriodEnd: false,
      pendingDowngrade: {
        planCode: toPlanCode(type),
        planId: "mock-plan-id",
        planName: type === "GO+" ? "GO+" : "Artist Pro",
        effectiveAt,
      },
    };

    return {
      ...MOCK_SUBSCRIPTION,
      scheduled: true,
      effectiveAt,
      message: `Plan change scheduled for ${new Date(effectiveAt).toLocaleDateString()}.`,
    };
  }

  await api.post("/subscriptions/change-plan", {
    planCode: toPlanCode(type),
  });

  return fetchAndNormalizeSubscription();
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
 * Open the billing portal.
 */
export const openBillingPortal = async (
  optionsOrFlow?: BillingPortalOptions | BillingPortalOptions["flow"],
): Promise<BillingPortalSession> => {
  const options: BillingPortalOptions =
    typeof optionsOrFlow === "string"
      ? { flow: optionsOrFlow }
      : optionsOrFlow ?? {};

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
      currentPlanCode: toPlanCode(MOCK_SUBSCRIPTION.subscriptionType),
      paymentMethodSummary: MOCK_SUBSCRIPTION.paymentMethodSummary,
    };
  }

  const returnUrl =
    options.returnUrl ??
    (typeof window !== "undefined"
      ? `${window.location.origin}/settings?tab=subscription`
      : "/settings");

  const response = await api.post("/subscriptions/portal", {
    returnUrl,
    flow: options.flow,
  });

  return response.data as BillingPortalSession;
};

// ─── Payment method helpers ────────────────────────────────────────────────────

const listSavedPaymentMethods = async (): Promise<SavedPaymentMethod[]> => {
  const response = await api.get("/payment-methods");

  if (Array.isArray(response.data)) {
    return response.data as SavedPaymentMethod[];
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    Array.isArray((response.data as { paymentMethods?: unknown }).paymentMethods)
  ) {
    return (response.data as { paymentMethods: SavedPaymentMethod[] })
      .paymentMethods;
  }

  return [];
};

const deleteSavedPaymentMethod = async (paymentMethodId: string): Promise<void> => {
  await api.delete(`/payment-methods/${paymentMethodId}`);
};

export const removePaymentMethod = async (
  paymentMethodId?: string,
): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      paymentMethodSummary: null,
      cancelAtPeriodEnd:
        MOCK_SUBSCRIPTION.subscriptionType !== "FREE"
          ? true
          : MOCK_SUBSCRIPTION.cancelAtPeriodEnd,
      expiresAt:
        MOCK_SUBSCRIPTION.subscriptionType !== "FREE"
          ? MOCK_SUBSCRIPTION.currentPeriodEnd ?? getMockPeriodEnd()
          : MOCK_SUBSCRIPTION.expiresAt,
      renewalDate:
        MOCK_SUBSCRIPTION.subscriptionType !== "FREE"
          ? null
          : MOCK_SUBSCRIPTION.renewalDate,
      pendingDowngrade: null,
    };

    return { ...MOCK_SUBSCRIPTION };
  }

  const paymentMethods = await listSavedPaymentMethods();

  const targetMethod =
    paymentMethods.find((method) => method.id === paymentMethodId) ??
    paymentMethods.find((method) => method.isDefault) ??
    paymentMethods[0];

  if (!targetMethod) {
    throw new Error("No saved payment method found.");
  }

  await deleteSavedPaymentMethod(targetMethod.id);
  return fetchAndNormalizeSubscription();
};

// ─── Offline listening ─────────────────────────────────────────────────────────

export class DownloadForbiddenError extends Error {
  constructor(message?: string) {
    super(message ?? "DOWNLOAD_FORBIDDEN");
    this.name = "DownloadForbiddenError";
  }
}

/**
 * Step 1: Check offline entitlement and get track metadata.
 */
export const getOfflineTrack = async (
  trackId: string,
): Promise<OfflineTrackMeta> => {
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
      planCode: toPlanCode(MOCK_SUBSCRIPTION.subscriptionType),
    };
  }

  try {
    const response = await api.get(`/subscriptions/offline/${trackId}`);
    return response.data as OfflineTrackMeta;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status === 403) throw new DownloadForbiddenError();
    throw err;
  }
};

/**
 * Step 2: Download audio bytes for offline caching.
 */
export const downloadOfflineTrack = async (trackId: string): Promise<Blob> => {
  if (USE_MOCK) {
    if (!MOCK_SUBSCRIPTION.perks.offlineListening) {
      throw new DownloadForbiddenError();
    }

    return new Blob(["mock-audio-bytes"], { type: "audio/mpeg" });
  }

  try {
    const response = await api.get(`/subscriptions/offline/${trackId}/stream`, {
      responseType: "blob",
    });
    return response.data as Blob;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status === 403) throw new DownloadForbiddenError();
    throw err;
  }
};

// ─── Upload quota helpers ──────────────────────────────────────────────────────

export const canUserUpload = async (): Promise<boolean> => {
  const subscription = await getMySubscription();

  if (subscription.remainingUploads === null) {
    return true;
  }

  return subscription.remainingUploads > 0;
};