import { act } from "react";

import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import * as subscriptionService from "@/src/services/subscriptionService";

jest.mock("@/src/services/subscriptionService", () => ({
  getMySubscription: jest.fn(),
  upgradeSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  resumeSubscription: jest.fn(),
  changePlan: jest.fn(),
  getInvoices: jest.fn(),
  removePaymentMethod: jest.fn(),
}));

const mockedSubscriptionService = subscriptionService as jest.Mocked<
  typeof subscriptionService
>;

const mockSubscription = {
  userId: "usr_1",
  subscriptionType: "PRO" as const,
  uploadLimit: 100,
  uploadedTracks: 10,
  remainingUploads: 90,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-05-28T00:00:00.000Z",
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

describe("useSubscriptionStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useSubscriptionStore.setState({
        sub: null,
        invoices: [],
        isLoading: false,
        error: null,
      });
    });
  });

  it("fetches the subscription successfully", async () => {
    mockedSubscriptionService.getMySubscription.mockResolvedValue(
      mockSubscription,
    );

    await act(async () => {
      await useSubscriptionStore.getState().fetchSubscription();
    });

    expect(useSubscriptionStore.getState().sub).toEqual(mockSubscription);
    expect(useSubscriptionStore.getState().error).toBeNull();
  });

  it("sets an error when fetching the subscription fails", async () => {
    mockedSubscriptionService.getMySubscription.mockRejectedValue(new Error());

    await act(async () => {
      await useSubscriptionStore.getState().fetchSubscription();
    });

    expect(useSubscriptionStore.getState().error).toBe(
      "Failed to load subscription.",
    );
  });

  it("refreshes the subscription after an activated upgrade", async () => {
    mockedSubscriptionService.upgradeSubscription.mockResolvedValue({
      status: "activated",
    });
    mockedSubscriptionService.getMySubscription.mockResolvedValue(
      mockSubscription,
    );

    await act(async () => {
      const result = await useSubscriptionStore.getState().upgrade("PRO");
      expect(result).toEqual({ status: "activated" });
    });

    expect(mockedSubscriptionService.getMySubscription).toHaveBeenCalledTimes(1);
    expect(useSubscriptionStore.getState().sub).toEqual(mockSubscription);
  });

  it("does not refresh the subscription when checkout redirects", async () => {
    mockedSubscriptionService.upgradeSubscription.mockResolvedValue({
      status: "redirect",
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_123",
    });

    await act(async () => {
      const result = await useSubscriptionStore.getState().upgrade("GO+");
      expect(result.status).toBe("redirect");
    });

    expect(mockedSubscriptionService.getMySubscription).not.toHaveBeenCalled();
    expect(useSubscriptionStore.getState().sub).toBeNull();
  });

  it("sets an error when upgrade fails", async () => {
    mockedSubscriptionService.upgradeSubscription.mockRejectedValue(new Error());

    await expect(
      act(async () => {
        await useSubscriptionStore.getState().upgrade("PRO");
      }),
    ).rejects.toThrow("Upgrade failed");

    expect(useSubscriptionStore.getState().error).toBe("Upgrade failed.");
  });

  it("stores the updated subscription after cancel", async () => {
    mockedSubscriptionService.cancelSubscription.mockResolvedValue({
      ...mockSubscription,
      cancelAtPeriodEnd: true,
    });

    await act(async () => {
      await useSubscriptionStore.getState().cancel();
    });

    expect(useSubscriptionStore.getState().sub?.cancelAtPeriodEnd).toBe(true);
  });

  it("stores the updated subscription after resume", async () => {
    mockedSubscriptionService.resumeSubscription.mockResolvedValue(
      mockSubscription,
    );

    await act(async () => {
      await useSubscriptionStore.getState().resume();
    });

    expect(useSubscriptionStore.getState().sub).toEqual(mockSubscription);
  });

  it("stores the updated subscription after a plan change", async () => {
    mockedSubscriptionService.changePlan.mockResolvedValue({
      ...mockSubscription,
      subscriptionType: "GO+",
    });

    await act(async () => {
      await useSubscriptionStore.getState().changePlan("GO+");
    });

    expect(useSubscriptionStore.getState().sub?.subscriptionType).toBe("GO+");
  });

  it("stores the updated subscription after removing a payment method", async () => {
    mockedSubscriptionService.removePaymentMethod.mockResolvedValue({
      ...mockSubscription,
      paymentMethodSummary: null,
      cancelAtPeriodEnd: true,
    });

    await act(async () => {
      await useSubscriptionStore.getState().removePaymentMethod();
    });

    expect(useSubscriptionStore.getState().sub?.paymentMethodSummary).toBeNull();
    expect(useSubscriptionStore.getState().sub?.cancelAtPeriodEnd).toBe(true);
  });

  it("loads invoices successfully", async () => {
    mockedSubscriptionService.getInvoices.mockResolvedValue([
      {
        id: "inv_1",
        invoiceId: "stripe_inv_1",
        amountPaidCents: 999,
        currency: "usd",
        status: "paid",
        planName: "Artist Pro",
        paidAt: "2026-04-28T00:00:00.000Z",
        createdAt: "2026-04-28T00:00:00.000Z",
      },
    ]);

    await act(async () => {
      await useSubscriptionStore.getState().fetchInvoices();
    });

    expect(useSubscriptionStore.getState().invoices).toHaveLength(1);
  });

  it("keeps invoices empty when invoice loading fails", async () => {
    mockedSubscriptionService.getInvoices.mockRejectedValue(new Error());

    await act(async () => {
      await useSubscriptionStore.getState().fetchInvoices();
    });

    expect(useSubscriptionStore.getState().invoices).toEqual([]);
  });
});
