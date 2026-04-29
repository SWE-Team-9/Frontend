import { create } from "zustand";
import {
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
  resumeSubscription,
  changePlan as changePlanService,
  getInvoices,
  removePaymentMethod as removePaymentMethodService,
  SubscriptionDetails,
  Invoice,
  UpgradeSubscriptionResult,
} from "@/src/services/subscriptionService";

interface SubscriptionStore {
  sub: SubscriptionDetails | null;
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;

  fetchSubscription: () => Promise<void>;
  upgrade: (type: "PRO" | "GO+") => Promise<UpgradeSubscriptionResult>;
  cancel: () => Promise<void>;
  resume: () => Promise<void>;
  changePlan: (type: "PRO" | "GO+") => Promise<void>;
  removePaymentMethod: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  setSubDirectly: (sub: SubscriptionDetails) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  sub: null,
  invoices: [],
  isLoading: false,
  error: null,

  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getMySubscription();
      set({ sub: data });
    } catch {
      set({ error: "Failed to load subscription." });
    } finally {
      set({ isLoading: false });
    }
  },

  upgrade: async (type) => {
    set({ isLoading: true, error: null });
    try {
      const result = await upgradeSubscription(type);
      if (result.status === "activated") {
        const updated = await getMySubscription();
        set({ sub: updated });
      }
      return result;
    } catch {
      set({ error: "Upgrade failed." });
      throw new Error("Upgrade failed");
    } finally {
      set({ isLoading: false });
    }
  },

  cancel: async () => {
    set({ isLoading: true, error: null });
    try {
      const updated = await cancelSubscription();
      set({ sub: updated });
    } catch {
      set({ error: "Cancellation failed. Please try again." });
      throw new Error("Cancellation failed");
    } finally {
      set({ isLoading: false });
    }
  },

  resume: async () => {
    set({ isLoading: true, error: null });
    try {
      const updated = await resumeSubscription();
      set({ sub: updated });
    } catch {
      set({ error: "Failed to resume subscription." });
      throw new Error("Failed to resume subscription");
    } finally {
      set({ isLoading: false });
    }
  },

  changePlan: async (type) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await changePlanService(type);
      set({ sub: updated });
    } catch {
      set({ error: "Plan change failed." });
      throw new Error("Plan change failed");
    } finally {
      set({ isLoading: false });
    }
  },

  removePaymentMethod: async () => {
    set({ isLoading: true, error: null });
    try {
      const updated = await removePaymentMethodService();
      set({ sub: updated });
    } catch {
      set({ error: "Failed to remove payment method." });
      throw new Error("Failed to remove payment method");
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInvoices: async () => {
    try {
      const data = await getInvoices();
      set({ invoices: data });
    } catch {
      // Non-fatal — purchase history just shows empty
    }
  },

  setSubDirectly: (sub) => set({ sub }),
}));