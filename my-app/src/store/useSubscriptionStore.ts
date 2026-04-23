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

/**
 * Subscription Store using Zustand
 * Manages global subscription state, including upload limits and perks.
 */
export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  sub: null,
  isLoading: false,
  error: null,

  /**
   * Fetch subscription details from the API (GET /api/v1/subscriptions/me) 
   * Updates the 'sub' state to reflect current upload quota and perks 
   */
  fetchSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      // API call to retrieve user subscription info 
      const data = await getMySubscription();
      set({ sub: data });
    } catch (error) {
      console.error("Store: Failed to fetch subscription", error);
      set({ error: "Failed to load subscription." });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Upgrade the user's plan (POST /api/v1/subscriptions/subscribe) 
   * Updates user to PRO or GO+ and refreshes limits 
   */
  upgrade: async (type) => {
    set({ isLoading: true, error: null });
    try {
      // Trigger the upgrade API 
      await upgradeSubscription(type);
      
      // Re-fetch to get the updated subscription details (new limits and perks) 
      const updated = await getMySubscription();
      set({ sub: updated });
    } catch (error) {
      console.error("Store: Upgrade failed", error);
      set({ error: "Upgrade failed. Please try again." });
    } finally {
      set({ isLoading: false });
    }
  },
}));