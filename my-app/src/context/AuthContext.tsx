"use client";

import React, { createContext, useContext, useState } from "react";
import AuthModal from "@/src/components/auth/AuthModal";

interface User {
  name: string;
  email?: string;
}

interface AuthContextType {
  openAuth: (view: "login" | "signup") => void;
  user: User | null; // Allow it to be a User object or null
  login: (email: string) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authView, setAuthView] = useState<"login" | "signup" | null>(null);
  
  const [user, setUser] = useState<User | null>(null);

  const openAuth = (view: "login" | "signup") => setAuthView(view);
  const closeAuth = () => setAuthView(null);

  const login = (email: string) => {
    setUser({ name: "User", email: email }); 
    closeAuth();
    // Redirect logic to verify the flow
    window.location.href = "/discover"; 
  };

  return (
    <AuthContext.Provider value={{ openAuth, user, login }}>
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