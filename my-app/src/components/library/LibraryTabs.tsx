"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/library/overview" },
  { label: "Likes", href: "/library/likes" },
  { label: "Playlists", href: "/library/playlists" },
  { label: "Albums", href: "/library/albums" },
  { label: "Stations", href: "/library/stations" },
  { label: "Following", href: "/library/following" },
  { label: "History", href: "/library/history" },
];

export default function LibraryTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex flex-wrap items-center gap-8 border-b border-transparent">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`pb-2 text-[20px] font-semibold transition ${
              active
                ? "border-b-2 border-white text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}