"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/src/services/authService";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  const hasToken = Boolean(token);

  const [status, setStatus] = useState<Status>(hasToken ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState<string>(
    hasToken
      ? ""
      : "No verification token found. Please use the link from your email.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    verifyEmail(token)
      .then(() => {
        if (!cancelled) {
          setStatus("success");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;

        const axiosErr = err as { response?: { data?: { message?: string } } };

        setErrorMessage(
          axiosErr.response?.data?.message ||
            "This verification link is invalid or has already been used.",
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#121212] w-full max-w-md rounded-sm shadow-2xl p-10 text-center flex flex-col items-center gap-6">
        {status === "verifying" && (
          <>
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-white text-lg font-semibold">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Email verified!</h1>
            <p className="text-gray-400 text-sm">
              Your account is now active. You can sign in with your email and password.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-white text-black font-bold py-3 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Verification failed</h1>
            <p className="text-gray-400 text-sm">{errorMessage}</p>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-white text-black font-bold py-3 rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Back to home
            </button>
          </>
        )}
      </div>
    </div>
  );
}