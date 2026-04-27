import { PlanFeature } from "@/src/components/subscription/PlanCard";

// ─── Plan shape ───────────────────────────────────────────────────────────────
export interface PlanConfig {
  label: string;
  monthlyPrice: number;
  uploadLimit: number;
  features: PlanFeature[];   
}

export const PLAN_CONFIG: Record<"FREE" | "PRO" | "GO+", PlanConfig> = {
  FREE: {
    label: "Free",
    monthlyPrice: 0,
    uploadLimit: 3,
    features: [
      { label: "3 track uploads",        icon: "upload" },
      { label: "Ad-supported listening", icon: "boost" },
      { label: "Online streaming only",  icon: "distribute" },
      { label: "Community support",      icon: "check" },
    ],
  },

  PRO: {
    label: "Artist Pro",
    monthlyPrice: 9.99,
    uploadLimit: 100,
    features: [
      { label: "100 track uploads",                   icon: "upload" },
      { label: "Ad-free listening",                   icon: "boost",      badge: "PRO", badgeVariant: "purple" },
      { label: "Offline listening (download tracks)", icon: "distribute", badge: "PRO", badgeVariant: "purple" },
      { label: "Priority support",                    icon: "check" },
    ],
  },

  "GO+": {
    label: "GO+",
    monthlyPrice: 19.99,
    uploadLimit: 1000,
    features: [
      { label: "1,000 track uploads",                 icon: "upload" },
      { label: "Ad-free listening",                   icon: "boost",      badge: "GO+", badgeVariant: "gold" },
      { label: "Offline listening (download tracks)", icon: "distribute", badge: "GO+", badgeVariant: "gold" },
      { label: "Priority support",                    icon: "check" },
    ],
  },
};

export type PlanKey = "FREE" | "PRO" | "GO+";