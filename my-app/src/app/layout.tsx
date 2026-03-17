import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoundCloud | Profile",
  description: "Your music profile on SoundCloud",
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#121212] text-white`}
        suppressHydrationWarning={true} // السطر ده هو اللي هيشيل الخطأ اللي ظهرلك
      >
        <main className="w-full min-h-screen">
          {children}
        </main>
      </body>
    </html> 
  );
}
