"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavBar from "@/src/components/ui/NavBar";

const TABS = [
  { label: "Overview", href: "/library" },
  { label: "Likes", href: "/library/likes" },
  { label: "Playlists", href: "/library/playlists" },
  { label: "Albums", href: "/library/albums" },
  { label: "Stations", href: "/library/stations" },
  { label: "Following", href: "/library/following" },
  { label: "History", href: "/library/history" },
];

export default function LibraryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="font-sans text-white min-h-screen max-w-7xl mx-auto px-6">
      <NavBar className="sticky top-0 z-50" />

      <nav className="flex items-center gap-8 border-b border-zinc-800 pt-2 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/library"
              ? pathname === "/library"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#f50]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="py-6">{children}</div>
    </div>
  );
}