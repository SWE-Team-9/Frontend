"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscriptionStore } from "@/src/store/useSubscriptionStore";
import { usePaymentMethodsStore } from "@/src/store/usePaymentMethodsStore";
import {
  LuCreditCard, LuX, LuPlus,
  LuShieldCheck, LuCheck, LuStar, LuRefreshCw, LuTrash2,
} from "react-icons/lu";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─── Brand icon ───────────────────────────────────────────────────────────────

const BRAND_ICONS: Record<string, React.ReactNode> = {
  visa: <SiVisa size={22} className="text-blue-700" />,
  mastercard: <SiMastercard size={22} className="text-red-500" />,
  amex: <SiAmericanexpress size={22} className="text-blue-400" />,
};

function CardBrand({ brand }: { brand: string }) {
  return (
    BRAND_ICONS[brand.toLowerCase()] ?? (
      <LuCreditCard size={18} className="text-zinc-400" />
    )
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-black text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-zinc-600 text-zinc-300 rounded-xl text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            Keep plan
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              danger
                ? "bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                : "bg-[#ff5500] hover:bg-orange-500 text-white disabled:opacity-50"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status banner (auto-cancel notice) ──────────────────────────────────────

function AutoCancelBanner({ expiresAt }: { expiresAt: string }) {
  return (
    <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm text-amber-300">
      <span className="font-bold">Card removed.</span> Your subscription will
      expire on{" "}
      <span className="font-bold">
        {new Date(expiresAt).toLocaleDateString()}
      </span>
      . Add a new card to keep it active.
    </div>
  );
}

// ─── Saved payment method row ─────────────────────────────────────────────────

function PaymentMethodRow({
  method,
  onSetDefault,
  onDelete,
  disabled,
}: {
  method: {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    cardholderName: string | null;
    isDefault: boolean;
    createdAt: string;
  };
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
      <div className="w-10 h-7 bg-zinc-700 rounded flex items-center justify-center shrink-0">
        <CardBrand brand={method.brand} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">
          •••• •••• •••• {method.last4}
        </p>
        <p className="text-[11px] text-zinc-500 uppercase tracking-wide">
          Expires {String(method.expMonth).padStart(2, "0")}/
          {String(method.expYear).slice(-2)}
          {method.cardholderName ? ` · ${method.cardholderName}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {method.isDefault ? (
          <span className="flex items-center gap-1 text-[10px] font-black text-[#ff5500] uppercase tracking-tight bg-[#ff5500]/10 px-2 py-0.5 rounded-full">
            <LuCheck size={9} /> Default
          </span>
        ) : (
          <button
            onClick={() => onSetDefault(method.id)}
            disabled={disabled}
            title="Set as default"
            className="text-[10px] text-zinc-400 hover:text-white border border-zinc-600 hover:border-zinc-400 px-2 py-0.5 rounded-full uppercase tracking-tight font-bold transition-colors disabled:opacity-50"
          >
            Set default
          </button>
        )}
        <button
          onClick={() => onDelete(method.id)}
          disabled={disabled}
          title="Remove card"
          className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors ml-1"
          aria-label={`Remove card ending in ${method.last4}`}
        >
          <LuTrash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubscriptionSettings() {
  const {
    sub,
    invoices,
    cancel,
    resume,
    changePlan,
    fetchInvoices,
    openPortal,
    isLoading: subLoading,
  } = useSubscriptionStore();
  const {
    methods,
    isLoading: pmLoading,
    error: pmError,
    lastDeleteResult,
    fetchMethods,
    setDefault,
    deleteMethod,
    clearError: clearPmError,
  } = usePaymentMethodsStore();

  const router = useRouter();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChangePlanConfirm, setShowChangePlanConfirm] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [autoCancelExpiresAt, setAutoCancelExpiresAt] = useState<string | null>(null);

  const isPro =
    sub?.subscriptionType === "PRO" || sub?.subscriptionType === "GO+";
  const planLabel = isPro ? (sub?.subscriptionType ?? "PRO") : "Basic";
  const isCancelPending = sub?.cancelAtPeriodEnd ?? false;
  const targetPlan: "PRO" | "GO+" =
    sub?.subscriptionType === "PRO" ? "GO+" : "PRO";

  useEffect(() => {
    fetchInvoices();
    fetchMethods();
  }, [fetchInvoices, fetchMethods]);

  const handleCancelConfirm = async () => {
    await cancel();
    setShowCancelConfirm(false);
  };

  const handleChangePlanConfirm = async () => {
    await changePlan(targetPlan);
    setShowChangePlanConfirm(false);
  };

  const handleManagePayment = async () => {
    setPortalLoading(true);
    try {
      const result = await openPortal("payment_methods");
      if (result.portalUrl && result.portalUrl !== "#") {
        window.location.href = result.portalUrl;
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    clearPmError();
    try {
      await setDefault(id);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    clearPmError();
    setAutoCancelExpiresAt(null);
    try {
      const result = await deleteMethod(id);
      if (result.subscriptionScheduledToCancel && result.expiresAt) {
        setAutoCancelExpiresAt(result.expiresAt);
        // Refresh subscription state to show updated cancelAtPeriodEnd
        await useSubscriptionStore.getState().fetchSubscription();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const isPaymentMethodBusy =
    pmLoading || deletingId !== null || settingDefaultId !== null;

  return (
    <>
      {/* ── Subscription cancel confirm ────────────────────────── */}
      {showCancelConfirm && (
        <ConfirmDialog
          title="End your subscription?"
          message={`You will lose access to all ${sub?.subscriptionType} features at the end of your billing period.`}
          confirmLabel="End subscription"
          danger
          loading={subLoading}
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {/* ── Change plan confirm ────────────────────────────────── */}
      {showChangePlanConfirm && (
        <ConfirmDialog
          title={`Switch to ${targetPlan}?`}
          message={`Your plan will be changed to ${targetPlan} at $${PLAN_CONFIG[targetPlan].monthlyPrice}/mo, effective immediately.`}
          confirmLabel={`Switch to ${targetPlan}`}
          loading={subLoading}
          onConfirm={handleChangePlanConfirm}
          onCancel={() => setShowChangePlanConfirm(false)}
        />
      )}

      <div className="space-y-8">

        {/* ── Current Plan ─────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-5">
            Current Plan
          </h2>
          <div className="bg-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {isPro && (
                <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                  <LuStar size={16} className="text-amber-400" fill="currentColor" />
                </div>
              )}
              <div>
                <h3 className="text-white font-black text-xl leading-tight">
                  {planLabel}
                </h3>
                <p className="text-zinc-400 text-sm mt-0.5">
                  {isPro
                    ? `${PLAN_CONFIG[sub!.subscriptionType as "PRO" | "GO+"].uploadLimit.toLocaleString()} track uploads · Ad-free · Offline listening`
                    : `${PLAN_CONFIG.FREE.uploadLimit} track uploads · Ad-supported streaming`}
                </p>
                {/* Pending cancellation notice */}
                {isCancelPending && sub?.currentPeriodEnd && (
                  <p className="text-amber-400 text-xs mt-1 font-semibold">
                    Cancels{" "}
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()} —
                    access until then
                  </p>
                )}
                {/* Pending downgrade notice */}
                {sub?.pendingDowngrade && (
                  <p className="text-amber-400 text-xs mt-1 font-semibold">
                    Downgrade to {sub.pendingDowngrade.planName} scheduled on{" "}
                    {new Date(sub.pendingDowngrade.effectiveAt).toLocaleDateString()}
                  </p>
                )}
                {/* Trial notice */}
                {sub?.trialEnd && !isCancelPending && (
                  <p className="text-violet-400 text-xs mt-1 font-semibold">
                    Free trial ends{" "}
                    {new Date(sub.trialEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isPro && !isCancelPending && (
                <>
                  <button
                    onClick={() => setShowChangePlanConfirm(true)}
                    disabled={subLoading}
                    className="px-4 py-2 border border-zinc-600 text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-wide hover:border-zinc-400 transition-colors disabled:opacity-50"
                  >
                    Switch to {targetPlan}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={subLoading}
                    className="px-4 py-2 border border-red-700 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-900/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <LuX size={13} /> Cancel
                  </button>
                </>
              )}
              {isPro && isCancelPending && (
                <button
                  onClick={() => resume()}
                  disabled={subLoading}
                  className="px-4 py-2 border border-green-700 text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-green-900/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <LuRefreshCw size={13} />{" "}
                  {subLoading ? "Resuming..." : "Resume"}
                </button>
              )}
              {!isPro && (
                <button
                  onClick={() => router.push("/subscriptions/checkout?plan=pro")}
                  className="px-5 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-[#ff5500] hover:text-white transition-colors"
                >
                  Try Artist Pro — ${PLAN_CONFIG.PRO.monthlyPrice}/mo
                </button>
              )}
            </div>
          </div>

          {!isPro && (
            <div className="mt-3 bg-zinc-800 rounded-xl px-5 py-4 flex items-center gap-2">
              <p className="text-zinc-400 text-sm">Are you a student?</p>
              <button
                onClick={() =>
                  router.push("/subscriptions/checkout?plan=goplus")
                }
                className="text-[#ff5500] text-sm font-bold hover:underline"
              >
                Get GO+ for 50% off
              </button>
            </div>
          )}

          {sub && (
            <div className="mt-4 p-4 bg-zinc-800 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold">
                  Upload Quota
                </span>
                <span className="text-zinc-300 text-xs font-bold">
                  {sub.uploadedTracks} /{" "}
                  {sub.uploadLimit === Infinity
                    ? "∞"
                    : sub.uploadLimit}{" "}
                  tracks used
                </span>
              </div>
              {sub.uploadLimit !== Infinity && (
                <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (sub.uploadedTracks / sub.uploadLimit) * 100,
                        100,
                      )}%`,
                      background:
                        sub.uploadedTracks >= sub.uploadLimit
                          ? "#ef4444"
                          : sub.uploadedTracks / sub.uploadLimit > 0.7
                          ? "#f97316"
                          : "#ff5500",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Saved Payment Methods ────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300">
              Payment Methods
            </h2>
            <button
              onClick={handleManagePayment}
              disabled={portalLoading}
              className="text-[#ff5500] text-xs font-black uppercase tracking-wide hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {portalLoading ? "Opening..." : "Manage via Portal"}
            </button>
          </div>

          {/* Error message */}
          {pmError && (
            <p className="text-red-400 text-sm mb-3" role="alert">
              {pmError}
            </p>
          )}

          {/* Auto-cancel banner */}
          {autoCancelExpiresAt && (
            <AutoCancelBanner expiresAt={autoCancelExpiresAt} />
          )}
          {lastDeleteResult?.subscriptionScheduledToCancel &&
            lastDeleteResult.expiresAt &&
            !autoCancelExpiresAt && (
              <AutoCancelBanner expiresAt={lastDeleteResult.expiresAt} />
            )}

          {/* Loading state */}
          {pmLoading && methods.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-4">
              Loading payment methods…
            </p>
          )}

          {/* Empty state */}
          {!pmLoading && methods.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-4">
              {isPro
                ? "No saved payment methods. Add a card via the portal."
                : "Upgrade to add a payment method."}
            </p>
          )}

          {/* Saved cards list */}
          {methods.length > 0 && (
            <div className="space-y-3">
              {methods.map((method) => (
                <PaymentMethodRow
                  key={method.id}
                  method={method}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                  disabled={
                    isPaymentMethodBusy &&
                    (deletingId === method.id ||
                      settingDefaultId === method.id ||
                      (deletingId !== null && deletingId !== method.id) ||
                      (settingDefaultId !== null &&
                        settingDefaultId !== method.id))
                  }
                />
              ))}
            </div>
          )}

          {/* Add card CTA */}
          {isPro && (
            <button
              onClick={handleManagePayment}
              disabled={portalLoading}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-zinc-600 text-zinc-400 rounded-xl text-sm font-bold hover:border-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <LuPlus size={15} />
              {portalLoading ? "Opening..." : "Add payment method"}
            </button>
          )}
        </div>

        {/* ── Purchase History ─────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-5">
            Purchase History
          </h2>
          {invoices.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-4">
              No purchase history yet.
            </p>
          ) : (
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl text-sm"
                >
                  <div>
                    <p className="text-white font-semibold">{inv.planName}</p>
                    <p className="text-zinc-500 text-xs">
                      {inv.paidAt
                        ? new Date(inv.paidAt).toLocaleDateString()
                        : new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      ${(inv.amountPaidCents / 100).toFixed(2)}{" "}
                      {inv.currency.toUpperCase()}
                    </p>
                    <p
                      className={`text-xs font-semibold uppercase ${
                        inv.status === "paid" || inv.status === "PAID"
                          ? "text-green-400"
                          : "text-amber-400"
                      }`}
                    >
                      {inv.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Helpful Links ────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-4">
            Helpful Links
          </h2>
          <ul className="space-y-2.5">
            {[
              "Change your credit card or payment details",
              "Troubleshoot payment failures",
              "General payments and billing help",
              "Understand sales tax and VAT",
            ].map((label) => (
              <li key={label}>
                <button
                  onClick={handleManagePayment}
                  className="text-zinc-400 text-sm hover:text-white transition-colors text-left"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-zinc-600">
          <LuShieldCheck size={11} className="inline mr-1" />
          Secure payment processing · All prices in USD
        </p>
      </div>
    </>
  );
}
