"use client";

import { useAuthStore } from "@/src/store/useAuthStore";
import { useRouter } from "next/navigation";

export default function AccountRestrictedPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const isBanned = user?.account_status === "BANNED";
  const isSuspended = user?.account_status === "SUSPENDED";

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-xl text-center max-w-md">

        <h1 className="text-2xl font-bold mb-4">
          {isBanned ? "Account Banned" : "Account Suspended"}
        </h1>

        <p className="text-gray-400 mb-6">
          {isBanned
            ? "Your account has been permanently banned due to policy violations."
            : "Your account is temporarily suspended. Please contact support."}
        </p>

        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="bg-red-600 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}