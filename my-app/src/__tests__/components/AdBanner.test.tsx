import React from "react";
import { render, screen } from "@testing-library/react";
import { AdBanner } from "@/src/components/ui/AdBanner";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";

jest.mock("@/src/store/useSubscriptionStore");
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockSub = (type: "FREE" | "PRO" | "GO+", adFree: boolean) => ({
  userId: "usr_1",
  subscriptionType: type,
  uploadLimit: 3,
  uploadedTracks: 1,
  remainingUploads: 2,
  perks: { adFree, offlineListening: adFree },
});

describe("AdBanner", () => {
  it("renders for FREE users (adFree=false) — ads shown, banner visible", () => {
    (useSubscriptionStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ sub: mockSub("FREE", false) }),
    );
    render(<AdBanner />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText(/Go ad-free with Artist Pro/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /upgrade/i })).toHaveAttribute("href", "/subscriptions");
  });

  it("does NOT render for PRO users (adFree=true) — ads hidden", () => {
    (useSubscriptionStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ sub: mockSub("PRO", true) }),
    );
    render(<AdBanner />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("does NOT render for GO+ users (adFree=true) — ads hidden", () => {
    (useSubscriptionStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ sub: mockSub("GO+", true) }),
    );
    render(<AdBanner />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("does NOT render when subscription is null (not loaded yet)", () => {
    (useSubscriptionStore as unknown as jest.Mock).mockImplementation((selector: (state: unknown) => unknown) =>
      selector({ sub: null }),
    );
    render(<AdBanner />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });
});
