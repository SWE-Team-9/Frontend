"use client";

interface CaptchaFieldProps {
  isReady: boolean;
  error?: string | null;
}

export default function CaptchaField({ isReady, error }: CaptchaFieldProps) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-gray-700 bg-[#1a1a1a] p-4">
      <p className="text-xs text-gray-400 leading-relaxed">
        This site is protected by reCAPTCHA and the Google Privacy Policy and
        Terms of Service apply.
      </p>

      {isReady ? (
        <p className="text-xs text-green-500">Verification ready.</p>
      ) : (
        <p className="text-xs text-gray-500">Verification will run on submit.</p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}