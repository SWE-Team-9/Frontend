"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  SiVisa, SiMastercard, SiAmericanexpress, SiPaypal, SiApplepay,
} from "react-icons/si";
import { LuShieldCheck, LuLoader } from "react-icons/lu";

// ─── Types ────────────────────────────────────────────────────────────────────
type BillingCycle = "yearly" | "monthly";
type PaymentMethod = "apple" | "card" | "paypal" | null;

// ─── Plan config ─────────────────────────────────────────────────────────────
const PLANS = {
  pro: {
    name: "Artist Pro",
    yearlyMonthly: 74.99,
    yearlyTotal: 899.88,
    monthlyTotal: 149.99,
    renewLabel: "EGP 899.88 every year",
    upgradeType: "PRO" as const,
  },
  artist: {
    name: "Artist",
    yearlyMonthly: 29.99,
    yearlyTotal: 359.88,
    monthlyTotal: 59.99,
    renewLabel: "EGP 359.88 every year",
    upgradeType: "PRO" as const,
  },
};

// ─── Helper: next renewal date ───────────────────────────────────────────────
function getNextRenewalDate(cycle: BillingCycle) {
  const d = new Date();
  cycle === "yearly" ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

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

  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [payment, setPayment] = useState<PaymentMethod>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [buyError, setBuyError] = useState<string | null>(null);

  const upgrade = useSubscriptionStore((s) => s.upgrade);
  const isLoading = useSubscriptionStore((s) => s.isLoading);

  const total = billing === "yearly" ? plan.yearlyTotal : plan.monthlyTotal;
  const renewalDate = getNextRenewalDate(billing);

  const handleBuy = async () => {
    if (!payment) {
      setBuyError("Please select a payment method.");
      return;
    }
    setBuyError(null);
    try {
      await upgrade(plan.upgradeType);
      // ✅ Upgrade succeeded → go back to discover with success flag
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

          {/* ── 1. Billing Cycle ─────────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              1. Billing cycle
            </h2>
            <div className="flex flex-col gap-3">
              <RadioOption selected={billing === "yearly"} onClick={() => setBilling("yearly")}>
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="font-semibold text-zinc-900 text-sm">Yearly billing</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      EGP {plan.yearlyTotal}, that&apos;s EGP {plan.yearlyMonthly}/month
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 bg-[#ff5500] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                    50% YEARLY DISCOUNT
                  </span>
                </div>
              </RadioOption>

              <RadioOption selected={billing === "monthly"} onClick={() => setBilling("monthly")}>
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">Monthly billing</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    EGP {plan.monthlyTotal}/month
                  </p>
                </div>
              </RadioOption>
            </div>
          </section>

          {/* ── 2. Payment Details ───────────────────────────────── */}
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
              2. Payment details
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
                  type="text" placeholder="Card number"
                  className="w-full border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-[#ff5500]"
                />
                <div className="flex gap-3">
                  <input
                    type="text" placeholder="MM / YY"
                    className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-[#ff5500]"
                  />
                  <input
                    type="text" placeholder="CVC"
                    className="flex-1 border border-zinc-300 rounded px-3 py-2 text-sm outline-none focus:border-[#ff5500]"
                  />
                </div>
                <input
                  type="text" placeholder="Name on card"
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
            3. Review your purchase
          </h2>

          {/* Plan card */}
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
              <span className="font-bold text-zinc-900">EGP {total}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-600">Billing cycle</span>
              <span className="text-zinc-800 font-medium capitalize">{billing}</span>
            </div>
            <div className="border-t border-zinc-200 pt-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Subscription will automatically renew at EGP {total} every{" "}
                {billing === "yearly" ? "year" : "month"}, starting{" "}
                {renewalDate}, unless you cancel before the day of your next
                renewal in your subscription settings.
              </p>
              <p className="text-xs text-zinc-400 mt-2">All prices in EGP</p>
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
            className="w-full py-4 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-400 text-white font-bold text-base rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
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
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-zinc-400">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}