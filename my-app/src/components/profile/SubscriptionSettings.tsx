"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import {
  LuCreditCard, LuX,
  LuShieldCheck, LuCheck, LuStar, LuRefreshCw,
} from "react-icons/lu";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { PLAN_CONFIG } from "@/src/config/plans";
import { openBillingPortal } from "@/src/services/subscriptionService";

const BRAND_ICONS: Record<string, React.ReactNode> = {
  visa: <SiVisa size={22} className="text-blue-700" />,
  mastercard: <SiMastercard size={22} className="text-red-500" />,
  amex: <SiAmericanexpress size={22} className="text-blue-400" />,
};

function CardBrand({ brand }: { brand: string }) {
  return BRAND_ICONS[brand.toLowerCase()] ?? <LuCreditCard size={18} className="text-zinc-400" />;
}

function ConfirmDialog({
  title, message, confirmLabel, danger, onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel: string;
  danger?: boolean; onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-black text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-zinc-600 text-zinc-300 rounded-xl text-sm font-bold hover:border-zinc-400 transition-colors">
            Keep plan
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${danger ? "bg-red-600 hover:bg-red-500 text-white disabled:opacity-50" : "bg-[#ff5500] hover:bg-orange-500 text-white disabled:opacity-50"}`}>
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSettings() {
  const {
    sub,
    invoices,
    cancel,
    resume,
    changePlan,
    removePaymentMethod,
    fetchInvoices,
    fetchSubscription,
    isLoading,
    error,
  } = useSubscriptionStore();
  const router = useRouter();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChangePlanConfirm, setShowChangePlanConfirm] = useState(false);
  const [showRemoveCardConfirm, setShowRemoveCardConfirm] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isPro = sub?.subscriptionType === "PRO" || sub?.subscriptionType === "GO+";
  const planLabel = isPro ? (sub?.subscriptionType ?? "PRO") : "Basic";
  const isCancelPending = sub?.cancelAtPeriodEnd ?? false;
  const targetPlan: "PRO" | "GO+" = sub?.subscriptionType === "PRO" ? "GO+" : "PRO";

  useEffect(() => {
    fetchSubscription();
    fetchInvoices();
  }, [fetchInvoices, fetchSubscription]);

  const handleCancelConfirm = async () => {
    try {
      await cancel();
      setActionStatus({
        type: "success",
        message: "Subscription cancellation was scheduled successfully.",
      });
      setShowCancelConfirm(false);
    } catch {
      setActionStatus({
        type: "error",
        message: "Could not cancel subscription right now. Please try again.",
      });
    }
  };

  const handleChangePlanConfirm = async () => {
    try {
      await changePlan(targetPlan);
      setActionStatus({
        type: "success",
        message: `Plan changed to ${targetPlan} successfully.`,
      });
      setShowChangePlanConfirm(false);
    } catch {
      setActionStatus({
        type: "error",
        message: "Could not change the plan right now. Please try again.",
      });
    }
  };

  const handleRemoveCardConfirm = async () => {
    try {
      await removePaymentMethod();
      const updated = useSubscriptionStore.getState().sub;
      const expiresOn =
        updated?.cancelAtPeriodEnd && updated.currentPeriodEnd
          ? new Date(updated.currentPeriodEnd).toLocaleDateString()
          : null;

      setActionStatus({
        type: "success",
        message: expiresOn
          ? `Card removed. Your subscription stays active until ${expiresOn}.`
          : "Saved card removed successfully.",
      });
      setShowRemoveCardConfirm(false);
    } catch {
      setActionStatus({
        type: "error",
        message: "Could not remove the saved card right now. Please try again.",
      });
    }
  };

  const handleManagePayment = async () => {
    setPortalLoading(true);
    try {
      const { portalUrl } = await openBillingPortal({ flow: "payment_methods" });
      if (portalUrl && portalUrl !== "#") window.location.href = portalUrl;
      if (!portalUrl || portalUrl === "#") {
        throw new Error("Billing portal URL is unavailable.");
      }
    } finally { setPortalLoading(false); }
  };

  const handleResume = async () => {
    try {
      await resume();
      setActionStatus({
        type: "success",
        message: "Subscription resumed successfully.",
      });
    } catch {
      setActionStatus({
        type: "error",
        message: "Could not resume subscription right now. Please try again.",
      });
    }
  };

  return (
    <>
      {showCancelConfirm && (
        <ConfirmDialog title="End your subscription?"
          message={`You will lose access to all ${sub?.subscriptionType} features at the end of your billing period.`}
          confirmLabel="End subscription" danger loading={isLoading}
          onConfirm={handleCancelConfirm} onCancel={() => setShowCancelConfirm(false)} />
      )}
      {showChangePlanConfirm && (
        <ConfirmDialog title={`Switch to ${targetPlan}?`}
          message={`Your plan will be changed to ${targetPlan} at $${PLAN_CONFIG[targetPlan].monthlyPrice}/mo, effective immediately.`}
          confirmLabel={`Switch to ${targetPlan}`} loading={isLoading}
          onConfirm={handleChangePlanConfirm} onCancel={() => setShowChangePlanConfirm(false)} />
      )}
      {showRemoveCardConfirm && (
        <ConfirmDialog
          title="Remove saved card?"
          message="This removes your current default card from your account. If it is your last saved card, your paid plan may be scheduled to end at the close of the current billing period."
          confirmLabel="Remove card"
          danger
          loading={isLoading}
          onConfirm={handleRemoveCardConfirm}
          onCancel={() => setShowRemoveCardConfirm(false)}
        />
      )}

      <div className="space-y-8">
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        {actionStatus && (
          <p
            className={`text-sm ${actionStatus.type === "success" ? "text-green-400" : "text-red-400"}`}
            role="status"
          >
            {actionStatus.message}
          </p>
        )}

        {/* Current Plan */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-5">Current Plan</h2>
          <div className="bg-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {isPro && (
                <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <LuStar size={16} className="text-amber-400" fill="currentColor" />
                </div>
              )}
              <div>
                <h3 className="text-white font-black text-xl leading-tight">{planLabel}</h3>
                <p className="text-zinc-400 text-sm mt-0.5">
                  {isPro
                    ? `${PLAN_CONFIG[sub!.subscriptionType as "PRO" | "GO+"].uploadLimit.toLocaleString()} track uploads · Ad-free · Offline listening`
                    : `${PLAN_CONFIG.FREE.uploadLimit} track uploads · Ad-supported streaming`}
                </p>
                {isCancelPending && sub?.currentPeriodEnd && (
                  <p className="text-amber-400 text-xs mt-1 font-semibold">
                    Cancels {new Date(sub.currentPeriodEnd).toLocaleDateString()} — access until then
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isPro && !isCancelPending && (
                <>
                  <button onClick={() => setShowChangePlanConfirm(true)} disabled={isLoading}
                    className="px-4 py-2 border border-zinc-600 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wide hover:border-zinc-400 transition-colors disabled:opacity-50">
                    Switch to {targetPlan}
                  </button>
                  <button onClick={() => setShowCancelConfirm(true)} disabled={isLoading}
                    className="px-4 py-2 border border-red-700 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-900/30 transition-colors flex items-center gap-2 disabled:opacity-50">
                    <LuX size={13} /> Cancel
                  </button>
                </>
              )}
              {isPro && isCancelPending && (
                <button onClick={handleResume} disabled={isLoading}
                  className="px-4 py-2 border border-green-700 text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-green-900/30 transition-colors flex items-center gap-2 disabled:opacity-50">
                  <LuRefreshCw size={13} /> {isLoading ? "Resuming..." : "Resume"}
                </button>
              )}
              {!isPro && (
                <button onClick={() => router.push("/subscriptions/checkout?plan=pro")}
                  className="px-5 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-[#ff5500] hover:text-white transition-colors">
                  Try Artist Pro — ${PLAN_CONFIG.PRO.monthlyPrice}/mo
                </button>
              )}
            </div>
          </div>

          {!isPro && (
            <div className="mt-3 bg-zinc-800 rounded-xl px-5 py-4 flex items-center gap-2">
              <p className="text-zinc-400 text-sm">Are you a student?</p>
              <button onClick={() => router.push("/subscriptions/checkout?plan=student")}
                className="text-[#ff5500] text-sm font-bold hover:underline">
                Get Artist Pro for 50% off
              </button>
            </div>
          )}

          {sub && (
            <div className="mt-4 p-4 bg-zinc-800 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Upload Quota</span>
                <span className="text-zinc-300 text-xs font-bold">{sub.uploadedTracks} / {sub.uploadLimit} tracks used</span>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((sub.uploadedTracks / sub.uploadLimit) * 100, 100)}%`,
                    background: sub.uploadedTracks >= sub.uploadLimit ? "#ef4444" : sub.uploadedTracks / sub.uploadLimit > 0.7 ? "#f97316" : "#ff5500",
                  }} />
              </div>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300">Payment Method</h2>
            {isPro && (
              <button onClick={handleManagePayment} disabled={portalLoading}
                className="text-[#ff5500] text-xs font-black uppercase tracking-wide hover:opacity-80 transition-opacity disabled:opacity-50">
                {portalLoading ? "Opening..." : "Manage via Stripe"}
              </button>
            )}
          </div>
          {sub?.paymentMethodSummary ? (
            <div className="flex items-center gap-4 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
              <div className="w-10 h-7 bg-zinc-700 rounded flex items-center justify-center shrink-0">
                <CardBrand brand={sub.paymentMethodSummary.brand} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">•••• •••• •••• {sub.paymentMethodSummary.last4}</p>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wide">
                  Expires {String(sub.paymentMethodSummary.expiryMonth).padStart(2, "0")}/{String(sub.paymentMethodSummary.expiryYear).slice(-2)}
                </p>
              </div>
              <span className="ml-auto flex items-center gap-1 text-[10px] font-black text-[#ff5500] uppercase tracking-tight bg-[#ff5500]/10 px-2 py-0.5 rounded-full">
                <LuCheck size={9} /> Default
              </span>
            </div>
          ) : (
            <p className="text-zinc-600 text-sm text-center py-4">
              {isPro ? "No payment method on file." : "Upgrade to add a payment method."}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {sub?.paymentMethodSummary && (
              <button
                onClick={() => setShowRemoveCardConfirm(true)}
                disabled={isLoading}
                className="px-4 py-2 border border-red-700 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-900/30 transition-colors disabled:opacity-50"
              >
                Remove card
              </button>
            )}
            {isPro && (
              <button
                onClick={handleManagePayment}
                disabled={portalLoading}
                className="px-4 py-2 border border-zinc-600 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wide hover:border-zinc-400 transition-colors disabled:opacity-50"
              >
                {portalLoading ? "Opening..." : "Change payment method"}
              </button>
            )}
          </div>
        </div>

        {/* Purchase History */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-5">Purchase History</h2>
          {invoices.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">No purchase history yet.</p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl text-sm">
                  <div>
                    <p className="text-white font-semibold">{inv.planName}</p>
                    <p className="text-zinc-500 text-xs">
                      {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">${(inv.amountPaidCents / 100).toFixed(2)} {inv.currency.toUpperCase()}</p>
                    <p className={`text-xs font-semibold uppercase ${inv.status.toUpperCase() === "PAID" ? "text-green-400" : "text-amber-400"}`}>{inv.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Helpful Links */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-4">Helpful Links</h2>
          <ul className="space-y-2.5">
            {["Change your credit card or payment details","Troubleshoot payment failures","General payments and billing help","Understand sales tax and VAT"].map((label) => (
              <li key={label}>
                <button className="text-zinc-400 text-sm hover:text-white transition-colors text-left">{label}</button>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-zinc-600">
          <LuShieldCheck size={11} className="inline mr-1" />
          Secure payment processing · Stripe Test Mode · All prices in USD
        </p>
      </div>
    </>
  );
}
