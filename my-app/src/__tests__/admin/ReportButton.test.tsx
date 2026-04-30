/**
 * Unit tests for ReportButton component.
 * Tests: hidden when unauthenticated, renders when authenticated,
 * opens modal on click, modal closes on dismiss.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockUseAuthStore = jest.fn();

jest.mock("@/src/store/useAuthStore", () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
    mockUseAuthStore(selector),
}));

jest.mock("@/src/services/reportService", () => ({
  reportService: { createReport: jest.fn() },
  ReportTargetType: { TRACK: "TRACK", COMMENT: "COMMENT", USER: "USER", PLAYLIST: "PLAYLIST" },
}));

jest.mock("@/src/components/reports/ReportModal", () => ({
  ReportModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="report-modal">
      <button onClick={onClose}>CloseModal</button>
    </div>
  ),
}));

import { ReportButton } from "@/src/components/reports/ReportButton";

const DEFAULT_PROPS = {
  targetId: "track-1",
  targetType: "TRACK" as const,
  targetLabel: "Some Track",
};

beforeEach(() => {
  mockUseAuthStore.mockReset();
});

describe("ReportButton", () => {
  it("renders nothing when user is not authenticated", () => {
    mockUseAuthStore.mockReturnValue(false);
    const { container } = render(<ReportButton {...DEFAULT_PROPS} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the flag button when authenticated", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} />);
    expect(
      screen.getByRole("button", { name: /report track/i })
    ).toBeInTheDocument();
  });

  it("has correct aria-label based on target type", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} targetType="COMMENT" />);
    expect(
      screen.getByRole("button", { name: "Report comment" })
    ).toBeInTheDocument();
  });

  it("modal is not shown initially", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} />);
    expect(screen.queryByTestId("report-modal")).not.toBeInTheDocument();
  });

  it("opens ReportModal on button click", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: /report track/i }));
    expect(screen.getByTestId("report-modal")).toBeInTheDocument();
  });

  it("closes ReportModal when onClose is called", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole("button", { name: /report track/i }));
    expect(screen.getByTestId("report-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("CloseModal"));
    expect(screen.queryByTestId("report-modal")).not.toBeInTheDocument();
  });

  it("applies custom className to the trigger button", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} className="my-custom-class" />);
    const btn = screen.getByRole("button", { name: /report track/i });
    expect(btn.className).toContain("my-custom-class");
  });

  it("handles USER target type correctly", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} targetType="USER" />);
    expect(
      screen.getByRole("button", { name: "Report user" })
    ).toBeInTheDocument();
  });

  it("handles PLAYLIST target type correctly", () => {
    mockUseAuthStore.mockReturnValue(true);
    render(<ReportButton {...DEFAULT_PROPS} targetType="PLAYLIST" />);
    expect(
      screen.getByRole("button", { name: "Report playlist" })
    ).toBeInTheDocument();
  });
});
