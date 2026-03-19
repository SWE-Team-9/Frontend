"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/src/lib/auth/authService";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        console.log("Logged in user:", user);

        // redirect after login
        const returnTo = sessionStorage.getItem("oauth_return_to") || "/discover";
        router.replace(returnTo);        
      } catch (err) {
        setError("Login failed. Please try again.");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      {error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <p>Signing you in...</p>
      )}
    </div>
  );
}