"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  SiVisa, SiMastercard, SiAmericanexpress, SiPaypal, SiApplepay,
} from "react-icons/si";
import { LuShieldCheck, LuLoader } from "react-icons/lu";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentMethod = "apple" | "card" | "paypal" | null;

// ─── Plan config — reads from single source of truth ─────────────────────────
const PLANS = {
  pro: {
    name: PLAN_CONFIG.PRO.label,
    monthlyPrice: PLAN_CONFIG.PRO.monthlyPrice,
    upgradeType: "PRO" as const,
    renewLabel: `$${PLAN_CONFIG.PRO.monthlyPrice} every month`,
  },
  goplus: {
    name: PLAN_CONFIG["GO+"].label,
    monthlyPrice: PLAN_CONFIG["GO+"].monthlyPrice,
    upgradeType: "GO+" as const,
    renewLabel: `$${PLAN_CONFIG["GO+"].monthlyPrice} every month`,
  },
};

// ─── Radio option ─────────────────────────────────────────────────────────────
function RadioOption({
  selected, onClick, children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-5 py-4 rounded-lg border-2 text-left transition-all duration-150
        ${selected ? "border-[#ff5500] bg-orange-50" : "border-zinc-200 hover:border-zinc-400 bg-white"}`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
        ${selected ? "border-[#ff5500]" : "border-zinc-400"}`}>
        {selected && <span className="w-2 h-2 rounded-full bg-[#ff5500]" />}
      </span>
      {children}
    </button>
  );
}

// ─── Main checkout content ────────────────────────────────────────────────────
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const planKey = (searchParams.get("plan") ?? "pro") as keyof typeof PLANS;
  const plan = PLANS[planKey] ?? PLANS.pro;

  const [payment, setPayment] = useState<PaymentMethod>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [buyError, setBuyError] = useState<string | null>(null);

  const upgrade = useSubscriptionStore((s) => s.upgrade);
  const isLoading = useSubscriptionStore((s) => s.isLoading);

  const handleBuy = async () => {
    if (!payment) {
      setBuyError("Please select a payment method.");
      return;
    }
    setBuyError(null);
    try {
      await upgrade(plan.upgradeType);
      router.push("/discover?upgraded=true");
    } catch {
      setBuyError("Payment failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="bg-black px-8 py-4 flex items-center justify-between shadow-md">
        <div className="relative w-[100px] h-[32px]">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* ════ LEFT COLUMN ════════════════════════════════════════ */}
        <div className="flex flex-col gap-8">

          {/* ── 1. Payment Details ───────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
              1. Payment details
              <LuShieldCheck size={18} className="text-zinc-400" />
            </h2>
            <p className="text-zinc-500 text-sm mb-4">Add new payment methods</p>

            <div className="flex flex-col gap-3">

              {/* Apple Pay */}
              <RadioOption selected={payment === "apple"} onClick={() => setPayment("apple")}>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-semibold text-zinc-900 text-sm">Apple Pay</span>
                  <SiApplepay size={32} className="text-zinc-800" />
                </div>
              </RadioOption>

              {/* Card */}
              <RadioOption selected={payment === "card"} onClick={() => setPayment("card")}>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-semibold text-zinc-900 text-sm">Card</span>
                  <div className="flex items-center gap-1.5">
                    <SiVisa size={26} className="text-blue-800" />
                    <SiMastercard size={22} className="text-red-500" />
                    <SiAmericanexpress size={22} className="text-blue-500" />
                  </div>
                </div>
              </RadioOption>

              {/* PayPal */}
              <RadioOption selected={payment === "paypal"} onClick={() => setPayment("paypal")}>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-semibold text-zinc-900 text-sm">PayPal</span>
                  <SiPaypal size={20} className="text-[#003087]" />
                </div>
              </RadioOption>

            </div>

            {/* Card form — only shown if card selected */}
            {payment === "card" && (
              <div className="mt-4 p-4 border border-zinc-200 rounded-lg bg-zinc-50 flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Card number"
                  className="w-full border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-[#ff5500]"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-[#ff5500]"
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-[#ff5500]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Name on card"
                  className="w-full border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-[#ff5500]"
                />
                <p className="text-[11px] text-zinc-400">
                  🔒 Your card details are handled securely (Stripe Test Mode)
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ════ RIGHT COLUMN ═══════════════════════════════════════ */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-zinc-900">
            2. Review your purchase
          </h2>

          {/* Plan summary card */}
          <div className="flex items-center gap-4 p-4 border border-zinc-200 rounded-lg">
            <div className="w-12 h-12 bg-white border border-zinc-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm p-1">
              <Image
                src="/logo.png"
                alt="Logo"
                width={40}
                height={40}
                className="object-contain opacity-90 brightness-0"
              />
            </div>
            <span className="font-bold text-zinc-900">{plan.name}</span>
          </div>

          {/* Coupon */}
          <div>
            <button
              onClick={() => setCouponOpen(!couponOpen)}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              Do you have a coupon code?
            </button>
            {couponOpen && (
              <div className="flex gap-2 mt-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-zinc-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#ff5500]"
                />
                <button className="px-4 py-1.5 bg-zinc-900 text-white text-sm rounded hover:bg-zinc-700 transition-colors">
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-zinc-100 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-zinc-900">Total</span>
              <span className="font-bold text-zinc-900">${plan.monthlyPrice}/mo</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-600">Billing cycle</span>
              <span className="text-zinc-800 font-medium">Monthly</span>
            </div>
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
            <p className="text-red-500 text-sm font-medium">{buyError}</p>
          )}

          {/* Buy button */}
          <button
            onClick={handleBuy}
            disabled={isLoading}
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
}          >
            {isLoading ? (
              <>
                <LuLoader size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Buy subscription"
            )}
          </button>

          {/* Legal */}
          <p className="text-[11px] text-zinc-400 leading-relaxed text-center">
            By submitting your payment information and clicking Buy subscription
            you agree to the{" "}
            <a href="#" className="text-blue-500 underline hover:text-blue-700">
              Terms of Use for Artist Subscriptions
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-500 underline hover:text-blue-700">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-zinc-400">
        Loading...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}