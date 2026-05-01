/**
 * usePaymentMethodsStore.test.ts
 *
 * Tests for the payment methods Zustand store.
 * Mocks the paymentMethodService to test store behavior in isolation.
 */

import { act } from "@testing-library/react";

export {};

// ── Mock service ──────────────────────────────────────────────────────────────

const mockListPaymentMethods = jest.fn();
const mockSetDefaultPaymentMethod = jest.fn();
const mockDeletePaymentMethod = jest.fn();
const mockCreateSetupIntent = jest.fn();
const mockAttachPaymentMethod = jest.fn();

jest.mock("@/src/services/paymentMethodService", () => ({
  listPaymentMethods: (...args: unknown[]) => mockListPaymentMethods(...args),
  setDefaultPaymentMethod: (...args: unknown[]) => mockSetDefaultPaymentMethod(...args),
  deletePaymentMethod: (...args: unknown[]) => mockDeletePaymentMethod(...args),
  createSetupIntent: (...args: unknown[]) => mockCreateSetupIntent(...args),
  attachPaymentMethod: (...args: unknown[]) => mockAttachPaymentMethod(...args),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const VISA = {
  id: "pm-1",
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2028,
  cardholderName: "Jane Doe",
  isDefault: true,
  createdAt: "2026-04-28T10:00:00.000Z",
};

const MC = {
  id: "pm-2",
  brand: "mastercard",
  last4: "5555",
  expMonth: 6,
  expYear: 2027,
  cardholderName: null,
  isDefault: false,
  createdAt: "2026-03-01T08:00:00.000Z",
};

// ── Helper to get a fresh store ───────────────────────────────────────────────

async function getStore() {
  const { usePaymentMethodsStore } = await import("@/src/store/usePaymentMethodsStore");
  return usePaymentMethodsStore;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("usePaymentMethodsStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  // ── fetchMethods ───────────────────────────────────────────────────────────

  describe("fetchMethods", () => {
    it("sets methods on success", async () => {
      mockListPaymentMethods.mockResolvedValue([VISA, MC]);
      const store = await getStore();

      await act(async () => {
        await store.getState().fetchMethods();
      });

      const state = store.getState();
      expect(state.methods).toHaveLength(2);
      expect(state.methods[0].brand).toBe("visa");
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      mockListPaymentMethods.mockRejectedValue(new Error("Network error"));
      const store = await getStore();

      await act(async () => {
        await store.getState().fetchMethods();
      });

      const state = store.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });

    it("returns empty array when no methods", async () => {
      mockListPaymentMethods.mockResolvedValue([]);
      const store = await getStore();

      await act(async () => {
        await store.getState().fetchMethods();
      });

      expect(store.getState().methods).toEqual([]);
    });
  });

  // ── setDefault ─────────────────────────────────────────────────────────────

  describe("setDefault", () => {
    it("calls setDefaultPaymentMethod and refetches list", async () => {
      const updatedMC = { ...MC, isDefault: true };
      const updatedVisa = { ...VISA, isDefault: false };
      mockSetDefaultPaymentMethod.mockResolvedValue(updatedMC);
      mockListPaymentMethods.mockResolvedValue([updatedMC, updatedVisa]);
      const store = await getStore();

      await act(async () => {
        await store.getState().setDefault("pm-2");
      });

      expect(mockSetDefaultPaymentMethod).toHaveBeenCalledWith("pm-2");
      expect(mockListPaymentMethods).toHaveBeenCalled();
      const state = store.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error and rethrows on failure", async () => {
      const err = new Error("Not found");
      mockSetDefaultPaymentMethod.mockRejectedValue(err);
      mockListPaymentMethods.mockResolvedValue([]);
      const store = await getStore();

      await expect(
        act(async () => {
          await store.getState().setDefault("nonexistent");
        }),
      ).rejects.toThrow();

      expect(store.getState().isLoading).toBe(false);
    });
  });

  // ── deleteMethod ───────────────────────────────────────────────────────────

  describe("deleteMethod", () => {
    it("deletes method and refetches list", async () => {
      mockDeletePaymentMethod.mockResolvedValue({});
      mockListPaymentMethods.mockResolvedValue([VISA]);
      const store = await getStore();

      const result = await act(async () => {
        return store.getState().deleteMethod("pm-2");
      });

      expect(mockDeletePaymentMethod).toHaveBeenCalledWith("pm-2");
      expect(result).toEqual({});
      expect(store.getState().methods).toHaveLength(1);
    });

    it("stores lastDeleteResult when subscription auto-cancels", async () => {
      const cancelResult = {
        subscriptionScheduledToCancel: true,
        expiresAt: "2026-05-28T00:00:00.000Z",
      };
      mockDeletePaymentMethod.mockResolvedValue(cancelResult);
      mockListPaymentMethods.mockResolvedValue([]);
      const store = await getStore();

      await act(async () => {
        await store.getState().deleteMethod("pm-1");
      });

      expect(store.getState().lastDeleteResult?.subscriptionScheduledToCancel).toBe(true);
      expect(store.getState().lastDeleteResult?.expiresAt).toBe("2026-05-28T00:00:00.000Z");
    });

    it("sets error and rethrows on failure", async () => {
      mockDeletePaymentMethod.mockRejectedValue(new Error("Not found"));
      const store = await getStore();

      await expect(
        act(async () => {
          await store.getState().deleteMethod("nonexistent");
        }),
      ).rejects.toThrow();

      expect(store.getState().isLoading).toBe(false);
    });
  });

  // ── getSetupIntent ─────────────────────────────────────────────────────────

  describe("getSetupIntent", () => {
    it("calls createSetupIntent and returns clientSecret", async () => {
      mockCreateSetupIntent.mockResolvedValue({ clientSecret: "seti_secret_123" });
      const store = await getStore();

      const clientSecret = await act(async () => {
        return store.getState().getSetupIntent();
      });

      expect(clientSecret).toBe("seti_secret_123");
    });
  });

  // ── attachMethod ───────────────────────────────────────────────────────────

  describe("attachMethod", () => {
    it("attaches method and refetches list", async () => {
      mockAttachPaymentMethod.mockResolvedValue(VISA);
      mockListPaymentMethods.mockResolvedValue([VISA]);
      const store = await getStore();

      const method = await act(async () => {
        return store.getState().attachMethod({
          stripePaymentMethodId: "pm_stripe_123",
        });
      });

      expect(mockAttachPaymentMethod).toHaveBeenCalledWith({
        stripePaymentMethodId: "pm_stripe_123",
      });
      expect(method.brand).toBe("visa");
      expect(store.getState().methods).toHaveLength(1);
    });

    it("sets error and rethrows on attach failure", async () => {
      const conflict = {
        response: { status: 409, data: { message: "Already saved" } },
      };
      mockAttachPaymentMethod.mockRejectedValue(conflict);
      const store = await getStore();

      await expect(
        act(async () => {
          await store.getState().attachMethod({ stripePaymentMethodId: "pm_dup" });
        }),
      ).rejects.toBeDefined();

      expect(store.getState().isLoading).toBe(false);
    });
  });

  // ── clearError ─────────────────────────────────────────────────────────────

  describe("clearError", () => {
    it("resets the error field to null", async () => {
      mockListPaymentMethods.mockRejectedValue(new Error("fail"));
      const store = await getStore();

      await act(async () => {
        await store.getState().fetchMethods();
      });
      expect(store.getState().error).toBeTruthy();

      act(() => {
        store.getState().clearError();
      });
      expect(store.getState().error).toBeNull();
    });
  });
});
