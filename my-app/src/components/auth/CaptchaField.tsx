"use client";

interface CaptchaFieldProps {
  value: string | null;
  onChange: (token: string | null) => void;
}

export default function CaptchaField({ value, onChange }: CaptchaFieldProps) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-gray-700 bg-[#1a1a1a] p-4">
      <p className="text-sm text-gray-300">CAPTCHA placeholder</p>
      <p className="text-xs text-gray-500">
        Replace this with reCAPTCHA / hCaptcha / Turnstile later.
      </p>

      <button
        type="button"
        onClick={() => onChange(value ? null : "mock-captcha-token")}
        className="w-fit rounded-sm bg-white px-3 py-2 text-sm font-bold text-black hover:bg-gray-200"
      >
        {value ? "Clear CAPTCHA" : "I'm not a robot"}
      </button>

      {value && <p className="text-xs text-green-500">CAPTCHA completed.</p>}
    </div>
  );
}