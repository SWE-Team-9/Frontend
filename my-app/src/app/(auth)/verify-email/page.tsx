"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useEmailVerification } from "@/src/hooks/useEmailVerification";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { isVerified, setToken } = useAuthStore();
  const { verifyEmail } = useEmailVerification();


  useEffect(() => { // When the component mounts, extract the token from the URL and verify it
    if (token) setToken(token);
    verifyEmail(token ?? undefined); 
  }, [token]);

  if (isVerified === null) return <p>Verifying your email...</p>;
  if (isVerified) return (
    <div>
      <h1>Email Verified</h1>
      <p>Your account is now active.</p>
      <a href="/">Go to Home</a>  
    </div>
  );
  return (
    <div>
      <h1>Verification Failed</h1>
      <p>Invalid or expired link.</p>
      <a href="/resend-verification">Resend verification email</a>
    </div>
  );
}