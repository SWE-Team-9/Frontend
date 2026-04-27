"use client";

import React from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = "purple" | "gold" | "none";

export interface PlanFeature {
  icon?: string;        // "upload" | "boost" | "distribute" | "check"
  label: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
}

export interface PlanCardProps {
  // Identity
  planKey?: "pro" | "goplus";
  name: string;
  subtitle: string;

  // Pricing — monthly only
  monthlyPrice: string;  // e.g. "9.99"

  // Style variant controls the color theme
  variant: "artist" | "pro";

  // Features
  features: PlanFeature[];

  // Optional decorators
  mostPopular?: boolean;
  showSeeAllBenefits?: boolean;
  isLoading?: boolean;

  // Action
  onGetStarted?: () => void;
}

// ─── Color themes ─────────────────────────────────────────────────────────────

const THEME: Record<"artist" | "pro", string> = {
  artist: "#7c3aed",  // violet — PRO
  pro: "#d97706",     // amber  — GO+
};

// ─── Badge ────────────────────────────────────────────────────────────────────

function FeatureBadge({ text, variant }: { text: string; variant: BadgeVariant }) {
  if (!text || variant === "none") return null;
  const styles: Record<Exclude<BadgeVariant, "none">, string> = {
    purple: "bg-violet-50 text-violet-600 border border-violet-300",
    gold:   "bg-amber-50  text-amber-600  border border-amber-300",
  };
  return (
    <span className={`ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${styles[variant as Exclude<BadgeVariant, "none">]}`}>
      {text}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const PlanCard: React.FC<PlanCardProps> = ({
  planKey = "pro",
  name,
  subtitle,
  monthlyPrice,
  variant,
  features,
  mostPopular = false,
  showSeeAllBenefits = false,
  isLoading = false,
  onGetStarted,
}) => {
  const router = useRouter();
  const colorTheme = THEME[variant];

  const handleClick = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push(`/subscriptions/checkout?plan=${planKey}`);
    }
  };

  return (
    <div
      className={`relative p-10 rounded-2xl bg-white transition-all duration-500 flex flex-col h-full ${
        mostPopular
          ? "border-2 shadow-2xl scale-105 z-10"
          : "border border-zinc-200 shadow-sm"
      }`}
      style={{ borderColor: mostPopular ? colorTheme : undefined }}
    >
      {/* ── Most Popular ribbon ──────────────────────────────── */}
      {mostPopular && (
        <div className="absolute top-0 left-0 right-0 -translate-y-full">
          <div
            className="text-white px-6 py-2 rounded-t-2xl text-[10px] font-black uppercase tracking-widest text-center"
            style={{ backgroundColor: colorTheme }}
          >
            Most Popular
          </div>
        </div>
      )}

      {/* ── 1. Header & Price ────────────────────────────────── */}
      <div className="min-h-[220px] mb-6 flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-3xl font-black text-black tracking-tight">{name}</h3>
          <span style={{ color: colorTheme }} className="text-4xl font-bold">
            {mostPopular ? "✪" : "✦"}
          </span>
        </div>

        <p className="text-zinc-500 text-[14px] font-medium mb-8 leading-relaxed min-h-[40px]">
          {subtitle}
        </p>

        {/* Price — monthly only */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black" style={{ color: colorTheme }}>
              ${monthlyPrice}
            </span>
            <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-tighter">
              / Month
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. CTA Button ────────────────────────────────────── */}
      <div className="mb-10">
        <button
          onClick={handleClick}
          disabled={isLoading}
          className="w-full py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={
  variant === "pro"  // GO+ card
    ? {
        background: "linear-gradient(135deg, #F5C518 0%, #D4920A 50%, #B8780A 100%)",
        border: "1px solid #C9940C",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(180,120,0,0.4)",
      }
    : { backgroundColor: "#111" }
}
onMouseEnter={(e) => {
  if (isLoading) return;
  if (variant === "pro") {
    e.currentTarget.style.background =
      "linear-gradient(135deg, #FFD700 0%, #E4A010 50%, #C8850C 100%)";
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(180,120,0,0.5)";
  } else {
    e.currentTarget.style.backgroundColor = colorTheme;
  }
}}
onMouseLeave={(e) => {
  if (variant === "pro") {
    e.currentTarget.style.background =
      "linear-gradient(135deg, #F5C518 0%, #D4920A 50%, #B8780A 100%)";
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 8px rgba(180,120,0,0.4)";
  } else {
    e.currentTarget.style.backgroundColor = "#111";
  }
}}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading...
            </span>
          ) : (
            "Get started"
          )}
        </button>
      </div>

      {/* ── 3. Features List ─────────────────────────────────── */}
      <ul className="space-y-6 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center justify-between group min-h-[24px]">
            <div className="flex items-center gap-4">
              <span
                className="group-hover:scale-110 transition-transform"
                style={{ color: colorTheme }}
              >
                <Check size={18} strokeWidth={2.5} />
              </span>
              <span className="text-[13px] font-bold text-zinc-800">
                {feature.label}
              </span>
            </div>
            {feature.badge && (
              <FeatureBadge
                text={feature.badge}
                variant={feature.badgeVariant ?? "none"}
              />
            )}
          </li>
        ))}
      </ul>

      {/* ── See all benefits ─────────────────────────────────── */}
      {showSeeAllBenefits && (
        <div className="pt-6 mt-auto text-center border-t border-zinc-100">
          <button
            className="text-blue-500 hover:text-blue-700 text-sm font-semibold transition-colors"
          >
            See all benefits
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanCard;