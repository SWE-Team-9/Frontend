import { create } from "zustand";
import {
  listPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  attachPaymentMethod,
  createSetupIntent,
  PaymentMethod,
  DeletePaymentMethodResult,
  AttachPaymentMethodDto,
} from "@/src/services/paymentMethodService";

interface PaymentMethodsStore {
  methods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
  /** Result from the last delete — non-null when subscription was auto-cancelled */
  lastDeleteResult: DeletePaymentMethodResult | null;

  fetchMethods: () => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  deleteMethod: (id: string) => Promise<DeletePaymentMethodResult>;
  getSetupIntent: () => Promise<string>;
  attachMethod: (dto: AttachPaymentMethodDto) => Promise<PaymentMethod>;
  clearError: () => void;
}

export const usePaymentMethodsStore = create<PaymentMethodsStore>((set) => ({
  methods: [],
  isLoading: false,
  error: null,
  lastDeleteResult: null,

  fetchMethods: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await listPaymentMethods();
      set({ methods: data });
    } catch {
      set({ error: "Failed to load payment methods." });
    } finally {
      set({ isLoading: false });
    }
  },

  setDefault: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await setDefaultPaymentMethod(id);
      // Refetch to get the updated sort order (default first)
      const data = await listPaymentMethods();
      set({ methods: data });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to set default payment method.";
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMethod: async (id) => {
    set({ isLoading: true, error: null, lastDeleteResult: null });
    try {
      const result = await deletePaymentMethod(id);
      set({ lastDeleteResult: result });
      // Refetch list
      const data = await listPaymentMethods();
      set({ methods: data });
      return result;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to remove payment method.";
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  getSetupIntent: async () => {
    const result = await createSetupIntent();
    return result.clientSecret;
  },

  attachMethod: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const method = await attachPaymentMethod(dto);
      // Refetch list to get proper sort order
      const data = await listPaymentMethods();
      set({ methods: data });
      return method;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to add payment method.";
      set({ error: msg });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
