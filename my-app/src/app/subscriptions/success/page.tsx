"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LuCheckCircle, LuLoader, LuArrowRight } from "react-icons/lu";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";

// ─── Success content (needs useSearchParams, must be wrapped in Suspense) ─────
function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const fetchSubscription = useSubscriptionStore((s) => s.fetchSubscription);
  const sub = useSubscriptionStore((s) => s.sub);

  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    // Re-fetch subscription so the UI reflects the newly activated plan.
    // The webhook may take a few seconds to fire; we poll briefly.
    let attempts = 0;
    const maxAttempts = 6;
    const intervalMs = 2000;

    const poll = async () => {
      await fetchSubscription();
      attempts++;
      // Stop polling once we see an active paid subscription, or after max attempts
      const isActive =
        useSubscriptionStore.getState().sub?.subscriptionType !== "FREE";
      if (isActive || attempts >= maxAttempts) {
        setStatus("ready");
        return;
      }
      setTimeout(poll, intervalMs);
    };

    poll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planLabel = sub?.subscriptionType ?? "PRO";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16 text-center">
      {status === "loading" ? (
        <div className="flex flex-col items-center gap-4">
          <LuLoader size={40} className="animate-spin text-[#ff5500]" />
          <p className="text-zinc-500 text-sm">Confirming your subscription…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 max-w-md">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <LuCheckCircle size={48} className="text-green-500" />
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-3xl font-black text-zinc-900 mb-2">
              You&apos;re on {planLabel}!
            </h1>
            <p className="text-zinc-500 text-base">
              Your payment was successful. Your subscription is now active.
            </p>
            {sessionId && (
              <p className="text-zinc-400 text-xs mt-2 font-mono">
                Session: {sessionId}
              </p>
            )}
          </div>

          {/* Perks summary */}
          <ul className="text-left text-sm text-zinc-700 space-y-2 w-full bg-zinc-50 rounded-xl p-5">
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span> Ad-free listening
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span> Offline track saving
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span> Expanded upload quota
            </li>
          </ul>

          {/* CTA */}
          <button
            onClick={() => router.push("/discover")}
            className="w-full py-3 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
          >
            Start listening <LuArrowRight size={18} />
          </button>

          <button
            onClick={() => router.push("/settings")}
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Manage subscription
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <LuLoader size={32} className="animate-spin text-[#ff5500]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
