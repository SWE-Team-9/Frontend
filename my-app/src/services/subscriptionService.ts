import { PLAN_CONFIG } from "@/src/config/plans";
import api from "./api";
import {
  deletePaymentMethod as deleteSavedPaymentMethod,
  listPaymentMethods,
} from "./paymentMethodsService";

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

export interface SubscriptionPlan {
  id?: string;
  code: string;
  name?: string;
  description?: string;
  amountCents?: number;
  currency?: string;
  interval?: string;
  isActive?: boolean;
  stripePriceId?: string | null;
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
  handle?: string;
  durationMs?: number | null;
  coverArtUrl?: string | null;
  downloadUrl?: string | null;
  expiresAt?: string;
  expiresInSeconds?: number;
  planCode?: string;
}

export interface BillingPortalOptions {
  returnUrl?: string;
  flow?: "payment_methods" | string;
}

export interface BillingPortalSession {
  portalUrl: string;
  paymentMethodSummary: PaymentMethodSummary | null;
  currentPlanCode?: string;
  capabilities?: Record<string, boolean>;
}

export type UpgradeSubscriptionResult =
  | { status: "activated" }
  | { status: "redirect"; checkoutUrl: string };

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

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

const toPlanCode = (type: "PRO" | "GO+"): "PRO" | "GO_PLUS" =>
  type === "GO+" ? "GO_PLUS" : "PRO";

const getMockPeriodEnd = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

function normalizeBackendSubscription(
  raw: Record<string, unknown>,
): SubscriptionDetails {
  const rawPlan =
    typeof raw.subscriptionType === "string"
      ? raw.subscriptionType
      : typeof raw.planCode === "string"
        ? raw.planCode
        : "FREE";

  const normalizedPlan =
    rawPlan === "GO_PLUS" || rawPlan === "GO+" ? "GO+" : rawPlan === "PRO" ? "PRO" : "FREE";

  const rawPerks =
    raw.perks && typeof raw.perks === "object"
      ? (raw.perks as Record<string, unknown>)
      : null;

  const adsEnabled = typeof raw.adsEnabled === "boolean" ? raw.adsEnabled : true;
  const canDownload =
    typeof raw.canDownload === "boolean" ? raw.canDownload : false;

  return {
    userId: typeof raw.userId === "string" ? raw.userId : "",
    subscriptionType: normalizedPlan,
    uploadLimit:
      typeof raw.uploadLimit === "number" ? raw.uploadLimit : PLAN_CONFIG.FREE.uploadLimit,
    uploadedTracks: typeof raw.uploadedTracks === "number" ? raw.uploadedTracks : 0,
    remainingUploads:
      typeof raw.remainingUploads === "number"
        ? raw.remainingUploads
        : PLAN_CONFIG.FREE.uploadLimit,
    cancelAtPeriodEnd:
      typeof raw.cancelAtPeriodEnd === "boolean" ? raw.cancelAtPeriodEnd : false,
    currentPeriodEnd:
      typeof raw.currentPeriodEnd === "string" ? raw.currentPeriodEnd : null,
    paymentMethodSummary:
      raw.paymentMethodSummary &&
      typeof raw.paymentMethodSummary === "object"
        ? (raw.paymentMethodSummary as PaymentMethodSummary)
        : null,
    perks: {
      adFree:
        typeof rawPerks?.adFree === "boolean" ? rawPerks.adFree : !adsEnabled,
      offlineListening:
        typeof rawPerks?.offlineListening === "boolean"
          ? rawPerks.offlineListening
          : canDownload,
    },
  };
}

async function fetchAndNormalizeSubscription(): Promise<SubscriptionDetails> {
  const response = await api.get("/subscriptions/me");
  return normalizeBackendSubscription(response.data as Record<string, unknown>);
}

export const getMySubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...MOCK_SUBSCRIPTION };
  }

  return fetchAndNormalizeSubscription();
};

export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  if (USE_MOCK) {
    return [
      { code: "FREE", name: PLAN_CONFIG.FREE.label, amountCents: 0, isActive: true },
      { code: "PRO", name: PLAN_CONFIG.PRO.label, amountCents: 999, isActive: true },
      { code: "GO_PLUS", name: PLAN_CONFIG["GO+"].label, amountCents: 1999, isActive: true },
    ];
  }

  const response = await api.get("/subscriptions/plans");
  return response.data as SubscriptionPlan[];
};

export const decrementUploadQuota = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    if (MOCK_SUBSCRIPTION.remainingUploads > 0) {
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

export const upgradeSubscription = async (
  type: "PRO" | "GO+",
): Promise<UpgradeSubscriptionResult> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      subscriptionType: type,
      uploadLimit: PLAN_CONFIG[type].uploadLimit,
      remainingUploads:
        PLAN_CONFIG[type].uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: getMockPeriodEnd(),
      paymentMethodSummary: {
        brand: "visa",
        last4: "4242",
        expiryMonth: 12,
        expiryYear: 2030,
        isDefault: true,
      },
      perks: { adFree: true, offlineListening: true },
    };

    return { status: "activated" };
  }

  const response = await api.post("/subscriptions/checkout", {
    planCode: toPlanCode(type),
  });
  const data = response.data as Record<string, unknown>;
  const checkoutUrl =
    typeof data.checkoutUrl === "string" ? data.checkoutUrl : null;

  if (checkoutUrl && data.status !== "active" && data.scheduled !== true) {
    return { status: "redirect", checkoutUrl };
  }

  return { status: "activated" };
};

export const cancelSubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: MOCK_SUBSCRIPTION.currentPeriodEnd ?? getMockPeriodEnd(),
    };
    return { ...MOCK_SUBSCRIPTION };
  }

  await api.post("/subscriptions/cancel", {});
  return fetchAndNormalizeSubscription();
};

export class DownloadForbiddenError extends Error {
  constructor(message?: string) {
    super(message ?? "DOWNLOAD_FORBIDDEN");
    this.name = "DownloadForbiddenError";
  }
}

export const getOfflineTrack = async (trackId: string): Promise<OfflineTrack> => {
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
      downloadUrl:
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      expiresInSeconds: 900,
      planCode:
        MOCK_SUBSCRIPTION.subscriptionType === "GO+" ? "GO_PLUS" : "PRO",
    };
  }

  try {
    const response = await api.get(`/subscriptions/offline/${trackId}`);
    return response.data as OfflineTrack;
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 403) {
      throw new DownloadForbiddenError();
    }
    throw error;
  }
};

export const canUserUpload = async (): Promise<boolean> => {
  const subscription = await getMySubscription();
  return subscription.remainingUploads > 0;
};

export const resumeSubscription = async (): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    MOCK_SUBSCRIPTION = { ...MOCK_SUBSCRIPTION, cancelAtPeriodEnd: false };
    return { ...MOCK_SUBSCRIPTION };
  }

  await api.post("/subscriptions/resume");
  return fetchAndNormalizeSubscription();
};

export const changePlan = async (
  type: "PRO" | "GO+",
): Promise<SubscriptionDetails> => {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    MOCK_SUBSCRIPTION = {
      ...MOCK_SUBSCRIPTION,
      subscriptionType: type,
      uploadLimit: PLAN_CONFIG[type].uploadLimit,
      remainingUploads:
        PLAN_CONFIG[type].uploadLimit - MOCK_SUBSCRIPTION.uploadedTracks,
      perks: { adFree: true, offlineListening: true },
    };
    return { ...MOCK_SUBSCRIPTION };
  }

  await api.post("/subscriptions/change-plan", {
    planCode: toPlanCode(type),
  });
  return fetchAndNormalizeSubscription();
};

export const getInvoices = async (): Promise<Invoice[]> => {
  if (USE_MOCK) {
    return [];
  }

  const response = await api.get("/subscriptions/invoices");
  return response.data as Invoice[];
};

export const openBillingPortal = async (
  options?: BillingPortalOptions,
): Promise<BillingPortalSession> => {
  if (USE_MOCK) {
    return {
      portalUrl: "#",
      paymentMethodSummary: MOCK_SUBSCRIPTION.paymentMethodSummary,
      currentPlanCode:
        MOCK_SUBSCRIPTION.subscriptionType === "GO+"
          ? "GO_PLUS"
          : MOCK_SUBSCRIPTION.subscriptionType,
    };
  }

  const returnUrl =
    options?.returnUrl ??
    (typeof window !== "undefined" ? window.location.href : "/settings");

  const response = await api.post("/subscriptions/portal", {
    returnUrl,
    flow: options?.flow,
  });

  return {
    portalUrl: response.data.portalUrl as string,
    paymentMethodSummary:
      (response.data.paymentMethodSummary as PaymentMethodSummary) ?? null,
    currentPlanCode: response.data.currentPlanCode as string | undefined,
    capabilities: response.data.capabilities as Record<string, boolean> | undefined,
  };
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
      currentPeriodEnd:
        MOCK_SUBSCRIPTION.subscriptionType !== "FREE"
          ? MOCK_SUBSCRIPTION.currentPeriodEnd ?? getMockPeriodEnd()
          : MOCK_SUBSCRIPTION.currentPeriodEnd,
    };
    return { ...MOCK_SUBSCRIPTION };
  }

  const paymentMethods = await listPaymentMethods();
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