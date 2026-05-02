import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/src/components/providers/AuthProvider";
import { Player } from "@/src/components/player/Player";
import PlayerAudioSync from "@/src/components/player/PlayerAudioSync";
import { Toaster } from "sonner";
import { NotificationSocketBridge } from "@/src/components/notifications/NotificationSocketBridge";
import { WsDebugIndicator } from "@/src/components/debug/WsDebugIndicator";
import { AiChatWidget } from "@/src/components/ai/AiChatWidget";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IQA3",
  description: "Stream and listen to music online for free on IQA3",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <NotificationSocketBridge />
          <div>
            {children}
          </div>

          <Player />
          <PlayerAudioSync />
          <WsDebugIndicator />
          <AiChatWidget />

          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                color: "#fff",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}