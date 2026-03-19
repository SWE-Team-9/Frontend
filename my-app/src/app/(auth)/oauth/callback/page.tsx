"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/v1/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch user.");
        }

        const user = await res.json();

        console.log("Logged in user:", user);

        // redirect after login
        router.replace("/");
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