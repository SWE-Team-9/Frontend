import React from "react";
import { render, waitFor } from "@testing-library/react";

import { useAuthInit } from "@/src/hooks/useAuthInit";
import { getBootstrapData } from "@/src/services/bffService";

const mockSetUser = jest.fn();
const mockSetProfileData = jest.fn();
const mockSetFromBootstrap = jest.fn();
const mockSetSubDirectly = jest.fn();

jest.mock("@/src/services/bffService", () => ({
  getBootstrapData: jest.fn(),
}));

jest.mock("@/src/store/useAuthStore", () => ({
  useAuthStore: {
    getState: () => ({
      setUser: mockSetUser,
    }),
  },
}));

jest.mock("@/src/store/useProfileStore", () => ({
  useProfileStore: {
    getState: () => ({
      setProfileData: mockSetProfileData,
    }),
  },
}));

jest.mock("@/src/store/notificationsStore", () => ({
  useNotificationStore: {
    getState: () => ({
      setFromBootstrap: mockSetFromBootstrap,
    }),
  },
}));

jest.mock("@/src/store/useSubscriptionStore", () => ({
  useSubscriptionStore: {
    getState: () => ({
      setSubDirectly: mockSetSubDirectly,
    }),
  },
}));

function TestHarness() {
  useAuthInit();
  return null;
}

describe("useAuthInit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes bootstrap subscription and seeds subscription before auth user", async () => {
    (getBootstrapData as jest.Mock).mockResolvedValue({
      me: {
        id: "u1",
        email: "a@b.com",
        display_name: "Alice",
        handle: "alice",
        avatar_url: null,
        account_type: "ARTIST",
        system_role: "USER",
        is_verified: true,
        subscription_tier: "GO_PLUS",
      },
      profile: null,
      notifications: { unreadCount: 2, latest: [] },
      messages: { unreadCount: 1 },
      player: { session: null },
      entitlements: null,
      subscription: {
        userId: "u1",
        planCode: "GO_PLUS",
        isPremium: true,
        uploadLimit: 1000,
        uploadedTracks: 20,
        remainingUploads: 980,
        adsEnabled: false,
        canDownload: true,
      },
    });

    render(<TestHarness />);

    await waitFor(() => {
      expect(mockSetSubDirectly).toHaveBeenCalledTimes(1);
      expect(mockSetUser).toHaveBeenCalledTimes(1);
    });

    const normalized = mockSetSubDirectly.mock.calls[0][0];
    expect(normalized.subscriptionType).toBe("GO+");
    expect(normalized.perks.adFree).toBe(true);
    expect(normalized.perks.offlineListening).toBe(true);

    expect(mockSetSubDirectly.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetUser.mock.invocationCallOrder[0],
    );
  });

  it("falls back to entitlements when subscription block is absent", async () => {
    (getBootstrapData as jest.Mock).mockResolvedValue({
      me: {
        id: "u2",
        email: "pro@iqa3.tech",
        display_name: "Pro User",
        handle: "pro",
        avatar_url: null,
        account_type: "ARTIST",
        system_role: "USER",
        is_verified: true,
        subscription_tier: "GO_PLUS",
      },
      profile: null,
      notifications: { unreadCount: 0, latest: [] },
      messages: { unreadCount: 0 },
      player: { session: null },
      subscription: null,
      entitlements: {
        planCode: "GO_PLUS",
        isPremium: true,
        uploadLimit: 1000,
        uploadedCount: 5,
        remainingUploads: 995,
        canUpload: true,
        adsEnabled: false,
        canDownload: true,
        supportLevel: "priority",
        trialEnd: null,
      },
    });

    render(<TestHarness />);

    await waitFor(() => expect(mockSetSubDirectly).toHaveBeenCalledTimes(1));

    const normalized = mockSetSubDirectly.mock.calls[0][0];
    expect(normalized.subscriptionType).toBe("GO+");
    expect(normalized.planName).toBe("GO+");
    expect(normalized.perks.adFree).toBe(true);
  });

  it("swallows bootstrap failures and leaves stores untouched", async () => {
    (getBootstrapData as jest.Mock).mockRejectedValue(new Error("401"));

    render(<TestHarness />);

    await waitFor(() => expect(getBootstrapData).toHaveBeenCalledTimes(1));

    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockSetProfileData).not.toHaveBeenCalled();
    expect(mockSetFromBootstrap).not.toHaveBeenCalled();
    expect(mockSetSubDirectly).not.toHaveBeenCalled();
  });
});
