"use client";

import React, { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SiAmericanexpress,
  SiApplepay,
  SiMastercard,
  SiPaypal,
  SiVisa,
} from "react-icons/si";
import { LuLoader, LuShieldCheck } from "react-icons/lu";

import { PLAN_CONFIG } from "@/src/config/plans";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";

interface PaymentOptionProps {
  label: string;
  icon: React.ReactNode;
}

const PLANS = {
  pro: {
    name: PLAN_CONFIG.PRO.label,
    monthlyPrice: PLAN_CONFIG.PRO.monthlyPrice,
    upgradeType: "PRO" as const,
  },
  goplus: {
    name: PLAN_CONFIG["GO+"].label,
    monthlyPrice: PLAN_CONFIG["GO+"].monthlyPrice,
    upgradeType: "GO+" as const,
  },
};

function PaymentOption({ label, icon }: PaymentOptionProps) {
  return (
    <div className="w-full flex items-center justify-between gap-3 px-5 py-4 rounded-lg border border-zinc-200 bg-white">
      <span className="font-semibold text-zinc-900 text-sm">{label}</span>
      {icon}
    </div>
  );
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planKey = (searchParams.get("plan") ?? "pro") as keyof typeof PLANS;
  const plan = PLANS[planKey] ?? PLANS.pro;

  const [couponOpen, setCouponOpen] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [buyError, setBuyError] = useState<string | null>(null);

  const upgrade = useSubscriptionStore((state) => state.upgrade);
  const isLoading = useSubscriptionStore((state) => state.isLoading);

  const handleBuy = async () => {
    setBuyError(null);

    try {
      const result = await upgrade(plan.upgradeType);
      if (result.status === "redirect") {
        window.location.assign(result.checkoutUrl);
        return;
      }

      router.push("/discover?upgraded=true");
    } catch {
      setBuyError("Could not start checkout. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white">
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
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="text-xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
              1. Secure checkout
              <LuShieldCheck size={18} className="text-zinc-400" />
            </h2>
            <p className="text-zinc-500 text-sm mb-4">
              We&apos;ll create your checkout session first, then Stripe will collect payment details securely.
            </p>

            <div className="flex flex-col gap-3">
              <PaymentOption
                label="Apple Pay"
                icon={<SiApplepay size={32} className="text-zinc-800" />}
              />
              <PaymentOption
                label="Cards"
                icon={(
                  <div className="flex items-center gap-1.5">
                    <SiVisa size={26} className="text-blue-800" />
                    <SiMastercard size={22} className="text-red-500" />
                    <SiAmericanexpress size={22} className="text-blue-500" />
                  </div>
                )}
              />
              <PaymentOption
                label="PayPal"
                icon={<SiPaypal size={20} className="text-[#003087]" />}
              />
            </div>

            <div className="mt-4 p-4 border border-zinc-200 rounded-lg bg-zinc-50">
              <p className="text-sm text-zinc-700 leading-relaxed">
                Payment methods, saved cards, and any extra verification steps are handled on Stripe&apos;s hosted checkout page.
              </p>
              <p className="text-[11px] text-zinc-400 mt-2">
                This page never collects raw card details directly.
              </p>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-zinc-900">
            2. Review your purchase
          </h2>

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
                  onChange={(event) => setCoupon(event.target.value)}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-zinc-300 rounded px-3 py-1.5 text-sm outline-none focus:border-[#ff5500]"
                />
                <button className="px-4 py-1.5 bg-zinc-900 text-white text-sm rounded hover:bg-zinc-700 transition-colors">
                  Apply
                </button>
              </div>
            )}
          </div>

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
                We&apos;ll send you to Stripe to confirm the subscription and finish payment details there.
              </p>
              <p className="text-xs text-zinc-400 mt-2">All prices in USD</p>
            </div>
          </div>

          {buyError && (
            <p className="text-red-500 text-sm font-medium">{buyError}</p>
          )}

          <button
            onClick={handleBuy}
            disabled={isLoading}
            className="w-full py-4 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={
              plan.upgradeType === "GO+"
                ? {
                    background:
                      "linear-gradient(135deg, #F5C518 0%, #D4920A 50%, #B8780A 100%)",
                    border: "1px solid #C9940C",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(180,120,0,0.4)",
                  }
                : {
                    background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                    boxShadow: "0 2px 8px rgba(109,40,217,0.4)",
                  }
            }
          >
            {isLoading ? (
              <>
                <LuLoader size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Continue to secure checkout"
            )}
          </button>

          <p className="text-[11px] text-zinc-400 leading-relaxed text-center">
            By continuing to checkout you agree to the{" "}
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

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center text-zinc-400">
          Loading...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
