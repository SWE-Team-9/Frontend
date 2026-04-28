"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LuCircleX, LuArrowLeft, LuCreditCard } from "react-icons/lu";
import { Suspense } from "react";

// ─── Cancel content ───────────────────────────────────────────────────────────
function CancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "pro";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center">
          <LuCircleX size={48} className="text-zinc-400" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">
            Payment cancelled
          </h1>
          <p className="text-zinc-500 text-base">
            No charge was made. You can try again whenever you&apos;re ready.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() =>
              router.push(`/subscriptions/checkout?plan=${plan}`)
            }
            className="w-full py-3 rounded-lg bg-zinc-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
          >
            <LuCreditCard size={18} /> Try again
          </button>

          <button
            onClick={() => router.push("/subscriptions")}
            className="w-full py-3 rounded-lg border border-zinc-300 text-zinc-700 font-medium flex items-center justify-center gap-2 hover:bg-zinc-50 transition-colors"
          >
            <LuArrowLeft size={18} /> Back to plans
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          Your current plan and access remain unchanged.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SubscriptionCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white" />
      }
    >
      <CancelContent />
    </Suspense>
  );
}
