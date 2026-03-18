"use client";

import React from "react";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useRouter } from "next/navigation";
import { FaRegPaperPlane } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";

export default function VerifyEmailNoticePage() {
  const email = useAuthStore((state) => state.email);
  const router = useRouter();
  const [showResentMsg, setShowResentMsg] = useState(false);

  const handleResend = () => {
    // Simulate resend
    setShowResentMsg(true);
    setTimeout(() => setShowResentMsg(false), 3000)
  };

  const handleBackToLogin = () => {
    router.push("/");
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      {/* Modal */}
      <div className="bg-black text-white w-100 rounded-lg p-6 text-center shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Check your inbox!</h1>
        {/* Message */}
        <p className="text-sm text-gray-300 mb-2">
          Click on the link we sent to
        </p>
        <p className="font-semibold mb-4">
          {email || "your-email@example.com"}
        </p>

        {/* Resend */}
        <p className="text-sm text-gray-400 mb-6">
          No email in your inbox or spam folder?{" "}
          <button
            onClick={handleResend}
            className="text-blue-400 hover:underline"
          >
            Send again
          </button>
        </p>

         {/* Resent confirmation popup */}
        {showResentMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-semibold">
            Verification code resent!
          </div>
        )}

        {/* Icon (simple version) */}
        <div className="flex justify-center mb-6">
          <FaRegPaperPlane size={120} />
        </div>

        {/* Open Gmail */}
        <a
          href="https://mail.google.com"
          target="_blank"
          className="flex items-center justify-center gap-2 bg-white text-black py-2 rounded-md font-medium mb-4"
        >
          <FcGoogle size={20} />
          Open Gmail
        </a>

        {/* Back */}
        <p className="text-sm text-gray-400">
          Wrong address?{" "}
          <button
            onClick={handleBackToLogin}
            className="text-blue-400 hover:underline"
          >
            Back to login
          </button>
        </p>
      </div>
    </div>
  );
}
