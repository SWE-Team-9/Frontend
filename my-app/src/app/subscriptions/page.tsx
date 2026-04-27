"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuPlay, LuGlobe, LuUpload, LuZap, LuShare2, 
  LuRefreshCw, LuCheck, LuArrowRight,
} from "react-icons/lu";
import { HiSparkles } from "react-icons/hi2";
import { FaDiamond } from "react-icons/fa6";
import { PLAN_CONFIG } from "@/src/config/plans";

// ─── Types ─────────────────────────────────────────────────────────────────────
type BadgeStyle = "purple" | "gold" | null;

interface FeatureRow {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeStyle?: BadgeStyle;
}

interface Plan {
  key: string;
  tier: "free" | "pro" | "goplus";
  name: string;
  tagline: string;
  price: string;

  features: FeatureRow[];
  cta: string;
  href: string;
  accentColor: string;
  textColor: string;
  popular: boolean;
}

// ─── Feature icon map ──────────────────────────────────────────────────────────
const FeatureIcon = ({ name }: { name: string }) => {
  const cls = "w-4 h-4 shrink-0";
  const map: Record<string, React.ReactNode> = {
    upload:     <LuUpload className={cls} />,
    boost:      <LuZap className={cls} />,
    distribute: <LuShare2 className={cls} />,
    replace:    <LuRefreshCw className={cls} />,
    check:      <LuCheck className={cls} />,
    play:       <LuPlay className={cls} />,
    globe:      <LuGlobe className={cls} />,
  };
  return <>{map[name] ?? <LuCheck className={cls} />}</>;
};

// ─── Plans data — reads from PLAN_CONFIG ──────────────────────────────────────
const PLANS: Plan[] = [
  {
    key: "free",
    tier: "free",
    name: "Free",
    tagline: "Basic features to get you started on your music journey.",
    price: `$${PLAN_CONFIG.FREE.monthlyPrice.toFixed(2)}`,
    accentColor: "#71717a",
    textColor: "#71717a",
    popular: false,
    cta: "Get started",
    href: "/discover",
    features: [
      { icon: <FeatureIcon name="play" />,       label: "Stream all public tracks" },
      { icon: <FeatureIcon name="globe" />,      label: "Basic profile customization" },
      { icon: <FeatureIcon name="upload" />,     label: `${PLAN_CONFIG.FREE.uploadLimit} track uploads limit` },
      { icon: <FeatureIcon name="check" />,      label: "Standard audio quality" },
    ],
  },
  {
    key: "pro",
    tier: "pro",
    name: "Artist Pro",
    tagline: "Tailored access to essential artist tools",
    price: `$${PLAN_CONFIG.PRO.monthlyPrice.toFixed(2)}`,
    accentColor: "#7c3aed",
    textColor: "#7c3aed",
    popular: false,
    cta: "Get started",
    href: "/subscriptions/checkout?plan=pro",
    features: [
      { icon: <FeatureIcon name="upload" />,     label: `${PLAN_CONFIG.PRO.uploadLimit} track uploads` },
      { icon: <FeatureIcon name="boost" />,      label: "Boost tracks & get 100+ listeners", badge: "2X MONTH",  badgeStyle: "purple" },
      { icon: <FeatureIcon name="distribute" />, label: "Distribute & monetize tracks",       badge: "2X MONTH",  badgeStyle: "purple" },
      { icon: <FeatureIcon name="replace" />,    label: "Track Replacement",                  badge: "3X MONTH",  badgeStyle: "purple" },
    ],
  },
  {
    key: "goplus",
    tier: "goplus",
    name: "GO+",
    tagline: "Unlimited access to all artist tools",
    price: `$${PLAN_CONFIG["GO+"].monthlyPrice.toFixed(2)}`,
    accentColor: "#f0a046",
    textColor: "#f0a046",
    popular: true,
    cta: "Get started",
    href: "/subscriptions/checkout?plan=goplus",
    features: [
      { icon: <FeatureIcon name="upload" />,     label: "Unlimited uploads" },
      { icon: <FeatureIcon name="boost" />,      label: "Boost tracks and get 100+ listeners", badge: "UNLIMITED", badgeStyle: "gold" },
      { icon: <FeatureIcon name="distribute" />, label: "Distribute & monetize tracks",        badge: "UNLIMITED", badgeStyle: "gold" },
      { icon: <FeatureIcon name="replace" />,    label: "Replace tracks without losing stats", badge: "UNLIMITED", badgeStyle: "gold" },
    ],
  },
];

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ text, style }: { text: string; style: BadgeStyle }) {
  if (!style) return null;
  const styles = {
    purple: "border border-violet-400 text-violet-500 bg-violet-50",
    gold:   "border border-amber-400 text-amber-600 bg-amber-50",
  };
  return (
    <span className={`ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ${styles[style]}`}>
      {text}
    </span>
  );
}

// ─── Single plan card ─────────────────────────────────────────────────────────
function PlanCard({ plan, hovered, onHover }: {
  plan: Plan;
  hovered: boolean;
  onHover: (key: string | null) => void;
}) {
  const router = useRouter();

  const isPopular = plan.popular;
  const isFree = plan.tier === "free";

  return (
    <div
      className="relative flex flex-col"
      onMouseEnter={() => onHover(plan.key)}
      onMouseLeave={() => onHover(null)}
    >
      {/* ── Popular ribbon ──────────────────────────────────────── */}
      {isPopular ? (
        <div
          className="rounded-t-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] text-center py-2.5 px-4"
          style={{ backgroundColor: plan.accentColor }}
        >
          Most Popular
        </div>
      ) : (
        <div className="h-[37px]" /> // spacer to keep cards aligned
      )}

      {/* ── Card body ───────────────────────────────────────────── */}
      <div
        className={`
          flex flex-col flex-1 p-8 bg-white rounded-b-2xl transition-all duration-300
          ${isPopular
            ? "border-2 rounded-tl-none rounded-tr-none shadow-2xl"
            : "border border-zinc-200 rounded-t-2xl shadow-sm"
          }
          ${hovered && !isPopular ? "shadow-lg -translate-y-1" : ""}
          ${hovered && isPopular ? "shadow-3xl -translate-y-1" : ""}
        `}
        style={{
          borderColor: isPopular ? plan.accentColor : hovered ? plan.accentColor : undefined,
          transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        }}
      >
        {/* Name + icon */}
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{plan.name}</h3>
          <span style={{ color: plan.accentColor }} className="text-xl">
            {plan.tier === "goplus" ? <HiSparkles /> : plan.tier === "pro" ? <FaDiamond size={14} /> : "✦"}
          </span>
        </div>

        {/* Tagline */}
        <p className="text-zinc-500 text-sm leading-snug mb-6 min-h-[36px]">{plan.tagline}</p>

        {/* Price */}
        <div className="mb-1">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tight" style={{ color: isFree ? "#71717a" : plan.accentColor }}>
              {plan.price}
            </span>
            <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-tighter ml-1">/ Month</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push(plan.href)}
          className={`
            w-full mt-6 mb-8 py-3.5 rounded-full font-black text-[11px] uppercase tracking-[0.2em]
            transition-all duration-200 text-white
            ${hovered ? "opacity-100 scale-[1.02]" : "opacity-95"}
          `}
          style={
  plan.tier === "goplus"
    ? {
        background: "linear-gradient(135deg, #F5C518 0%, #D4920A 50%, #B8780A 100%)",
        border: "1px solid #C9940C",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(180,120,0,0.4)",
        color: "#fff",
        letterSpacing: "0.15em",
      }
    : plan.tier === "pro"
    ? {
        background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
        border: "1px solid #7C3AED",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(109,40,217,0.4)",
      }
    : { backgroundColor: "#111" }
}
onMouseEnter={(e) => {
  if (plan.tier === "goplus") {
    e.currentTarget.style.background =
      "linear-gradient(135deg, #FFD700 0%, #E4A010 50%, #C8850C 100%)";
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(180,120,0,0.5)";
  } else if (plan.tier === "pro") {
    e.currentTarget.style.background =
      "linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)";
  } else {
    e.currentTarget.style.backgroundColor = "#333";
  }
}}
onMouseLeave={(e) => {
  if (plan.tier === "goplus") {
    e.currentTarget.style.background =
      "linear-gradient(135deg, #F5C518 0%, #D4920A 50%, #B8780A 100%)";
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(180,120,0,0.4)";
  } else if (plan.tier === "pro") {
    e.currentTarget.style.background =
      "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)";
  } else {
    e.currentTarget.style.backgroundColor = "#111";
  }
}}
        >
          {plan.cta}
        </button>

        {/* Divider */}
        <div className="border-t border-zinc-100 mb-6" />

        {/* Features */}
        <ul className="flex flex-col gap-4">
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-center gap-3">
              <span style={{ color: plan.accentColor }}>{feat.icon}</span>
              <span className="text-[13px] font-semibold text-zinc-700 leading-tight">{feat.label}</span>
              {feat.badge && <Badge text={feat.badge} style={feat.badgeStyle ?? null} />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function SubscriptionPage() {
  const router = useRouter();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-white">
      {/* ── Hero header ───────────────────────────────────────── */}
      <div className="pt-16 pb-12 text-center px-6">
        <p className="text-zinc-400 text-sm tracking-widest uppercase mb-4">
          Select the plan that suits you best
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 leading-tight tracking-tight max-w-xl mx-auto">
          Unlock artist tools and<br />
          <span className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(90deg, #7c3aed, #d97706)" }}>
            reach more listeners
          </span>
        </h1>
      </div>

      {/* ── Cards grid ────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              hovered={hoveredPlan === plan.key}
              onHover={setHoveredPlan}
            />
          ))}
        </div>
      </div>

      {/* ── Continue without plan ─────────────────────────────── */}
      <div className="flex justify-center pb-16 px-6">
        <button
          onClick={() => router.push("/discover")}
          className="
            flex items-center gap-3 px-8 py-4 rounded-full
            border-2 border-zinc-200 text-zinc-500 text-sm font-bold uppercase tracking-widest
            hover:border-zinc-400 hover:text-zinc-800 hover:bg-zinc-50
            transition-all duration-200
          "
        >
          Or continue without a paid plan
          <LuArrowRight size={16} />
        </button>
      </div>
    </main>
  );
}