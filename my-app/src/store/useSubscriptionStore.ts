import { create } from "zustand";
import {
  getMySubscription,
  upgradeSubscription,
  cancelSubscription,
  SubscriptionDetails,
} from "@/src/services/subscriptionService";

// ─── Mock saved payment methods (يتجوا من الـ backend حقيقي) ───────────────
export interface SavedCard {
  id: string;
  last4: string;
  brand: string;   // "visa" | "mastercard" | "amex"
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

let MOCK_CARDS: SavedCard[] = [
  {
    id: "card_mock_001",
    last4: "4242",
    brand: "visa",
    expMonth: 12,
    expYear: 28,
    isDefault: true,
  },
];

interface SubscriptionStore {
  sub: SubscriptionDetails | null;
  cards: SavedCard[];
  isLoading: boolean;
  error: string | null;

  fetchSubscription: () => Promise<void>;
  upgrade: (type: "PRO" | "GO+") => Promise<void>;
  cancel: () => Promise<void>;
  setSubDirectly: (sub: SubscriptionDetails) => void;

  // Payment methods
  addCard: (card: Omit<SavedCard, "id" | "isDefault">) => void;
  removeCard: (cardId: string) => void;
  setDefaultCard: (cardId: string) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  sub: null,
  cards: MOCK_CARDS,
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
      const updated = await getMySubscription();
      set({ sub: updated });
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
    } finally {
      set({ isLoading: false });
    }
  },

  setSubDirectly: (sub) => set({ sub }),

  addCard: (card) => {
    const newCard: SavedCard = {
      ...card,
      id: `card_mock_${Date.now()}`,
      isDefault: get().cards.length === 0,
    };
    MOCK_CARDS = [...get().cards, newCard];
    set({ cards: MOCK_CARDS });
  },

  removeCard: (cardId) => {
    MOCK_CARDS = get().cards.filter((c) => c.id !== cardId);
    set({ cards: MOCK_CARDS });
  },

  setDefaultCard: (cardId) => {
    MOCK_CARDS = get().cards.map((c) => ({ ...c, isDefault: c.id === cardId }));
    set({ cards: MOCK_CARDS });
  },
}));