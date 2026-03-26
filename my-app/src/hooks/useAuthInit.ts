"use client";
import { useEffect } from "react";
import { getCurrentUser } from "@/src/services/authService";
import { useAuthStore } from "@/src/store/useAuthStore";

export const useAuthInit = () => {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // If user is already in store, skip
    if (user) return;

    let cancelled = false;

    const init = async () => {
      try {
        await getCurrentUser();
      } catch {
        if (!cancelled) {
          // guest user is fine; do nothing
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [user]);
};