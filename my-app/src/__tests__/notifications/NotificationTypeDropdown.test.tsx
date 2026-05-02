import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationTypeDropdown } from "@/src/components/notifications/NotificationTypeDropdown";
import { useNotificationStore } from "@/src/store/notificationsStore";

jest.mock("@/src/store/notificationsStore", () => ({
  useNotificationStore: jest.fn(),
}));

const mockedUseNotificationStore = useNotificationStore as unknown as jest.Mock;

function setupStore(selectedType: string = "all") {
  const setSelectedType = jest.fn();
  mockedUseNotificationStore.mockImplementation((selector: (s: unknown) => unknown) => {
    const state = { selectedType, setSelectedType };
    return selector(state);
  });
  return { setSelectedType };
}

describe("NotificationTypeDropdown", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the selected type label", () => {
    setupStore("all");
    render(<NotificationTypeDropdown />);
    expect(screen.getByText("All notifications")).toBeInTheDocument();
  });

  it("renders 'Likes' label when selectedType is like", () => {
    setupStore("like");
    render(<NotificationTypeDropdown />);
    expect(screen.getByRole("button", { name: /likes/i })).toBeInTheDocument();
  });

  it("dropdown options are not visible initially", () => {
    setupStore("all");
    render(<NotificationTypeDropdown />);
    expect(screen.queryByText("Likes")).not.toBeInTheDocument();
  });

  it("opens dropdown on button click", () => {
    setupStore("all");
    render(<NotificationTypeDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /all notifications/i }));
    expect(screen.getByText("Likes")).toBeInTheDocument();
    expect(screen.getByText("Reposts")).toBeInTheDocument();
    expect(screen.getByText("Follows")).toBeInTheDocument();
    expect(screen.getByText("Comments")).toBeInTheDocument();
  });

  it("shows all 5 type options when open", () => {
    setupStore("all");
    render(<NotificationTypeDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /all notifications/i }));
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it("calls setSelectedType and closes dropdown when option is clicked", () => {
    const { setSelectedType } = setupStore("all");
    render(<NotificationTypeDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /all notifications/i }));
    fireEvent.click(screen.getByRole("button", { name: /^likes$/i }));
    expect(setSelectedType).toHaveBeenCalledWith("like");
    expect(screen.queryByText("Reposts")).not.toBeInTheDocument();
  });

  it("calls setSelectedType with 'repost' when Reposts clicked", () => {
    const { setSelectedType } = setupStore("all");
    render(<NotificationTypeDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /all notifications/i }));
    fireEvent.click(screen.getByRole("button", { name: /^reposts$/i }));
    expect(setSelectedType).toHaveBeenCalledWith("repost");
  });

  it("calls setSelectedType with 'follow' when Follows clicked", () => {
    const { setSelectedType } = setupStore("all");
    render(<NotificationTypeDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /all notifications/i }));
    fireEvent.click(screen.getByRole("button", { name: /^follows$/i }));
    expect(setSelectedType).toHaveBeenCalledWith("follow");
  });

  it("calls setSelectedType with 'comment' when Comments clicked", () => {
    const { setSelectedType } = setupStore("all");
    render(<NotificationTypeDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /all notifications/i }));
    fireEvent.click(screen.getByRole("button", { name: /^comments$/i }));
    expect(setSelectedType).toHaveBeenCalledWith("comment");
  });

  it("calls setSelectedType with 'all' when All notifications clicked", () => {
    const { setSelectedType } = setupStore("like");
    render(<NotificationTypeDropdown />);
    fireEvent.click(screen.getByRole("button", { name: /^likes$/i }));
    fireEvent.click(screen.getAllByRole("button").find((b) => b.textContent === "All notifications")!);
    expect(setSelectedType).toHaveBeenCalledWith("all");
  });

  it("closes dropdown on outside click", () => {
    setupStore("all");
    render(
      <div>
        <NotificationTypeDropdown />
        <button data-testid="outside">Outside</button>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: /all notifications/i }));
    expect(screen.getByText("Likes")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Likes")).not.toBeInTheDocument();
  });

  it("toggles closed when trigger button is clicked again", () => {
    setupStore("all");
    render(<NotificationTypeDropdown />);
    const trigger = screen.getByRole("button", { name: /all notifications/i });
    fireEvent.click(trigger);
    expect(screen.getByText("Likes")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText("Likes")).not.toBeInTheDocument();
  });
});
