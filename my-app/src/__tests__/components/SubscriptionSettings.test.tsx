/**
 * SubscriptionSettings.test.tsx
 *
 * Component tests for the SubscriptionSettings page section.
 * Tests rendering for different subscription states, action buttons,
 * payment method list, invoice list, and error handling.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SubscriptionSettings from "@/src/components/profile/SubscriptionSettings";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import { usePaymentMethodsStore } from "@/src/store/usePaymentMethodsStore";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("@/src/store/useSubscriptionStore");
jest.mock("@/src/store/usePaymentMethodsStore");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeSubStore(overrides: Partial<ReturnType<typeof makeDefaultSubState>> = {}) {
  return { ...makeDefaultSubState(), ...overrides };
}

function makeDefaultSubState() {
  return {
    sub: null as null | {
      subscriptionType: "FREE" | "PRO" | "GO+";
      planName: string;
      isPremium: boolean;
      uploadLimit: number;
      uploadedTracks: number;
      remainingUploads: number | null;
      cancelAtPeriodEnd: boolean;
      currentPeriodEnd: string | null;
      renewalDate: string | null;
      expiresAt: string | null;
      trialStart: string | null;
      trialEnd: string | null;
      paymentMethodSummary: null | { brand: string; last4: string; expiryMonth: number; expiryYear: number; isDefault: boolean };
      pendingDowngrade: null | { planCode: string; planId: string; planName: string; effectiveAt: string };
      perks: { adFree: boolean; offlineListening: boolean };
    },
    invoices: [] as { id: string; amountPaidCents: number; currency: string; status: string; planName: string; paidAt: string | null; createdAt: string }[],
    isLoading: false,
    error: null as string | null,
    cancel: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    changePlan: jest.fn().mockResolvedValue(undefined),
    fetchInvoices: jest.fn().mockResolvedValue(undefined),
    openPortal: jest.fn().mockResolvedValue({ portalUrl: "#", capabilities: {}, portalSessionId: "bps_1" }),
    fetchSubscription: jest.fn().mockResolvedValue(undefined),
    upgrade: jest.fn().mockResolvedValue(undefined),
    setSubDirectly: jest.fn(),
    clearError: jest.fn(),
  };
}

function makePaymentMethodsStore(overrides: Partial<ReturnType<typeof makeDefaultPmState>> = {}) {
  return { ...makeDefaultPmState(), ...overrides };
}

function makeDefaultPmState() {
  return {
    methods: [] as { id: string; brand: string; last4: string; expMonth: number; expYear: number; cardholderName: string | null; isDefault: boolean; createdAt: string }[],
    isLoading: false,
    error: null as string | null,
    lastDeleteResult: null as null | { subscriptionScheduledToCancel?: boolean; expiresAt?: string },
    fetchMethods: jest.fn().mockResolvedValue(undefined),
    setDefault: jest.fn().mockResolvedValue(undefined),
    deleteMethod: jest.fn().mockResolvedValue({}),
    getSetupIntent: jest.fn().mockResolvedValue("seti_secret"),
    attachMethod: jest.fn().mockResolvedValue({}),
    clearError: jest.fn(),
  };
}

const FREE_SUB = {
  subscriptionType: "FREE" as const,
  planName: "Free",
  isPremium: false,
  uploadLimit: 3,
  uploadedTracks: 1,
  remainingUploads: 2,
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

const PRO_SUB = {
  subscriptionType: "PRO" as const,
  planName: "Artist Pro",
  isPremium: true,
  uploadLimit: 100,
  uploadedTracks: 10,
  remainingUploads: 90,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: "2026-05-28T00:00:00.000Z",
  renewalDate: "2026-05-28T00:00:00.000Z",
  expiresAt: null,
  trialStart: null,
  trialEnd: null,
  paymentMethodSummary: { brand: "visa", last4: "4242", expiryMonth: 12, expiryYear: 2030, isDefault: true },
  pendingDowngrade: null,
  perks: { adFree: true, offlineListening: true },
};

const PRO_CANCEL_PENDING_SUB = {
  ...PRO_SUB,
  cancelAtPeriodEnd: true,
  expiresAt: "2026-05-28T00:00:00.000Z",
  renewalDate: null,
};

const SAVED_CARDS = [
  { id: "pm-1", brand: "visa", last4: "4242", expMonth: 12, expYear: 2028, cardholderName: "Jane Doe", isDefault: true, createdAt: "2026-04-28T10:00:00.000Z" },
  { id: "pm-2", brand: "mastercard", last4: "5555", expMonth: 6, expYear: 2027, cardholderName: null, isDefault: false, createdAt: "2026-03-01T08:00:00.000Z" },
];

function setup(subState: Partial<ReturnType<typeof makeDefaultSubState>> = {}, pmState: Partial<ReturnType<typeof makeDefaultPmState>> = {}) {
  const subStore = makeSubStore(subState);
  const pmStore = makePaymentMethodsStore(pmState);

  // Zustand stores can be called with or without a selector.
  // When called without a selector the whole state is returned.
  (useSubscriptionStore as unknown as jest.Mock).mockImplementation(
    (selector?: (state: unknown) => unknown) =>
      typeof selector === "function" ? selector(subStore) : subStore,
  );
  (usePaymentMethodsStore as unknown as jest.Mock).mockImplementation(
    (selector?: (state: unknown) => unknown) =>
      typeof selector === "function" ? selector(pmStore) : pmStore,
  );

  // Also mock .getState() for direct store access in event handlers
  (useSubscriptionStore as unknown as { getState: () => unknown }).getState = () => subStore;
  (usePaymentMethodsStore as unknown as { getState: () => unknown }).getState = () => pmStore;

  return render(<SubscriptionSettings />);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SubscriptionSettings", () => {

  // ── Plan display ───────────────────────────────────────────────────────────

  describe("current plan display", () => {
    it("shows 'Basic' label and upgrade CTA for FREE users", () => {
      setup({ sub: FREE_SUB });

      expect(screen.getByText("Basic")).toBeInTheDocument();
      expect(screen.getByText(/Try Artist Pro/i)).toBeInTheDocument();
    });

    it("shows 'PRO' label and management buttons for PRO users", () => {
      setup({ sub: PRO_SUB });

      expect(screen.getByText("PRO")).toBeInTheDocument();
      expect(screen.getByText(/Switch to/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    });

    it("shows 'GO+' label for GO+ users", () => {
      setup({ sub: { ...PRO_SUB, subscriptionType: "GO+", planName: "GO+" } });

      expect(screen.getByText("GO+")).toBeInTheDocument();
    });

    it("shows upload quota progress bar for paid users", () => {
      setup({ sub: PRO_SUB });

      expect(screen.getByText(/Upload Quota/i)).toBeInTheDocument();
      expect(screen.getByText(/10 \/ 100 tracks used/i)).toBeInTheDocument();
    });
  });

  // ── Cancel/Resume ──────────────────────────────────────────────────────────

  describe("cancel and resume", () => {
    it("shows Resume button when cancelAtPeriodEnd is true", () => {
      setup({ sub: PRO_CANCEL_PENDING_SUB });

      expect(screen.getByText(/Resume/i)).toBeInTheDocument();
      expect(screen.queryByText(/Switch to/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Cancel/i })).not.toBeInTheDocument();
    });

    it("shows cancellation date when cancelAtPeriodEnd is true", () => {
      setup({ sub: PRO_CANCEL_PENDING_SUB });

      expect(screen.getByText(/Cancels/i)).toBeInTheDocument();
    });

    it("opens cancel confirm dialog when Cancel button is clicked", () => {
      setup({ sub: PRO_SUB });

      const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelBtn);

      expect(screen.getByText(/End your subscription\?/i)).toBeInTheDocument();
    });

    it("calls cancel action on confirm", async () => {
      const cancel = jest.fn().mockResolvedValue(undefined);
      setup({ sub: PRO_SUB, cancel });

      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
      fireEvent.click(screen.getByRole("button", { name: /End subscription/i }));

      await waitFor(() => {
        expect(cancel).toHaveBeenCalled();
      });
    });

    it("calls resume action when Resume is clicked", async () => {
      const resume = jest.fn().mockResolvedValue(undefined);
      setup({ sub: PRO_CANCEL_PENDING_SUB, resume });

      fireEvent.click(screen.getByText(/Resume/i));

      await waitFor(() => {
        expect(resume).toHaveBeenCalled();
      });
    });
  });

  // ── Change plan ────────────────────────────────────────────────────────────

  describe("change plan", () => {
    it("shows Switch button for PRO users (target: GO+)", () => {
      setup({ sub: PRO_SUB });

      expect(screen.getByText(/Switch to GO\+/i)).toBeInTheDocument();
    });

    it("opens change plan confirm dialog", () => {
      setup({ sub: PRO_SUB });

      fireEvent.click(screen.getByText(/Switch to GO\+/i));

      expect(screen.getByText(/Switch to GO\+\?/i)).toBeInTheDocument();
    });

    it("calls changePlan with target plan on confirm", async () => {
      const changePlan = jest.fn().mockResolvedValue(undefined);
      setup({ sub: PRO_SUB, changePlan });

      // Open the change-plan dialog
      const switchBtn = screen.getByRole("button", { name: /Switch to GO\+/i });
      fireEvent.click(switchBtn);

      // Dialog is now open — confirm it by looking for "Keep plan" button (dialog-only)
      await waitFor(() => {
        expect(screen.getByText("Keep plan")).toBeInTheDocument();
      });

      // Click the confirm button in the dialog (text: "Switch to GO+")
      // The ConfirmDialog is rendered first in the JSX fragment, so its confirm
      // button appears at index 0; the original trigger button is at index 1.
      const allSwitchBtns = screen.getAllByRole("button", { name: /Switch to GO\+/i });
      fireEvent.click(allSwitchBtns[0]);

      await waitFor(() => {
        expect(changePlan).toHaveBeenCalledWith("GO+");
      });
    });
  });

  // ── Payment methods ────────────────────────────────────────────────────────

  describe("payment methods", () => {
    it("shows empty state for FREE users with no saved cards", () => {
      setup({ sub: FREE_SUB }, { methods: [] });

      expect(screen.getByText(/Upgrade to add a payment method/i)).toBeInTheDocument();
    });

    it("shows empty state for PRO users with no saved cards", () => {
      setup({ sub: PRO_SUB }, { methods: [] });

      expect(screen.getByText(/No saved payment methods/i)).toBeInTheDocument();
    });

    it("renders saved payment method cards", () => {
      setup({ sub: PRO_SUB }, { methods: SAVED_CARDS });

      expect(screen.getByText(/4242/)).toBeInTheDocument();
      expect(screen.getByText(/5555/)).toBeInTheDocument();
    });

    it("shows Default badge on the default card", () => {
      setup({ sub: PRO_SUB }, { methods: SAVED_CARDS });

      const defaultBadges = screen.getAllByText(/Default/i);
      expect(defaultBadges.length).toBeGreaterThan(0);
    });

    it("shows 'Set default' button on non-default cards", () => {
      setup({ sub: PRO_SUB }, { methods: SAVED_CARDS });

      const setDefaultBtns = screen.getAllByText(/Set default/i);
      expect(setDefaultBtns).toHaveLength(1);
    });

    it("calls setDefault when set-default button is clicked", async () => {
      const setDefault = jest.fn().mockResolvedValue(undefined);
      setup({ sub: PRO_SUB }, { methods: SAVED_CARDS, setDefault });

      const setDefaultBtn = screen.getByText(/Set default/i);
      fireEvent.click(setDefaultBtn);

      await waitFor(() => {
        expect(setDefault).toHaveBeenCalledWith("pm-2");
      });
    });

    it("shows delete buttons for each card", () => {
      setup({ sub: PRO_SUB }, { methods: SAVED_CARDS });

      const deleteBtns = screen.getAllByRole("button", { name: /Remove card/i });
      expect(deleteBtns).toHaveLength(2);
    });

    it("calls deleteMethod when delete button is clicked", async () => {
      const deleteMethod = jest.fn().mockResolvedValue({});
      setup({ sub: PRO_SUB }, { methods: SAVED_CARDS, deleteMethod });

      const deleteBtns = screen.getAllByRole("button", { name: /Remove card/i });
      fireEvent.click(deleteBtns[0]);

      await waitFor(() => {
        expect(deleteMethod).toHaveBeenCalledWith("pm-1");
      });
    });

    it("shows error message when payment method store has error", () => {
      setup({ sub: PRO_SUB }, { methods: [], error: "Failed to load payment methods." });

      expect(screen.getByRole("alert")).toHaveTextContent("Failed to load payment methods.");
    });

    it("shows auto-cancel banner from lastDeleteResult", () => {
      setup(
        { sub: PRO_SUB },
        {
          methods: [],
          lastDeleteResult: {
            subscriptionScheduledToCancel: true,
            expiresAt: "2026-05-28T00:00:00.000Z",
          },
        },
      );

      expect(screen.getByText(/Card removed/i)).toBeInTheDocument();
    });
  });

  // ── Invoice list ───────────────────────────────────────────────────────────

  describe("invoice list", () => {
    it("shows empty state when no invoices", () => {
      setup({ sub: FREE_SUB, invoices: [] });

      expect(screen.getByText(/No purchase history yet/i)).toBeInTheDocument();
    });

    it("renders invoices with plan name, date, and amount", () => {
      const inv = {
        id: "inv-1",
        amountPaidCents: 999,
        currency: "usd",
        status: "paid",
        planName: "Artist Pro",
        paidAt: "2026-04-28T00:00:00.000Z",
        createdAt: "2026-04-28T00:00:00.000Z",
      };
      setup({ sub: PRO_SUB, invoices: [inv] });

      expect(screen.getByText("Artist Pro")).toBeInTheDocument();
      expect(screen.getByText("$9.99 USD")).toBeInTheDocument();
    });

    it("formats invoice status correctly", () => {
      const inv = {
        id: "inv-1",
        amountPaidCents: 999,
        currency: "usd",
        status: "paid",
        planName: "Artist Pro",
        paidAt: "2026-04-28T00:00:00.000Z",
        createdAt: "2026-04-28T00:00:00.000Z",
      };
      setup({ sub: PRO_SUB, invoices: [inv] });

      const statusEl = screen.getByText("paid");
      expect(statusEl).toHaveClass("text-green-400");
    });
  });

  // ── Loading states ─────────────────────────────────────────────────────────

  describe("loading states", () => {
    it("disables Cancel button while subscription is loading", () => {
      setup({ sub: PRO_SUB, isLoading: true });

      const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
      expect(cancelBtn).toBeDisabled();
    });

    it("shows loading text in payment methods area when loading with no methods", () => {
      setup({ sub: PRO_SUB }, { methods: [], isLoading: true });

      expect(screen.getByText(/Loading payment methods/i)).toBeInTheDocument();
    });
  });

  // ── Billing portal ─────────────────────────────────────────────────────────

  describe("billing portal", () => {
    it("calls openPortal when manage button is clicked", async () => {
      const openPortal = jest.fn().mockResolvedValue({ portalUrl: "#", capabilities: {}, portalSessionId: "bps_1" });
      setup({ sub: PRO_SUB, openPortal });

      const manageBtn = screen.getAllByText(/Manage via Portal/i)[0];
      fireEvent.click(manageBtn);

      await waitFor(() => {
        expect(openPortal).toHaveBeenCalled();
      });
    });
  });
});
