"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/src/store/useAuthStore";
import { getCurrentUser } from "@/src/services/authService";

export const useAuthInit = () => {
  const { setTokens, setEmail } = useAuthStore();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);

      // Optional: fetch current user to populate email
      getCurrentUser()
        .then((res) => {
          setEmail(res.data.email);
        })
        .catch(() => {
          console.log("Failed to fetch current user, tokens may be invalid");
        });
    }
  }, [setTokens, setEmail]);
};