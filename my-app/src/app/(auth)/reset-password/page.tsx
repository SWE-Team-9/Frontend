"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthInput from "@/src/components/auth/AuthInput";
import { resetPassword } from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// Reset Password Page
//
// The user arrives here from an email link like:
//   /reset-password?token=abc123
//
// They pick a new password and we send it to the backend along
// with the token. The backend verifies the token and updates
// the password.
//
// BEGINNER TIP:
//   Next.js 15 requires `useSearchParams()` to be inside a
//   <Suspense> boundary. That's why we split the page into two
//   components: the outer page wraps in Suspense, and the inner
//   component does the actual work.
// ─────────────────────────────────────────────────────────────

// This is the "outer" page that Next.js renders first
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

// This is the actual form that reads query params
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || ""; // grab token from the URL

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- Basic checks before calling the backend ---
    if (!token) {
      setError("Invalid or missing reset link. Please request a new one.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // --- Call the backend ---
    try {
      setIsSubmitting(true);
      await resetPassword(token, password, confirmPassword);
      setIsSuccess(true);

      // Redirect to home (login) after 3 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(
        axiosErr.response?.data?.message || "Failed to reset password. The link may have expired."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#1b1b1b] w-full max-w-112.5 p-10 rounded-sm shadow-xl text-center">
        <h1 className="text-3xl text-white font-bold mb-6">Choose a new password</h1>
        
        {isSuccess ? (
          <div className="space-y-4">
            <p className="text-green-500 font-medium">Your password has been reset!</p>
            <p className="text-gray-400 text-sm">Redirecting you to the sign-in page...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-6">
            <p className="text-sm text-gray-400">
              Make sure your new password is secure and something you haven&apos;t used before.
            </p>
            
            <AuthInput 
              type="password" 
              label="New Password" 
              placeholder="Enter new password" 
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />

            <AuthInput 
              type="password" 
              label="Confirm New Password" 
              placeholder="Repeat new password" 
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            />

            {error && <p className="text-red-500 text-xs text-left">{error}</p>}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-white/80 text-black py-3 font-bold rounded-sm hover:bg-white transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save and continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}