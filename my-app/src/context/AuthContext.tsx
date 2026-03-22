"use client";

import React, { createContext, useContext, useState } from "react";
import AuthModal from "@/src/components/auth/AuthModal";
import { logoutUser } from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// AuthContext
//
// This context does two simple things:
//   1. Provides an `openAuth("login")` / `openAuth("signup")` function
//      so any component can pop open the login/signup modal.
//   2. Exposes the current user and a logout helper.
// ─────────────────────────────────────────────────────────────

interface AuthContextType {
  openAuth: (view: "login" | "signup") => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authView, setAuthView] = useState<"login" | "signup" | null>(null);

  const openAuth = (view: "login" | "signup") => setAuthView(view);
  const closeAuth = () => setAuthView(null);

  const logout = async () => {
    await logoutUser();
    closeAuth();
  };

  return (
    <AuthContext.Provider value={{ openAuth, logout }}>
      {children}
      <AuthModal
        isOpen={authView !== null}
        initialView={authView || "login"}
        onClose={closeAuth}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};