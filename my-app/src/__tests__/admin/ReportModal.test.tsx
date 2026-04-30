/**
 * Unit tests for ReportModal component.
 * Tests: renders, reason validation, successful submission, duplicate error,
 * generic error, description field, close button, submitting state.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReportModal } from "@/src/components/reports/ReportModal";

const mockCreateReport = jest.fn();

jest.mock("@/src/services/reportService", () => ({
  reportService: { createReport: (...args: unknown[]) => mockCreateReport(...args) },
  ReportTargetType: {
    TRACK: "TRACK",
    COMMENT: "COMMENT",
    USER: "USER",
    PLAYLIST: "PLAYLIST",
  },
  ReportReason: {
    COPYRIGHT: "COPYRIGHT",
    INAPPROPRIATE: "INAPPROPRIATE",
    SPAM: "SPAM",
  },
}));

const DEFAULT_PROPS = {
  targetId: "track-uuid",
  targetType: "TRACK" as const,
  targetLabel: "Night Drive",
  onClose: jest.fn(),
};

beforeEach(() => {
  mockCreateReport.mockReset();
  DEFAULT_PROPS.onClose = jest.fn();
});

describe("ReportModal", () => {
  describe("rendering", () => {
    it("renders title 'Report Track' for TRACK target", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      expect(screen.getByText("Report Track")).toBeInTheDocument();
    });

    it("renders title 'Report Comment' for COMMENT target", () => {
      render(<ReportModal {...DEFAULT_PROPS} targetType="COMMENT" />);
      expect(screen.getByText("Report Comment")).toBeInTheDocument();
    });

    it("renders title 'Report User' for USER target", () => {
      render(<ReportModal {...DEFAULT_PROPS} targetType="USER" />);
      expect(screen.getByText("Report User")).toBeInTheDocument();
    });

    it("renders title 'Report Playlist' for PLAYLIST target", () => {
      render(<ReportModal {...DEFAULT_PROPS} targetType="PLAYLIST" />);
      expect(screen.getByText("Report Playlist")).toBeInTheDocument();
    });

    it("shows target label when provided", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      expect(screen.getByText("Night Drive")).toBeInTheDocument();
    });

    it("does not show Reporting: row when targetLabel is undefined", () => {
      render(<ReportModal {...DEFAULT_PROPS} targetLabel={undefined} />);
      expect(screen.queryByText(/Reporting:/)).not.toBeInTheDocument();
    });

    it("renders all three reason radio options", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      expect(screen.getByText("Copyright Infringement")).toBeInTheDocument();
      expect(screen.getByText("Inappropriate Content")).toBeInTheDocument();
      expect(screen.getByText("Spam")).toBeInTheDocument();
    });

    it("renders description textarea", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      expect(screen.getByPlaceholderText("Describe the issue...")).toBeInTheDocument();
    });
  });

  describe("form state", () => {
    it("Submit button is disabled when no reason is selected", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      expect(screen.getByText("Submit Report")).toBeDisabled();
    });

    it("Submit button is enabled after selecting a reason", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByDisplayValue("SPAM"));
      expect(screen.getByText("Submit Report")).not.toBeDisabled();
    });

    it("selecting a radio updates the highlighted state", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      const radio = screen.getByDisplayValue("COPYRIGHT");
      fireEvent.click(radio);
      expect(radio).toBeChecked();
    });
  });

  describe("validation", () => {
    it("Submit button remains disabled and API is not called before selecting a reason", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      const btn = screen.getByText("Submit Report");
      // Button is disabled — clicking it should not invoke the API
      fireEvent.click(btn);
      expect(mockCreateReport).not.toHaveBeenCalled();
      // Button remains disabled
      expect(btn).toBeDisabled();
    });

    it("error clears between retries — second submit attempt after error shows new result", async () => {
      // First call fails
      mockCreateReport
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce({ id: "r2", status: "PENDING" });

      render(<ReportModal {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(
          screen.getByText("Failed to submit report. Please try again.")
        ).toBeInTheDocument()
      );

      // Retry — error should clear and success shown
      fireEvent.click(screen.getByText("Submit Report"));
      await waitFor(() =>
        expect(screen.getByText("Report submitted")).toBeInTheDocument()
      );
    });
  });

  describe("submission", () => {
    it("calls createReport with correct payload on submit", async () => {
      mockCreateReport.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.change(screen.getByPlaceholderText("Describe the issue..."), {
        target: { value: "This is spam content" },
      });
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(mockCreateReport).toHaveBeenCalledWith({
          targetId: "track-uuid",
          targetType: "TRACK",
          reason: "SPAM",
          description: "This is spam content",
        })
      );
    });

    it("omits description from payload when description is empty", async () => {
      mockCreateReport.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("COPYRIGHT"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(mockCreateReport).toHaveBeenCalledWith(
          expect.objectContaining({ description: undefined })
        )
      );
    });

    it("omits description from payload when description is only whitespace", async () => {
      mockCreateReport.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("INAPPROPRIATE"));
      fireEvent.change(screen.getByPlaceholderText("Describe the issue..."), {
        target: { value: "   " },
      });
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(mockCreateReport).toHaveBeenCalledWith(
          expect.objectContaining({ description: undefined })
        )
      );
    });

    it("shows success state after successful submission", async () => {
      mockCreateReport.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(screen.getByText("Report submitted")).toBeInTheDocument()
      );
      expect(
        screen.getByText(/has been flagged for review/i)
      ).toBeInTheDocument();
    });

    it("shows target label in success message when provided", async () => {
      mockCreateReport.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
      render(<ReportModal {...DEFAULT_PROPS} targetLabel="Night Drive" />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(screen.getByText(/"Night Drive"/)).toBeInTheDocument()
      );
    });

    it("shows Submitting... and disables button during API call", async () => {
      let resolve!: (v: unknown) => void;
      mockCreateReport.mockReturnValueOnce(
        new Promise((r) => { resolve = r; })
      );
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(screen.getByText("Submitting...")).toBeInTheDocument()
      );
      expect(screen.getByText("Submitting...")).toBeDisabled();

      resolve({ id: "r1", status: "PENDING" });
      await waitFor(() =>
        expect(screen.getByText("Report submitted")).toBeInTheDocument()
      );
    });
  });

  describe("error handling", () => {
    it("shows DUPLICATE_REPORT specific message", async () => {
      mockCreateReport.mockRejectedValueOnce(
        Object.assign(new Error("Conflict"), {
          response: { data: { code: "DUPLICATE_REPORT" } },
        })
      );
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(
          screen.getByText("You have already reported this content.")
        ).toBeInTheDocument()
      );
    });

    it("shows message from API response on generic error", async () => {
      mockCreateReport.mockRejectedValueOnce(
        Object.assign(new Error("Bad Request"), {
          response: { data: { message: "Content not eligible for reporting." } },
        })
      );
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("INAPPROPRIATE"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(
          screen.getByText("Content not eligible for reporting.")
        ).toBeInTheDocument()
      );
    });

    it("shows fallback error message when response has no message field", async () => {
      mockCreateReport.mockRejectedValueOnce(new Error("Network timeout"));
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(
          screen.getByText("Failed to submit report. Please try again.")
        ).toBeInTheDocument()
      );
    });

    it("re-enables Submit button after error so user can retry", async () => {
      mockCreateReport.mockRejectedValueOnce(new Error("fail"));
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(
          screen.getByText("Failed to submit report. Please try again.")
        ).toBeInTheDocument()
      );
      expect(screen.getByText("Submit Report")).not.toBeDisabled();
    });
  });

  describe("close behavior", () => {
    it("calls onClose when Cancel button clicked", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByText("Cancel"));
      expect(DEFAULT_PROPS.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when X (Close) button clicked", () => {
      render(<ReportModal {...DEFAULT_PROPS} />);
      fireEvent.click(screen.getByLabelText("Close"));
      expect(DEFAULT_PROPS.onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when Done button clicked after successful submit", async () => {
      mockCreateReport.mockResolvedValueOnce({ id: "r1", status: "PENDING" });
      render(<ReportModal {...DEFAULT_PROPS} />);

      fireEvent.click(screen.getByDisplayValue("SPAM"));
      fireEvent.click(screen.getByText("Submit Report"));

      await waitFor(() =>
        expect(screen.getByText("Done")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Done"));
      expect(DEFAULT_PROPS.onClose).toHaveBeenCalledTimes(1);
    });
  });
});
