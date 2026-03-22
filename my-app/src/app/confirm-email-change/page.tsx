"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmEmailChange } from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// Confirm Email Change Page
//
// The user arrives here from a link in their inbox like:
//   /confirm-email-change?token=abc123
//
// We send the token to POST /auth/email/confirm-change.
// On success the backend swaps the email and logs them out of
// all sessions, so we redirect to "/" with a success message.
// ─────────────────────────────────────────────────────────────

/** Only allow token characters: alphanumeric, dash, underscore, dot, tilde (URL-safe chars) */
const isSafeToken = (t: string) => /^[\w.\-~]+$/.test(t) && t.length <= 512;

export default function ConfirmEmailChangePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <ConfirmEmailChangeInner />
    </Suspense>
  );
}

function ConfirmEmailChangeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Validate token format before sending — prevents sending garbage to the API
    if (!token || !isSafeToken(token)) {
      setState("error");
      setMessage(
        "This confirmation link is invalid or has expired. Please request a new email change from Settings.",
      );
      return;
    }

    let cancelled = false;

    confirmEmailChange(token)
      .then(() => {
        if (cancelled) return;
        setState("success");
        setMessage(
          "Your email address has been updated. You have been signed out for security — please sign in with your new email.",
        );
        // Redirect to home after 4 s so the user sees the message
        setTimeout(() => {
          if (!cancelled) router.replace("/");
        }, 4000);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setState("error");
        setMessage(
          axiosErr.response?.data?.message ??
            "This confirmation link is invalid or has expired. Please request a new email change from Settings.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#1b1b1b] w-full max-w-md p-10 rounded-sm shadow-xl text-center">
        {state === "pending" && (
          <>
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-sm">Confirming your new email…</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Email updated!</h1>
            <p className="text-sm text-zinc-400">{message}</p>
            <p className="text-xs text-zinc-500 mt-3">Redirecting you to sign in…</p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Link invalid</h1>
            <p className="text-sm text-zinc-400">{message}</p>
            <button
              onClick={() => router.replace("/settings")}
              className="mt-5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-sm transition-colors"
            >
              Go to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
