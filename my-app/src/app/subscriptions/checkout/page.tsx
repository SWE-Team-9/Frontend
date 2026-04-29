"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import { LuShieldCheck, LuLoader, LuCheck, LuArrowLeft } from "react-icons/lu";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─── Plan config — reads from single source of truth ─────────────────────────

const PLANS = {
  pro: {
    name: PLAN_CONFIG.PRO.label,
    monthlyPrice: PLAN_CONFIG.PRO.monthlyPrice,
    upgradeType: "PRO" as const,
    renewLabel: `$${PLAN_CONFIG.PRO.monthlyPrice}/month`,
    trialDays: 7,
    description: "100 track uploads · Ad-free · Offline listening · Priority support",
    accentColor: "#7c3aed",
  },
  goplus: {
    name: PLAN_CONFIG["GO+"].label,
    monthlyPrice: PLAN_CONFIG["GO+"].monthlyPrice,
    upgradeType: "GO+" as const,
    renewLabel: `$${PLAN_CONFIG["GO+"].monthlyPrice}/month`,
    trialDays: 30,
    description: "1,000 track uploads · Ad-free · Offline listening · Priority support",
    accentColor: "#f0a046",
  },
};

// ─── Perks list ───────────────────────────────────────────────────────────────

const SHARED_PERKS = [
  "Ad-free listening experience",
  "Offline track saving (IndexedDB cache)",
  "Expanded upload quota",
  "Priority customer support",
];

// ─── Main checkout content ────────────────────────────────────────────────────

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planKey = (searchParams.get("plan") ?? "pro") as keyof typeof PLANS;
  const plan = PLANS[planKey] ?? PLANS.pro;

  const [buyError, setBuyError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const upgrade = useSubscriptionStore((s) => s.upgrade);
  const isLoading = useSubscriptionStore((s) => s.isLoading);

  const handleBuy = async () => {
    setBuyError(null);
    setRedirecting(false);
    try {
      await upgrade(plan.upgradeType);
      // If we reach here, either:
      //   a) Mock billing provider: subscription activated immediately
      //   b) Downgrade scheduled: no redirect needed
      // Real Stripe checkout: browser has already navigated away (window.location.href set)
      router.push("/subscriptions/success");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; code?: string } } };
      const code = axiosErr?.response?.data?.code;
      const message = axiosErr?.response?.data?.message;

      if (code === "EMAIL_NOT_VERIFIED") {
        setBuyError("Please verify your email address before subscribing.");
      } else if (code === "SUBSCRIPTION_ALREADY_ACTIVE") {
        setBuyError("You already have an active subscription. Manage it in settings.");
      } else {
        setBuyError(message ?? "Subscription failed. Please try again.");
      }
      setRedirecting(false);
    }
  };

  const busy = isLoading || redirecting;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="bg-black px-8 py-4 flex items-center gap-4 shadow-md">
        <button
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <LuArrowLeft size={20} />
        </button>
        <div className="relative w-[100px] h-[32px]">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* ════ LEFT COLUMN ════════════════════════════════════════ */}
        <div className="flex flex-col gap-8">

          {/* ── Plan summary ─────────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <LuShieldCheck size={18} className="text-zinc-400" />
              Your subscription
            </h2>

            <div
              className="rounded-xl border-2 p-5"
              style={{ borderColor: plan.accentColor + "40" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: plan.accentColor + "20" }}
                >
                  <span className="text-lg font-black" style={{ color: plan.accentColor }}>
                    {plan.upgradeType === "GO+" ? "★" : "♦"}
                  </span>
                </div>
                <div>
                  <p className="font-black text-zinc-900">{plan.name}</p>
                  <p className="text-xs text-zinc-500">{plan.description}</p>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-3 flex items-baseline justify-between">
                <span className="text-zinc-600 text-sm">Monthly</span>
                <span className="font-black text-zinc-900 text-lg">
                  ${plan.monthlyPrice}
                  <span className="text-sm font-normal text-zinc-400">/mo</span>
                </span>
              </div>

              {plan.trialDays > 0 && (
                <p
                  className="mt-2 text-xs font-semibold px-2 py-1 rounded-md inline-block"
                  style={{
                    color: plan.accentColor,
                    backgroundColor: plan.accentColor + "15",
                  }}
                >
                  {plan.trialDays}-day free trial for first-time subscribers
                </p>
              )}
            </div>
          </section>

          {/* ── What's included ──────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">
              What&apos;s included
            </h3>
            <ul className="space-y-2">
              {SHARED_PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm text-zinc-700">
                  <LuCheck size={14} className="text-green-500 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </section>

          {/* ── Payment note ─────────────────────────────────────── */}
          <div className="bg-zinc-50 rounded-xl p-4 text-sm text-zinc-500 leading-relaxed">
            <p className="font-semibold text-zinc-700 mb-1">How payment works</p>
            <p>
              Click &quot;Start subscription&quot; to proceed. In development mode,
              your subscription activates immediately. In production, you&apos;ll
              be directed to our secure payment page where you can enter your card
              details. Cancel anytime from your settings.
            </p>
          </div>
        </div>

        {/* ════ RIGHT COLUMN ═══════════════════════════════════════ */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-zinc-900">
            Order summary
          </h2>

          {/* Summary card */}
          <div className="bg-zinc-50 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-zinc-900">{plan.name}</span>
              <span className="font-bold text-zinc-900">
                ${plan.monthlyPrice}/mo
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-600">Billing cycle</span>
              <span className="text-zinc-800 font-medium">Monthly</span>
            </div>
            {plan.trialDays > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-600">Due today</span>
                <span className="text-green-600 font-bold">$0.00 (trial)</span>
              </div>
            )}
            <div className="border-t border-zinc-200 pt-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Subscription renews at ${plan.monthlyPrice}/month.
                Cancel anytime in your subscription settings.
              </p>
              <p className="text-xs text-zinc-400 mt-2">All prices in USD</p>
            </div>
          </div>

          {/* Error */}
          {buyError && (
            <p className="text-red-500 text-sm font-medium" role="alert">
              {buyError}
            </p>
          )}

          {/* Subscribe button */}
          <button
            onClick={handleBuy}
            disabled={busy}
            className="w-full py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              plan.upgradeType === "GO+"
                ? {
                    background: "linear-gradient(135deg, #F5C518 0%, #D4920A 50%, #B8780A 100%)",
                    border: "1px solid #C9940C",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(180,120,0,0.4)",
                  }
                : plan.upgradeType === "PRO"
                ? {
                    background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                    boxShadow: "0 2px 8px rgba(109,40,217,0.4)",
                  }
                : { backgroundColor: "#3f3f46" }
            }
          >
            {busy ? (
              <>
                <LuLoader size={18} className="animate-spin" />
                {redirecting ? "Redirecting to payment…" : "Processing..."}
              </>
            ) : (
              `Start ${plan.name} subscription`
            )}
          </button>

          {/* Legal */}
          <p className="text-[11px] text-zinc-400 leading-relaxed text-center">
            By clicking &quot;Start subscription&quot; you agree to the{" "}
            <a href="#" className="text-blue-500 underline hover:text-blue-700">
              Terms of Use for Artist Subscriptions
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-500 underline hover:text-blue-700">
              Privacy Policy
            </a>
            . Your subscription auto-renews monthly. Cancel anytime.
          </p>

          <p className="text-center text-[11px] text-zinc-500">
            <LuShieldCheck size={11} className="inline mr-1" />
            Secure payment · Powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-zinc-400">
          <LuLoader size={28} className="animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
