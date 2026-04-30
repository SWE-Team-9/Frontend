/**
 * Unit tests for the Audit Log page component.
 * Tests: initial loading, success, empty state, error handling, pagination.
 */

import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import AuditLogPage from "@/src/app/admin/audit-log/page";

const mockGetAuditLog = jest.fn();

jest.mock("@/src/services/admin/adminService.real", () => ({
  adminServiceReal: {
    getAuditLog: (...args: unknown[]) => mockGetAuditLog(...args),
  },
}));

const MOCK_ENTRIES = [
  {
    id: "a1",
    action_type: "WARN_USER",
    admin_id: "admin-1",
    admin_name: "Alice",
    admin_handle: "alice",
    target_user_name: "Bob",
    target_user_handle: "bob",
    notes: "First warning",
    created_at: new Date("2024-01-15T10:00:00Z").toISOString(),
  },
  {
    id: "a2",
    action_type: "SUSPEND_USER",
    admin_id: "admin-1",
    admin_name: "Alice",
    admin_handle: "alice",
    target_user_name: "Carol",
    target_user_handle: "carol",
    notes: null,
    created_at: new Date("2024-01-14T09:00:00Z").toISOString(),
  },
];

describe("AuditLogPage", () => {
  beforeEach(() => {
    mockGetAuditLog.mockReset();
  });

  it("shows a loading spinner while fetching", async () => {
    let resolveCall!: (v: unknown) => void;
    mockGetAuditLog.mockReturnValue(
      new Promise((r) => { resolveCall = r; })
    );
    render(<AuditLogPage />);
    // Before the promise resolves, loading indicator must be visible
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    // Resolve so component can clean up without act() warnings
    await act(async () => {
      resolveCall({ items: [], pagination: { totalPages: 1 } });
    });
  });

  it("renders log entries after successful fetch", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 1 },
    });

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getByText("WARN USER")).toBeInTheDocument()
    );

    expect(screen.getAllByText("Alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("@alice").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("First warning")).toBeInTheDocument();
    expect(screen.getByText("SUSPEND USER")).toBeInTheDocument();
    expect(screen.getByText("Carol")).toBeInTheDocument();
  });

  it("renders — dash for null notes", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 1 },
    });

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getByText("WARN USER")).toBeInTheDocument()
    );
    // Carol's entry has null notes — should show —
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("shows empty state message when no entries returned", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: [],
      pagination: { totalPages: 1 },
    });

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(
        screen.getByText("No audit log entries found.")
      ).toBeInTheDocument()
    );
  });

  it("shows error message on network failure", async () => {
    mockGetAuditLog.mockRejectedValue(new Error("Network error"));

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Failed to load audit log.")
      ).toBeInTheDocument()
    );
  });

  it("hides pagination controls when totalPages is 1", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 1 },
    });

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getByText("WARN USER")).toBeInTheDocument()
    );
    expect(screen.queryByText("Previous")).not.toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("shows pagination controls and page indicator when multiple pages", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 3 },
    });

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getByText("Previous")).toBeInTheDocument()
    );
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
  });

  it("Previous button is disabled on page 1", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 3 },
    });

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getByText("Previous")).toBeInTheDocument()
    );
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("clicking Next increments page and calls getAuditLog with page 2", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 3 },
    });

    render(<AuditLogPage />);
    await waitFor(() => expect(screen.getByText("Next")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Next"));

    await waitFor(() =>
      expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument()
    );
    expect(mockGetAuditLog).toHaveBeenCalledWith(2, 20);
  });

  it("clicking Previous after Next returns to page 1", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 3 },
    });

    render(<AuditLogPage />);
    await waitFor(() => expect(screen.getByText("Next")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Next"));
    await waitFor(() =>
      expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText("Previous"));
    await waitFor(() =>
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument()
    );
    expect(mockGetAuditLog).toHaveBeenCalledWith(1, 20);
  });

  it("Next button is disabled on the last page", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 2 },
    });

    render(<AuditLogPage />);
    await waitFor(() => expect(screen.getByText("Next")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Next"));
    await waitFor(() =>
      expect(screen.getByText(/Page 2 of 2/)).toBeInTheDocument()
    );
    expect(screen.getByText("Next")).toBeDisabled();
    expect(screen.getByText("Previous")).not.toBeDisabled();
  });

  it("handles API response with flat array (no pagination wrapper)", async () => {
    mockGetAuditLog.mockResolvedValue(MOCK_ENTRIES);

    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getByText("WARN USER")).toBeInTheDocument()
    );
  });

  it("fetches with page=1 and limit=20 on initial mount", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: [],
      pagination: { totalPages: 1 },
    });

    render(<AuditLogPage />);
    await waitFor(() => expect(mockGetAuditLog).toHaveBeenCalledTimes(1));
    expect(mockGetAuditLog).toHaveBeenCalledWith(1, 20);
  });

  it("renders the Audit Log heading", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: [],
      pagination: { totalPages: 1 },
    });
    render(<AuditLogPage />);
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
  });

  it("shows admin handle when present", async () => {
    mockGetAuditLog.mockResolvedValue({
      items: MOCK_ENTRIES,
      pagination: { totalPages: 1 },
    });
    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getAllByText("@alice").length).toBeGreaterThan(0)
    );
  });

  it("shows — for missing target user", async () => {
    const entryWithoutTarget = [
      {
        id: "a3",
        action_type: "HIDE_TRACK",
        admin_id: "admin-1",
        admin_name: "Alice",
        notes: "Hidden track",
        created_at: new Date().toISOString(),
      },
    ];
    mockGetAuditLog.mockResolvedValue({
      items: entryWithoutTarget,
      pagination: { totalPages: 1 },
    });
    render(<AuditLogPage />);
    await waitFor(() =>
      expect(screen.getByText("HIDE TRACK")).toBeInTheDocument()
    );
    // No target_user_name → shows — in target column
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
