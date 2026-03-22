"use client";

import ReCAPTCHA from "react-google-recaptcha";

interface CaptchaFieldProps {
  captchaRef: React.RefObject<ReCAPTCHA | null>;
  error?: string | null;
}

export default function CaptchaField({ captchaRef, error }: CaptchaFieldProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";

  return (
    <div className="flex flex-col gap-2">
      <ReCAPTCHA
        ref={captchaRef}
        sitekey={siteKey}
        theme="dark"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}