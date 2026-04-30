"use client";

import { ReactNode, useEffect } from "react";
import { useAuthInit } from "@/src/hooks/useAuthInit";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useMessageStore } from "@/src/store/messageStore";

export default function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const connectSocket = useMessageStore((state) => state.connectSocket);
  const disconnectSocket = useMessageStore((state) => state.disconnectSocket);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    connectSocket();

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, connectSocket, disconnectSocket]);

  return <>{children}</>;
}