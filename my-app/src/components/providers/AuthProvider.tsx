"use client"; 
import { ReactNode } from "react";
import { useAuthInit } from "@/src/hooks/useAuthInit";

export default function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit(); 
  return <>{children}</>; 
}