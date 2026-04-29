/**
 * DownloadButton — Unit Tests
 *
 * Covers the plan-gate logic and the DownloadForbiddenError catch path
 * (backend 403 → forbidden state, not generic error state).
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DownloadButton } from "@/src/components/tracks/DownloadButton";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  getOfflineTrack,
  DownloadForbiddenError,
} from "@/src/services/subscriptionService";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/src/store/useSubscriptionStore");
jest.mock("@/src/services/subscriptionService");

// Mock IndexedDB-based offline cache — not available in jsdom
jest.mock("@/src/services/offlineAudioCache", () => ({
  saveOfflineTrack: jest.fn().mockResolvedValue(undefined),
  isTrackCached: jest.fn().mockResolvedValue(false),
  removeOfflineTrack: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockGetOfflineTrack = getOfflineTrack as jest.MockedFunction<
  typeof getOfflineTrack
>;

function mockStore(subscriptionType: "FREE" | "PRO" | "GO+" | null) {
  (useSubscriptionStore as unknown as jest.Mock).mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({
        sub:
          subscriptionType === null
            ? null
            : {
                userId: "usr_1",
                subscriptionType,
                uploadLimit: subscriptionType === "FREE" ? 3 : 100,
                uploadedTracks: 0,
                remainingUploads: subscriptionType === "FREE" ? 3 : 100,
                cancelAtPeriodEnd: false,
                currentPeriodEnd: null,
                paymentMethodSummary: null,
                perks: {
                  adFree: subscriptionType !== "FREE",
                  offlineListening: subscriptionType !== "FREE",
                },
              },
      }),
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DownloadButton", () => {
  const TRACK_ID = "track-abc-123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FREE user — client-side gate", () => {
    it('shows "PRO only" label when FREE user clicks (no API call)', async () => {
      mockStore("FREE");
      render(<DownloadButton trackId={TRACK_ID} />);

      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(screen.getByText(/PRO only/i)).toBeInTheDocument();
      });
      // No backend call — FREE check is client-side only
      expect(mockGetOfflineTrack).not.toHaveBeenCalled();
    });

    it("shows upgrade tooltip when FREE user clicks", async () => {
      mockStore("FREE");
      render(<DownloadButton trackId={TRACK_ID} />);

      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(screen.getByText(/Premium Feature/i)).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: /upgrade to pro/i }),
        ).toHaveAttribute("href", "/subscriptions");
      });
    });

    it("does not call getOfflineTrack when sub is null", async () => {
      mockStore(null);
      render(<DownloadButton trackId={TRACK_ID} />);

      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(screen.getByText(/PRO only/i)).toBeInTheDocument();
      });
      expect(mockGetOfflineTrack).not.toHaveBeenCalled();
    });
  });

  describe("PRO user — backend call", () => {
    it("calls getOfflineTrack with the correct trackId", async () => {
      mockStore("PRO");
      mockGetOfflineTrack.mockResolvedValue({
        trackId: TRACK_ID,
        title: "Test Track",
        artist: "Artist",
        handle: "artist-handle",
        durationMs: 180000,
        coverArtUrl: "https://cdn.example.com/cover.jpg",
        downloadUrl: "https://s3.example.com/track.mp3",
        expiresAt: new Date(Date.now() + 3600_000).toISOString(),
        expiresInSeconds: 3600,
        planCode: "PRO",
      });

      render(<DownloadButton trackId={TRACK_ID} />);
      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(mockGetOfflineTrack).toHaveBeenCalledWith(TRACK_ID);
      });
    });

    it('shows "PRO only" (forbidden state) when backend returns 403 DownloadForbiddenError', async () => {
      mockStore("PRO");
      mockGetOfflineTrack.mockRejectedValue(
        new DownloadForbiddenError("Offline listening requires a premium plan"),
      );

      render(<DownloadButton trackId={TRACK_ID} />);
      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        // Should show forbidden state (PRO only), NOT generic error state
        expect(screen.getByText(/PRO only/i)).toBeInTheDocument();
      });
    });

    it("shows upgrade tooltip when backend returns DownloadForbiddenError", async () => {
      mockStore("PRO");
      mockGetOfflineTrack.mockRejectedValue(
        new DownloadForbiddenError("Plan expired"),
      );

      render(<DownloadButton trackId={TRACK_ID} />);
      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(screen.getByText(/Premium Feature/i)).toBeInTheDocument();
      });
    });

    it('shows "Failed" (error state) for non-forbidden errors', async () => {
      mockStore("PRO");
      mockGetOfflineTrack.mockRejectedValue(new Error("Network error"));

      render(<DownloadButton trackId={TRACK_ID} />);
      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed/i)).toBeInTheDocument();
      });
      // Should NOT show upgrade tooltip for non-forbidden errors
      expect(screen.queryByText(/Premium Feature/i)).not.toBeInTheDocument();
    });

    it("does NOT show upgrade tooltip for non-forbidden errors", async () => {
      mockStore("PRO");
      mockGetOfflineTrack.mockRejectedValue(new Error("Network timeout"));

      render(<DownloadButton trackId={TRACK_ID} />);
      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(screen.getByText(/Failed/i)).toBeInTheDocument();
      });
      expect(screen.queryByText(/Premium Feature/i)).not.toBeInTheDocument();
    });
  });

  describe("GO+ user — same as PRO", () => {
    it('shows "PRO only" when backend returns DownloadForbiddenError for GO+ user', async () => {
      mockStore("GO+");
      mockGetOfflineTrack.mockRejectedValue(
        new DownloadForbiddenError("Subscription lapsed"),
      );

      render(<DownloadButton trackId={TRACK_ID} />);
      fireEvent.click(screen.getByRole("button", { name: /save for offline/i }));

      await waitFor(() => {
        expect(screen.getByText(/PRO only/i)).toBeInTheDocument();
      });
    });
  });
});
