"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBar from "@/src/components/ui/SideBar";
import NavBar from "@/src/components/ui/NavBar";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function SideNavLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="font-sans text-white min-h-screen max-w-7xl mx-auto px-6">
      <NavBar className="sticky top-0 z-50" />
      <SideBar>{children}</SideBar>
    </div>
  );
}