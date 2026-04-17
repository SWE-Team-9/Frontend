import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import LibraryTabs from "@/src/components/library/LibraryTabs";

const mockUsePathname = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("LibraryTabs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all tabs", () => {
    mockUsePathname.mockReturnValue("/library/overview");
    render(<LibraryTabs />);

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Likes")).toBeInTheDocument();
    expect(screen.getByText("Playlists")).toBeInTheDocument();
    expect(screen.getByText("Albums")).toBeInTheDocument();
    expect(screen.getByText("Stations")).toBeInTheDocument();
    expect(screen.getByText("Following")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
  });

  it("marks current tab as active", () => {
    mockUsePathname.mockReturnValue("/library/history");
    render(<LibraryTabs />);

    const historyLink = screen.getByText("History");
    expect(historyLink.className).toContain("text-white");
  });
});