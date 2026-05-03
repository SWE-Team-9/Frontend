"use client";

import { Download, Smartphone } from "lucide-react";

const MOBILE_VERSION_URL =
  "https://raw.githubusercontent.com/SWE-Team-9/Cross/releases/version.json";

const FALLBACK_APK_URL =
  "https://github.com/SWE-Team-9/Cross/releases/download/v1.1.1/app-release.apk";

export default function GoMobileBox() {
  const handleDownload = async () => {
    try {
      const res = await fetch(MOBILE_VERSION_URL, { cache: "no-store" });

      if (!res.ok) {
        window.open(FALLBACK_APK_URL, "_blank", "noopener,noreferrer");
        return;
      }

      const data = await res.json();
      const downloadUrl = data?.download_url || FALLBACK_APK_URL;

      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.open(FALLBACK_APK_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Smartphone size={18} className="text-zinc-300" />
        <h2 className="text-sm font-bold uppercase text-white">Go Mobile</h2>
      </div>

      <p className="mb-4 text-sm leading-5 text-zinc-400">
        Take Spotly with you. Download the latest Android app release.
      </p>

      <button
        type="button"
        onClick={handleDownload}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:scale-[1.02] hover:bg-zinc-200"
      >
        <Download size={16} />
        Download Mobile App
      </button>
    </div>
  );
}