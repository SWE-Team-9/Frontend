import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { NotificationPreferences } from "@/src/components/notifications/NotificationPreferences";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/src/services/notificationsService";

jest.mock("@/src/services/notificationsService", () => ({
  getNotificationPreferences: jest.fn(),
  updateNotificationPreferences: jest.fn(),
}));

const mockedGet = getNotificationPreferences as jest.MockedFunction<
  typeof getNotificationPreferences
>;
const mockedUpdate = updateNotificationPreferences as jest.MockedFunction<
  typeof updateNotificationPreferences
>;

const DEFAULT_PREFS = {
  likes: true,
  comments: true,
  follows: false,
  reposts: false,
};

describe("NotificationPreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading text while fetching", () => {
    mockedGet.mockReturnValueOnce(new Promise(() => {}));
    render(<NotificationPreferences />);
    expect(
      screen.getByText(/loading notification preferences/i),
    ).toBeInTheDocument();
  });

  it("renders all four preference checkboxes after loading", async () => {
    mockedGet.mockResolvedValueOnce(DEFAULT_PREFS);
    render(<NotificationPreferences />);
    await waitFor(() => expect(screen.getByText("Likes")).toBeInTheDocument());
    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.getByText("New followers")).toBeInTheDocument();
    expect(screen.getByText("Reposts")).toBeInTheDocument();
  });

  it("reflects correct checked state from loaded preferences", async () => {
    mockedGet.mockResolvedValueOnce(DEFAULT_PREFS);
    render(<NotificationPreferences />);
    await waitFor(() => screen.getByText("Likes"));

    const checkboxes = screen.getAllByRole("checkbox");
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[2] as HTMLInputElement).checked).toBe(false);
    expect((checkboxes[3] as HTMLInputElement).checked).toBe(false);
  });

  it("shows error fallback when load fails", async () => {
    mockedGet.mockResolvedValueOnce(null as unknown as typeof DEFAULT_PREFS);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<NotificationPreferences />);
    await waitFor(() =>
      expect(
        screen.getByText(/could not load notification preferences/i),
      ).toBeInTheDocument(),
    );
    consoleSpy.mockRestore();
  });

  it("toggles a preference optimistically and calls updateNotificationPreferences", async () => {
    mockedGet.mockResolvedValueOnce(DEFAULT_PREFS);
    mockedUpdate.mockResolvedValueOnce({ message: "updated" });

    render(<NotificationPreferences />);
    await waitFor(() => screen.getByText("Likes"));

    const checkboxes = screen.getAllByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkboxes[0]);
    });

    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ likes: false }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/notification preferences updated/i),
      ).toBeInTheDocument(),
    );
  });

  it("reverts optimistic update on save failure and shows error message", async () => {
    mockedGet.mockResolvedValueOnce(DEFAULT_PREFS);
    mockedUpdate.mockRejectedValueOnce(new Error("save failed"));

    render(<NotificationPreferences />);
    await waitFor(() => screen.getByText("Likes"));

    const checkboxes = screen.getAllByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkboxes[0]);
    });

    await waitFor(() =>
      expect(
        screen.getByText(/failed to update preferences/i),
      ).toBeInTheDocument(),
    );

    const checkboxesAfter = screen.getAllByRole("checkbox");
    expect((checkboxesAfter[0] as HTMLInputElement).checked).toBe(true);
  });

  it("disables checkboxes while saving", async () => {
    mockedGet.mockResolvedValueOnce(DEFAULT_PREFS);
    let resolveUpdate!: (v: { message: string }) => void;
    mockedUpdate.mockReturnValueOnce(
      new Promise((res) => {
        resolveUpdate = res;
      }),
    );

    render(<NotificationPreferences />);
    await waitFor(() => screen.getByText("Likes"));

    const checkboxes = screen.getAllByRole("checkbox");
    act(() => {
      fireEvent.click(checkboxes[0]);
    });

    await waitFor(() => {
      const updated = screen.getAllByRole("checkbox");
      expect(updated[0]).toBeDisabled();
    });

    act(() => resolveUpdate({ message: "done" }));
    await waitFor(() => {
      const updated = screen.getAllByRole("checkbox");
      expect(updated[0]).not.toBeDisabled();
    });
  });

  it("does not call update when preferences have not been loaded", async () => {
    mockedGet.mockResolvedValueOnce(null as unknown as typeof DEFAULT_PREFS);
    render(<NotificationPreferences />);
    await waitFor(() =>
      expect(
        screen.getByText(/could not load notification preferences/i),
      ).toBeInTheDocument(),
    );
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("toggles follows preference correctly", async () => {
    mockedGet.mockResolvedValueOnce(DEFAULT_PREFS);
    mockedUpdate.mockResolvedValueOnce({ message: "ok" });

    render(<NotificationPreferences />);
    await waitFor(() => screen.getByText("New followers"));

    const checkboxes = screen.getAllByRole("checkbox");
    await act(async () => {
      fireEvent.click(checkboxes[2]);
    });

    expect(mockedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ follows: true }),
    );
  });
});
