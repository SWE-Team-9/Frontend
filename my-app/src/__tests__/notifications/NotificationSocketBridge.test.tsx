import React from "react";
import { render } from "@testing-library/react";
import { NotificationSocketBridge } from "@/src/components/notifications/NotificationSocketBridge";
import { useNotificationsBoot } from "@/src/hooks/useNotificationsBoot";

jest.mock("@/src/hooks/useNotificationsBoot", () => ({
  useNotificationsBoot: jest.fn(),
}));

const mockedUseNotificationsBoot = useNotificationsBoot as jest.MockedFunction<typeof useNotificationsBoot>;

describe("NotificationSocketBridge", () => {
  beforeEach(() => {
    mockedUseNotificationsBoot.mockImplementation(() => undefined);
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = render(<NotificationSocketBridge />);
    expect(container).toBeDefined();
  });

  it("returns null — renders no DOM nodes", () => {
    const { container } = render(<NotificationSocketBridge />);
    expect(container.firstChild).toBeNull();
  });

  it("calls useNotificationsBoot once on mount", () => {
    render(<NotificationSocketBridge />);
    expect(mockedUseNotificationsBoot).toHaveBeenCalledTimes(1);
  });

  it("calls useNotificationsBoot again on rerender", () => {
    const { rerender } = render(<NotificationSocketBridge />);
    rerender(<NotificationSocketBridge />);
    expect(mockedUseNotificationsBoot).toHaveBeenCalledTimes(2);
  });
});
