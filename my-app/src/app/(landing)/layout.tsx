"use client";

import React from "react";
import { AuthProvider } from "@/src/context/AuthContext";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <main>
        {children}
      </main>
    </AuthProvider>
  );
}