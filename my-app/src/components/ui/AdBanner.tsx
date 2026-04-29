"use client";

import React from "react";
import Link from "next/link";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";

export function AdBanner() {
  const sub = useSubscriptionStore((state) => state.sub);

  // Do not render if:
  // - subscription not yet loaded (null)
  // - user is on a premium plan (adFree === true)
  if (!sub || sub.perks?.adFree) return null;

  return (
    <div
      className="w-full bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-1.5 flex items-center justify-between gap-4"
      role="banner"
      aria-label="Advertisement banner"
    >
      <div className="flex items-center gap-2 text-xs text-zinc-500 shrink-0">
        <span className="uppercase tracking-wider font-semibold text-[10px] border border-zinc-700 px-1.5 py-0.5 rounded text-zinc-600">
          AD
        </span>
        <span>Go ad-free with Artist Pro</span>
      </div>

      <Link
        href="/subscriptions"
        className="shrink-0 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors whitespace-nowrap"
      >
        Upgrade →
      </Link>
    </div>
  );
}
