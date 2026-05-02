import { act } from "react";

import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import * as subscriptionService from "@/src/services/subscriptionService";

jest.mock("@/src/services/subscriptionService", () => ({
  getMySubscription: jest.fn(),
  upgradeSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  cancelPendingPlanChange: jest.fn(),
  resumeSubscription: jest.fn(),
  changePlan: jest.fn(),
  getInvoices: jest.fn(),
  openBillingPortal: jest.fn(),
}));

const mockedSubscriptionService = subscriptionService as jest.Mocked<
  typeof subscriptionService
>;

const mockSubscription = {
  userId: "usr_1",
  subscriptionType: "PRO" as const,
  planCode: "PRO",
  planName: "Artist Pro",
  isPremium: true,
  subscriptionStatus: "ACTIVE",
  uploadLimit: 100,
  uploadedTracks: 10,
  remainingUploads: 90,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-05-28T00:00:00.000Z",
  renewalDate: "2026-05-28T00:00:00.000Z",
  expiresAt: null,
  trialStart: null,
  trialEnd: null,
  pendingDowngrade: null,
  paymentMethodSummary: {
    brand: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2030,
    isDefault: true,
  },
  latestInvoice: null,
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

  it("refreshes the subscription after upgrade", async () => {
    mockedSubscriptionService.upgradeSubscription.mockResolvedValue({
      subscriptionId: "sub_mock",
      planCode: "PRO",
    });
    mockedSubscriptionService.getMySubscription.mockResolvedValue(
      mockSubscription,
    );

    await act(async () => {
      await useSubscriptionStore.getState().upgrade("PRO");
    });

    expect(mockedSubscriptionService.getMySubscription).toHaveBeenCalledTimes(1);
    expect(useSubscriptionStore.getState().sub).toEqual(mockSubscription);
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

  it("sets an error and rejects when cancel fails", async () => {
    mockedSubscriptionService.cancelSubscription.mockRejectedValue(new Error());

    await expect(
      act(async () => {
        await useSubscriptionStore.getState().cancel();
      }),
    ).rejects.toThrow("Cancellation failed");

    expect(useSubscriptionStore.getState().error).toBe(
      "Cancellation failed. Please try again.",
    );
  });

  it("stores updated subscription after canceling pending plan change", async () => {
    mockedSubscriptionService.cancelPendingPlanChange.mockResolvedValue({
      ...mockSubscription,
      cancelAtPeriodEnd: false,
      pendingDowngrade: null,
    });

    await act(async () => {
      await useSubscriptionStore.getState().cancelPendingPlanChange();
    });

    expect(mockedSubscriptionService.cancelPendingPlanChange).toHaveBeenCalled();
    expect(useSubscriptionStore.getState().sub?.cancelAtPeriodEnd).toBe(false);
  });

  it("sets an error and rejects when cancelPendingPlanChange fails", async () => {
    mockedSubscriptionService.cancelPendingPlanChange.mockRejectedValue(new Error());

    await expect(
      act(async () => {
        await useSubscriptionStore.getState().cancelPendingPlanChange();
      }),
    ).rejects.toThrow("Failed to cancel scheduled plan change");

    expect(useSubscriptionStore.getState().error).toBe(
      "Failed to cancel scheduled plan change.",
    );
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

  it("sets an error and rejects when resume fails", async () => {
    mockedSubscriptionService.resumeSubscription.mockRejectedValue(new Error());

    await expect(
      act(async () => {
        await useSubscriptionStore.getState().resume();
      }),
    ).rejects.toThrow("Failed to resume subscription");

    expect(useSubscriptionStore.getState().error).toBe(
      "Failed to resume subscription.",
    );
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

  it("loads invoices successfully", async () => {
    mockedSubscriptionService.getInvoices.mockResolvedValue([
      {
        id: "inv_1",
        invoiceId: "stripe_inv_1",
        amountDueCents: 999,
        amountPaidCents: 999,
        currency: "usd",
        status: "paid",
        planName: "Artist Pro",
        planTier: "PRO",
        dueAt: null,
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
