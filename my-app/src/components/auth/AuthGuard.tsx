"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    if (user.account_status !== "ACTIVE") {
      router.replace("/account-restricted");
    }
  }, [user]);

  return <>{children}</>;
}