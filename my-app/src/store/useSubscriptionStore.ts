import { create } from "zustand";
import {
  getMySubscription,
  upgradeSubscription,
  SubscriptionDetails,
} from "@/src/services/subscriptionService";

interface SubscriptionStore {
  sub: SubscriptionDetails | null;
  isLoading: boolean;
  error: string | null;

  fetchSubscription: () => Promise<void>;
  upgrade: (type: "PRO" | "GO+") => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  sub: null,
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
      await upgradeSubscription(type);
      // Re-fetch to get the updated sub from server (or mock)
      const updated = await getMySubscription();
      set({ sub: updated });
    } catch {
      set({ error: "Upgrade failed. Please try again." });
    } finally {
      set({ isLoading: false });
    }
  },
}));