"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscriptionStore, SavedCard } from "@/src/store/useSubscriptionStore";
import {
  LuCreditCard, LuTrash2, LuPlus, LuX,
  LuShieldCheck, LuCheck, LuStar,
} from "react-icons/lu";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRAND_ICONS: Record<string, React.ReactNode> = {
  visa: <SiVisa size={22} className="text-blue-700" />,
  mastercard: <SiMastercard size={22} className="text-red-500" />,
  amex: <SiAmericanexpress size={22} className="text-blue-400" />,
};

function CardBrand({ brand }: { brand: string }) {
  return BRAND_ICONS[brand.toLowerCase()] ?? <LuCreditCard size={18} className="text-zinc-400" />;
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

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
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-zinc-600 text-zinc-300 rounded-xl text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            Keep plan
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors
              ${danger
                ? "bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                : "bg-[#ff5500] hover:bg-orange-500 text-white disabled:opacity-50"}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add card form ────────────────────────────────────────────────────────────

function AddCardForm({ onAdd, onClose }: { onAdd: (card: Omit<SavedCard, "id" | "isDefault">) => void; onClose: () => void }) {
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (number.replace(/\s/g, "").length < 16 || !expiry || !cvc || !name.trim()) {
      setError("Please fill in all card fields correctly.");
      return;
    }
    const last4 = number.replace(/\s/g, "").slice(-4);
    const [expMonth, expYear] = expiry.split("/").map(Number);
    onAdd({ last4, brand: "visa", expMonth, expYear: 2000 + expYear });
    onClose();
  };

  const formatNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  return (
    <div className="mt-4 p-4 bg-zinc-800/60 border border-zinc-700 rounded-xl space-y-3">
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">New Card</p>
      <input
        value={number} onChange={(e) => setNumber(formatNumber(e.target.value))}
        placeholder="Card number"
        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ff5500] placeholder-zinc-600"
      />
      <div className="flex gap-3">
        <input
          value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          placeholder="MM/YY"
          className="flex-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ff5500] placeholder-zinc-600"
        />
        <input
          value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="CVC"
          className="flex-1 bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ff5500] placeholder-zinc-600"
        />
      </div>
      <input
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Name on card"
        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#ff5500] placeholder-zinc-600"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 py-2 border border-zinc-600 text-zinc-400 text-xs font-bold rounded-lg hover:border-zinc-400 transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} className="flex-1 py-2 bg-[#ff5500] text-white text-xs font-bold rounded-lg hover:bg-orange-500 transition-colors">
          Save Card
        </button>
      </div>
      <p className="text-[10px] text-zinc-600 text-center flex items-center justify-center gap-1">
        <LuShieldCheck size={10} /> Secure · Stripe Test Mode
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubscriptionSettings() {
  const { sub, cards, cancel, addCard, removeCard, setDefaultCard, isLoading } =
    useSubscriptionStore();
  const router = useRouter();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);

  const isPro = sub?.subscriptionType === "PRO" || sub?.subscriptionType === "GO+";
  const planLabel = isPro ? (sub?.subscriptionType ?? "PRO") : "Basic";

  const handleCancelConfirm = async () => {
    await cancel();
    setShowCancelConfirm(false);
  };

  const handleRemoveCard = async (cardId: string) => {
    removeCard(cardId);
    setRemovingCardId(null);
  };

  return (
    <>
      {/* ── Cancel confirm dialog ──────────────────────────── */}
      {showCancelConfirm && (
        <ConfirmDialog
          title="End your subscription?"
          message={`You'll lose access to all ${sub?.subscriptionType} features immediately. Your account will revert to the Basic (Free) plan.`}
          confirmLabel="End subscription"
          danger
          loading={isLoading}
          onConfirm={handleCancelConfirm}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}

      {/* ── Remove card confirm dialog ─────────────────────── */}
      {removingCardId && (
        <ConfirmDialog
          title="Remove this card?"
          message="This payment method will be permanently removed from your account."
          confirmLabel="Remove card"
          danger
          onConfirm={() => handleRemoveCard(removingCardId)}
          onCancel={() => setRemovingCardId(null)}
        />
      )}

      <div className="space-y-8">

        {/* ══ SECTION 1: Current Plan ═══════════════════════════ */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-5">
            Current Plans
          </h2>

          {/* Plan card — matches SoundCloud screenshot exactly */}
          <div className="bg-zinc-800 rounded-xl p-5 flex items-center justify-between gap-4">
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
              </div>
            </div>

            {isPro ? (
              <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isLoading}
                className="shrink-0 px-4 py-2 border border-red-700 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-red-900/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <LuX size={13} />
                End Subscription
              </button>
            ) : (
              <button
  onClick={() => router.push("/subscriptions/checkout?plan=pro")}
  className="shrink-0 px-5 py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-[#ff5500] hover:text-white transition-colors"
>
  Try Artist Pro — ${PLAN_CONFIG.PRO.monthlyPrice}/mo
</button>
            )}
          </div>

          {/* Student banner — matches image 2 */}
          {!isPro && (
            <div className="mt-3 bg-zinc-800 rounded-xl px-5 py-4 flex items-center gap-2">
              <p className="text-zinc-400 text-sm">Are you a student?</p>
              <button
                onClick={() => router.push("/subscriptions/checkout?plan=student")}
                className="text-[#ff5500] text-sm font-bold hover:underline"
              >
                Get Artist Pro for 50% off
              </button>
            </div>
          )}

          {/* Upload quota bar */}
          {sub && (
            <div className="mt-4 p-4 bg-zinc-800 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 text-xs uppercase tracking-wider font-bold">Upload Quota</span>
                <span className="text-zinc-300 text-xs font-bold">
                  {sub.uploadedTracks} / {sub.uploadLimit} tracks used
                </span>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((sub.uploadedTracks / sub.uploadLimit) * 100, 100)}%`,
                    background:
                      sub.uploadedTracks >= sub.uploadLimit
                        ? "#ef4444"
                        : sub.uploadedTracks / sub.uploadLimit > 0.7
                          ? "#f97316"
                          : "#ff5500",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ══ SECTION 2: Payment Methods ════════════════════════ */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300">
              Payment Methods
            </h2>
            <button
              onClick={() => setShowAddCard((v) => !v)}
              className="flex items-center gap-1.5 text-[#ff5500] text-xs font-black uppercase tracking-wide hover:opacity-80 transition-opacity"
            >
              <LuPlus size={14} />
              Add New
            </button>
          </div>

          {/* Add card form */}
          {showAddCard && (
            <AddCardForm
              onAdd={addCard}
              onClose={() => setShowAddCard(false)}
            />
          )}

          {/* Saved cards list */}
          <div className="space-y-3 mt-4">
            {cards.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-4">
                No payment methods saved.
              </p>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors group
                    ${card.isDefault
                      ? "border-[#ff5500]/50 bg-zinc-800"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-7 bg-zinc-700 rounded flex items-center justify-center">
                      <CardBrand brand={card.brand} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        •••• •••• •••• {card.last4}
                      </p>
                      <p className="text-[11px] text-zinc-500 uppercase tracking-wide">
                        Expires {String(card.expMonth).padStart(2, "0")}/
                        {String(card.expYear).slice(-2)}
                      </p>
                    </div>
                    {card.isDefault && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-[#ff5500] uppercase tracking-tight bg-[#ff5500]/10 px-2 py-0.5 rounded-full">
                        <LuCheck size={9} />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!card.isDefault && (
                      <button
                        onClick={() => setDefaultCard(card.id)}
                        className="text-[11px] text-zinc-400 hover:text-white font-bold px-2 py-1 rounded hover:bg-zinc-700 transition-colors"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => setRemovingCardId(card.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label="Remove card"
                    >
                      <LuTrash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ══ SECTION 3: Purchase History ═══════════════════════ */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-5">
            Purchase History
          </h2>
          <p className="text-zinc-600 text-sm text-center py-4">
            No purchase history yet.
          </p>
        </div>

        {/* ══ Helpful Links ══════════════════════════════════════ */}
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
                <button className="text-zinc-400 text-sm hover:text-white transition-colors text-left">
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-zinc-600">
          <LuShieldCheck size={11} className="inline mr-1" />
          Secure payment processing · Stripe Test Mode · All prices in EGP
        </p>
      </div>
    </>
  );
}