/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import UploadButton from "@/src/components/upload/UploadButton";
import { useUploadStore } from "@/src/store/useuploadStore";
import {
  uploadTrack,
  getTrackDetails,
  changeTrackVisibility,
} from "@/src/services/uploadService";
import { getMyProfile } from "@/src/services/profileService";
import { useRouter } from "next/navigation";

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@/src/store/useuploadStore");
jest.mock("@/src/services/uploadService");
jest.mock("@/src/services/profileService");
jest.mock("next/navigation", () => ({ useRouter: jest.fn() }));
jest.mock("@/src/components/ui/FileStatusBadge", () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => (
    <span data-testid="badge">{status}</span>
  ),
}));
// Add after the existing jest.mock blocks
// jest.mock('@/src/services/subscriptionService', () => ({
//   decrementUploadQuota: jest.fn().mockResolvedValue({
//     userId: 'usr_test',
//     subscriptionType: 'FREE',
//     uploadLimit: 3,
//     uploadedTracks: 2,
//     remainingUploads: 1,
//     perks: { adFree: false, offlineListening: false },
//   }),
// }));

// Mock useSubscriptionStore — must expose setSubDirectly as a stable function
// so UploadButton can call it after a successful upload without throwing.
const mockSetSubDirectly = jest.fn();

jest.mock('@/src/store/useSubscriptionStore', () => ({
  useSubscriptionStore: jest.fn((selector) =>
    selector({
      setSubDirectly: mockSetSubDirectly,
      setSubFromStore: jest.fn(),
    })
  ),
}));

jest.mock('@/src/services/subscriptionService', () => ({
  decrementUploadQuota: jest.fn().mockResolvedValue({
    userId: "usr_test",
    subscriptionType: "FREE",
    uploadLimit: 3,
    uploadedTracks: 2,
    remainingUploads: 1,
    perks: { adFree: false, offlineListening: false },
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockSetFiles = jest.fn();

const METADATA = {
  title: "Test Track",
  genre: "Electronic",
  tags: [] as string[],
  visibility: "PUBLIC" as const,
  description: "",
  coverArt: null,
};

const makeFile = (name = "audio.mp3") =>
  new File(["data"], name, { type: "audio/mpeg" });

function setupStore(
  files: File[] = [],
  metadata: typeof METADATA | null = METADATA,
) {
  (useUploadStore as unknown as jest.Mock).mockReturnValue({
    files,
    setFiles: mockSetFiles,
    metadata,
  });
}

/** Advance fake timers by `ms` and flush all pending React state updates. */
async function tick(ms = 3000) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (getMyProfile as jest.Mock).mockResolvedValue({ accountType: "ARTIST" });


  
});


 



afterEach(() => {
  jest.runAllTimers();
  jest.useRealTimers();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("UploadButton", () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  describe("initial render", () => {
    it("renders a button", () => {
      setupStore();
      render(<UploadButton />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("button is disabled when file list is empty", () => {
      setupStore([]);
      render(<UploadButton />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("button is enabled when files are present", () => {
      setupStore([makeFile()]);
      render(<UploadButton />);
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("shows the correct file count in the button label", () => {
      setupStore([makeFile("a.mp3"), makeFile("b.mp3")]);
      render(<UploadButton />);
      expect(screen.getByRole("button")).toHaveTextContent("(2) files");
    });

    it("shows (1) files for a single file", () => {
      setupStore([makeFile()]);
      render(<UploadButton />);
      expect(screen.getByRole("button")).toHaveTextContent("(1) files");
    });

    it("shows no status badges initially", () => {
      setupStore([makeFile()]);
      render(<UploadButton />);
      expect(screen.queryByTestId("badge")).not.toBeInTheDocument();
    });

    it("shows no permission error initially", () => {
      setupStore([makeFile()]);
      render(<UploadButton />);
      expect(screen.queryByText(/ARTIST/)).not.toBeInTheDocument();
    });
  });

  // ── No-file guard ──────────────────────────────────────────────────────────

  describe("clicking with no files", () => {
    it("does not call getMyProfile when files are empty (button is disabled)", () => {
      setupStore([]);
      render(<UploadButton />);
      fireEvent.click(screen.getByRole("button"));
      expect(getMyProfile).not.toHaveBeenCalled();
    });
  });

  // ── Permission check ───────────────────────────────────────────────────────

  describe("permission check", () => {
    it("shows 'Checking permissions…' and disables the button while verifying", async () => {
      setupStore([makeFile()]);
      let resolveProfile!: (v: any) => void;
      (getMyProfile as jest.Mock).mockReturnValue(
        new Promise((r) => {
          resolveProfile = r;
        }),
      );

      render(<UploadButton />);
      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByRole("button")).toHaveTextContent(
        "Checking permissions...",
      );
      expect(screen.getByRole("button")).toBeDisabled();

      await act(async () => {
        resolveProfile({ accountType: "ARTIST" });
      });
    });

    it("shows an error and skips upload for non-ARTIST accounts", async () => {
      setupStore([makeFile()]);
      (getMyProfile as jest.Mock).mockResolvedValue({
        accountType: "LISTENER",
      });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(
        screen.getByText(
          "Only users with ARTIST accounts can upload tracks.",
        ),
      ).toBeInTheDocument();
      expect(uploadTrack).not.toHaveBeenCalled();
    });

    it("accepts lowercase artist account type values", async () => {
      setupStore([makeFile()]);
      (getMyProfile as jest.Mock).mockResolvedValue({
        accountType: "artist",
      });
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(uploadTrack).toHaveBeenCalled();
      expect(
        screen.queryByText(
          "Only users with ARTIST accounts can upload tracks.",
        ),
      ).not.toBeInTheDocument();
    });

    it("shows an error when the profile fetch throws", async () => {
      setupStore([makeFile()]);
      (getMyProfile as jest.Mock).mockRejectedValue(new Error("Network"));

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(
        screen.getByText(
          "Could not verify upload permission. Please try again.",
        ),
      ).toBeInTheDocument();
      expect(uploadTrack).not.toHaveBeenCalled();
    });

    it("clears the previous permission error on a new click attempt", async () => {
      setupStore([makeFile()]);
      (getMyProfile as jest.Mock)
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce({ accountType: "LISTENER" });

      render(<UploadButton />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      expect(
        screen.getByText(
          "Could not verify upload permission. Please try again.",
        ),
      ).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      expect(
        screen.queryByText(
          "Could not verify upload permission. Please try again.",
        ),
      ).not.toBeInTheDocument();
    });
  });

  // ── Upload flow ────────────────────────────────────────────────────────────

  describe("upload flow", () => {
    it("shows UPLOADING badge while upload is in-flight", async () => {
      setupStore([makeFile("song.mp3")]);
      let resolveUpload!: (v: any) => void;
      (uploadTrack as jest.Mock).mockReturnValue(
        new Promise((r) => {
          resolveUpload = r;
        }),
      );

      render(<UploadButton />);
      fireEvent.click(screen.getByRole("button"));
      await act(async () => {}); // flush getMyProfile

      expect(screen.getByTestId("badge")).toHaveTextContent("UPLOADING");
      await act(async () => {
        resolveUpload({ status: "DONE" });
      });
    });

    it("sets badge to DONE for a non-PROCESSING upload result", async () => {
      setupStore([makeFile()]);
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(screen.getByTestId("badge")).toHaveTextContent("DONE");
    });

    it("clears the file list after upload completes", async () => {
      setupStore([makeFile()]);
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(mockSetFiles).toHaveBeenCalledWith([]);
    });

    it("sets ERROR badge when uploadTrack throws with a message", async () => {
      setupStore([makeFile("fail.mp3")]);
      (uploadTrack as jest.Mock).mockRejectedValue(new Error("Upload failed"));

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(screen.getByTestId("badge")).toHaveTextContent("ERROR");
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });

    it("uses fallback 'Upload error' message when thrown error has no message", async () => {
      setupStore([makeFile()]);
      (uploadTrack as jest.Mock).mockRejectedValue({});

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(screen.getByText("Upload error")).toBeInTheDocument();
    });

    it("sets ERROR when metadata is null", async () => {
      (useUploadStore as unknown as jest.Mock).mockReturnValue({
        files: [makeFile()],
        setFiles: mockSetFiles,
        metadata: null,
      });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(screen.getByTestId("badge")).toHaveTextContent("ERROR");
      expect(screen.getByText("Metadata missing")).toBeInTheDocument();
    });

    it("calls changeTrackVisibility and sets PROCESSING badge for PROCESSING upload", async () => {
      setupStore([makeFile()]);
      (uploadTrack as jest.Mock).mockResolvedValue({
        status: "PROCESSING",
        trackId: "t1",
      });
      (changeTrackVisibility as jest.Mock).mockResolvedValue(undefined);
      (getTrackDetails as jest.Mock).mockResolvedValue({ status: "PROCESSING" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(changeTrackVisibility).toHaveBeenCalledWith("t1", "PUBLIC");
      expect(screen.getByTestId("badge")).toHaveTextContent("PROCESSING");
    });

    it("displays the file name in the status list", async () => {
      setupStore([makeFile("mytrack.mp3")]);
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(screen.getByText("mytrack.mp3")).toBeInTheDocument();
    });

    it("uploads multiple files sequentially and shows a badge for each", async () => {
      const files = [makeFile("a.mp3"), makeFile("b.mp3")];
      setupStore(files);
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(uploadTrack).toHaveBeenCalledTimes(2);
      const badges = screen.getAllByTestId("badge");
      expect(badges).toHaveLength(2);
      badges.forEach((b) => expect(b).toHaveTextContent("DONE"));
    });

    it("passes the correct file and metadata to uploadTrack", async () => {
      const file = makeFile("track.mp3");
      setupStore([file]);
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(uploadTrack).toHaveBeenCalledWith(file, METADATA);
    });

    it("shows backend UPLOAD_LIMIT_REACHED message when backend returns 403", async () => {
      const file = makeFile("track.mp3");
      setupStore([file]);
      const err = Object.assign(new Error("Request failed with status code 403"), {
        response: {
          status: 403,
          data: {
            code: "UPLOAD_LIMIT_REACHED",
            message: "You have reached your upload limit. Upgrade your plan to upload more tracks.",
          },
        },
      });
      (uploadTrack as jest.Mock).mockRejectedValue(err);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(screen.getByTestId("badge")).toHaveTextContent("ERROR");
      expect(
        screen.getByText(
          "You have reached your upload limit. Upgrade your plan to upload more tracks.",
        ),
      ).toBeInTheDocument();
    });
  });

  // ── pollTrackStatus ────────────────────────────────────────────────────────
  //
  // pollTrackStatus is fire-and-forget inside handleUpload.
  // Advance fake timers to drive it forward.
  //
  //   Timeline:
  //     T+0    : handleUpload called
  //     T+3000 : initial setTimeout fires → getTrackDetails called (attempt 1)
  //     T+6000 : if PROCESSING, next setTimeout fires → attempt 2 …
  //     After 20 PROCESSING attempts → timeout error

  describe("pollTrackStatus", () => {
    beforeEach(() => {
      (uploadTrack as jest.Mock).mockResolvedValue({
        status: "PROCESSING",
        trackId: "p1",
      });
      (changeTrackVisibility as jest.Mock).mockResolvedValue(undefined);
    });

    it("navigates to /tracks/:trackId when poll resolves FINISHED", async () => {
      (getTrackDetails as jest.Mock).mockResolvedValue({ status: "FINISHED" });
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      await tick(3000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/tracks/p1");
      });
    });

    it("sets badge to DONE when poll resolves FINISHED", async () => {
      (getTrackDetails as jest.Mock).mockResolvedValue({ status: "FINISHED" });
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      await tick(3000);

      await waitFor(() => {
        expect(screen.getByTestId("badge")).toHaveTextContent("DONE");
      });
    });

    it("sets ERROR when poll returns an unexpected status (e.g. FAILED)", async () => {
      (getTrackDetails as jest.Mock).mockResolvedValue({ status: "FAILED" });
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      await tick(3000);

      await waitFor(() => {
        expect(screen.getByTestId("badge")).toHaveTextContent("ERROR");
        expect(
          screen.getByText("Track processing failed: FAILED"),
        ).toBeInTheDocument();
      });
    });

    it("continues polling on PROCESSING and resolves on the next attempt", async () => {
      (getTrackDetails as jest.Mock)
        .mockResolvedValueOnce({ status: "PROCESSING" })
        .mockResolvedValueOnce({ status: "FINISHED" });
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      await tick(3000); // attempt 1: PROCESSING
      await tick(3000); // attempt 2: FINISHED

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/tracks/p1");
      });
    });

    it("sets ERROR when getTrackDetails throws with a message", async () => {
      (getTrackDetails as jest.Mock).mockRejectedValue(
        new Error("Poll failed"),
      );
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      await tick(3000);

      await waitFor(() => {
        expect(screen.getByTestId("badge")).toHaveTextContent("ERROR");
        expect(screen.getByText("Poll failed")).toBeInTheDocument();
      });
    });

    it("uses fallback 'Polling error' when getTrackDetails throws without a message", async () => {
      (getTrackDetails as jest.Mock).mockRejectedValue({});
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      await tick(3000);

      await waitFor(() => {
        expect(screen.getByText("Polling error")).toBeInTheDocument();
      });
    });

    it("sets timeout ERROR after 20 consecutive PROCESSING responses", async () => {
      (getTrackDetails as jest.Mock).mockResolvedValue({
        status: "PROCESSING",
      });
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      // 1 initial wait + 20 in-loop waits (each PROCESSING attempt waits before continue)
      for (let i = 0; i < 21; i++) {
        await tick(3000);
      }

      await waitFor(() => {
        expect(
          screen.getByText(
            "Processing timed out. Please check your track.",
          ),
        ).toBeInTheDocument();
        expect(screen.getByTestId("badge")).toHaveTextContent("ERROR");
      });
    });

    it("calls getTrackDetails with the correct trackId", async () => {
      (getTrackDetails as jest.Mock).mockResolvedValue({ status: "FINISHED" });
      setupStore([makeFile()]);

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });
      await tick(3000);

      await waitFor(() => {
        expect(getTrackDetails).toHaveBeenCalledWith("p1");
      });
    });
  });

  // ── Cover art FormData ─────────────────────────────────────────────────────

  describe("cover art in FormData", () => {
    it("passes coverArt File in metadata to uploadTrack when present", async () => {
      const audioFile = makeFile("song.mp3");
      const coverFile = new File(["img"], "cover.jpg", { type: "image/jpeg" });
      const metadataWithCover = { ...METADATA, coverArt: coverFile };

      (useUploadStore as unknown as jest.Mock).mockReturnValue({
        files: [audioFile],
        setFiles: mockSetFiles,
        metadata: metadataWithCover,
      });
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(uploadTrack).toHaveBeenCalledWith(
        audioFile,
        expect.objectContaining({ coverArt: coverFile }),
      );
    });

    it("passes null coverArt when no cover art is selected", async () => {
      const file = makeFile("song.mp3");
      setupStore([file]);
      (uploadTrack as jest.Mock).mockResolvedValue({ status: "DONE" });

      render(<UploadButton />);
      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
      });

      expect(uploadTrack).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ coverArt: null }),
      );
    });
  });
});