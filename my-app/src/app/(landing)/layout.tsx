"use client";

import React from "react";
import { AuthProvider } from "@/src/context/AuthContext"; // Ensure this path matches where you saved the file

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <main>
        {children}
      </main>
    </AuthProvider>
  );
}