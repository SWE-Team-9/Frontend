"use client";

import React, { useState, useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import AuthInput from "@/src/components/auth/AuthInput";
import { useAuth } from "@/src/context/AuthContext";
import { useAuthStore } from "@/src/store/useAuthStore";
import {
  loginUser,
  forgotPassword,
  resendVerification,
} from "@/src/services/authService";
import { FaFacebook, FaApple } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { IoIosArrowBack } from "react-icons/io";
import { useRouter } from "next/navigation";
import { startSocialLogin, registerWithCaptcha, type SocialProvider } from "@/src/lib/auth/authService";
import CaptchaField from "@/src/components/auth/CaptchaField";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: "login" | "signup";
}

export default function AuthModal({ isOpen, onClose, initialView }: AuthModalProps) {
  useAuth(); // keep — ensures we're inside AuthContext
  const captchaRef = useRef<ReCAPTCHA | null>(null);

  const [view, setView] = useState<"login" | "signup" | "forgot">(initialView);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isResetSent, setIsResetSent] = useState(false);
  const { setEmail: setEmailStore } = useAuthStore();
  const router = useRouter();

  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Resend verification after failed login
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const [loginPassword, setLoginPassword] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setStep(1);
      setError(null);
      setIsResetSent(false);
      setSocialError(null);
      setSocialLoading(null);
      setCaptchaError(null);
      setShowResendVerification(false);
      setResendLoading(false);
      setResendSent(false);
      setLoginPassword("");
      setSignupPassword("");
      setSignupPasswordConfirm("");
      setIsSubmitting(false);
      captchaRef.current?.reset();
    }
  }, [isOpen, initialView]);

  // Social Login Handler
  const handleUnavailableProvider = (providerName: string) => {
  setError(null);
  setSocialError(`${providerName} login is not available yet.`);
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setError(null);
      setSocialError(null);
      setSocialLoading(provider);
      startSocialLogin(provider);
    } catch (err) {
      setSocialLoading(null);
      setSocialError(err instanceof Error ? err.message : "Unable to start Google login. Please try again.");
    }
  };

  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      await resendVerification(email);
      setResendSent(true);
    } catch {
      // always show success to prevent email enumeration
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (view === "login") {
      if (step === 1) {
        setError(null);
        setStep(2);
      } else {
    
//         const PASSWORD = (
//           document.getElementById("login-password") as HTMLInputElement
//         )?.value;
        
        if (!loginPassword.trim()) {
         setError("Password is required.");
         return;
        }
        
         // Login with JWT via authService
        try {
          await loginUser({ email, password: loginPassword });
          setEmailStore(email);
          onClose();
          router.push("/discover");
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
          if (axiosErr.response?.data?.error === "EMAIL_NOT_VERIFIED") {
            setShowResendVerification(true);
          } else {
            setError(axiosErr.response?.data?.message || "Login failed");
          }
        }
        
        
      }
    } else if (view === "signup") {
      if (step === 1) {
        setError(null);
        setStep(2);
      } 
      else if (step === 2) {
        if (!signupPassword.trim()) {
          setError("Please create a password.");
          return;
        }

        if (signupPassword.length < 8) {
          setError("Password must be at least 8 characters long.");
          return;
        }

        if (!signupPasswordConfirm.trim()) {
          setError("Please confirm your password.");
          return;
        }

        if (signupPassword !== signupPasswordConfirm) {
          setError("Passwords do not match.");
          return;
        }

        setError(null);
        setCaptchaError(null);
        setStep(3);
      } else {
        const name = (
          document.getElementById("display-name") as HTMLInputElement
        )?.value;
        const month = parseInt(
          (document.getElementById("birth-month") as HTMLSelectElement).value,
        );
        const day = parseInt(
          (document.getElementById("birth-day") as HTMLSelectElement).value,
        );
        const year = parseInt(
          (document.getElementById("birth-year") as HTMLSelectElement).value,
        );
        const gender = (document.getElementById("gender") as HTMLSelectElement)
          .value;

        if (!name) {
          setError("Display name is required.");
          return;
        }

        if (!month || !day || !year) {
          setError("Please complete your date of birth.");
          return;
        }

        if (!gender) {
          setError("Please select your gender.");
          return;
        }

        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();

        if (selectedDate > today) {
          setError("Birth date cannot be in the future.");
          return;
        }

        if (selectedDate.getMonth() !== month - 1) {
          setError("Please enter a valid calendar date.");
          return;
        }

        if (!signupPassword.trim()) {
          setError("Please create a password.");
          return;
        }

        try {
          setIsSubmitting(true);
          setCaptchaError(null);

          const recaptchaToken = captchaRef.current?.getValue();

          if (!recaptchaToken) {
            setCaptchaError("Please complete the CAPTCHA verification.");
            setIsSubmitting(false);
            return;
          }

          // Map the <select> values to what the backend expects
          const genderMap: Record<string, "MALE" | "FEMALE" | "PREFER_NOT_TO_SAY"> = {
            male: "MALE",
            female: "FEMALE",
            other: "PREFER_NOT_TO_SAY",
          };

          await registerWithCaptcha({
            email,
            password: signupPassword,
            password_confirm: signupPasswordConfirm,
            display_name: name,
            date_of_birth: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
            gender: genderMap[gender] || "PREFER_NOT_TO_SAY",
            captcha_token: recaptchaToken,
          });

          setEmailStore(email); // store email for verification
          router.push("/verify-email-notice"); // redirect after signup
          onClose();

        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          setError(axiosErr.response?.data?.message || "Signup failed");
          captchaRef.current?.reset(); // let the user tick again on failure
        } finally {
          setIsSubmitting(false);
        }
      }
    }
    else if (view === "forgot") {
      if (isResetSent) {
        onClose();
      } else {

        try {
          await forgotPassword(email);
          setIsResetSent(true);
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: { message?: string } } };
          setError(axiosErr.response?.data?.message || "Failed to send reset link");
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 p-4">
      <button
        onClick={onClose}
        className="absolute top-8 right-10 text-white text-2xl hover:text-gray-400 transition-colors cursor-pointer"
      >
        ✕
      </button>

      <div className="bg-[#121212] w-full max-w-112.5 min-h-137.5 p-8 md:p-10 rounded-sm shadow-2xl relative flex flex-col">
        {((view === "signup" && step > 1) ||
          (view === "login" && step === 2) ||
          view === "forgot") && (
          <button
            onClick={() => {
              setError(null);
              setCaptchaError(null);
              if (view === "forgot") {
                setView("login");
                setStep(2);
              } else {
                setStep(step - 1);
              }
            }}
            className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-white mb-4 hover:bg-[#333] cursor-pointer"
          >
          <IoIosArrowBack size={24}/>
          </button>
        )}

        <h1 className="text-3xl text-white font-bold mb-6">
          {view === "forgot"
            ? "Reset your password"
            : view === "login"
              ? "Sign in"
              : step === 3
                ? "Tell us more about you"
                : "Create an account"}
        </h1>

        {step === 1 && view !== "forgot" && (
          <div className="w-full flex flex-col gap-2.5 mb-6">
            <button 
            onClick={() => handleUnavailableProvider("Facebook")}
            type="button"
            disabled={!!socialLoading || isSubmitting}
            className="w-full h-10 bg-[#1877f2] text-white text-sm font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaFacebook size={18} /> 
              Continue with Facebook
            </button>
            
            <button 
              onClick={() => handleSocialLogin("google")}
              type="button"
              disabled={!!socialLoading || isSubmitting}
              className="w-full h-10 bg-white text-black text-sm font-bold rounded-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FcGoogle size={18} />
              {socialLoading === "google" ? "Redirecting..." : "Continue with Google"}
            </button>   
            
            <button 
              onClick={() => handleUnavailableProvider("Apple")}
              type="button"
              disabled={!!socialLoading || isSubmitting}
              className="w-full h-10 bg-black text-white text-sm font-bold rounded-sm border border-gray-700 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#111] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <FaApple size={18} />
              Continue with Apple
            </button>  

            {socialError && <p className="text-red-500 text-xs mt-1">{socialError}</p>}
            <div 
              className="flex items-center w-full mt-4"><span className="text-white text-sm font-bold">or with email</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {view === "forgot" ? (
            <div className="space-y-4">
              {isResetSent ? (
                <p className="text-green-500 text-sm font-medium">
                  A reset link has been sent to your email.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-400">
                    If the email address is in our database, we will send you an
                    email to reset your password. Need help? visit our{" "}
                    <a href="/help" className="text-[#38d]">
                      Help Center
                    </a>
                  </p>

                  <AuthInput
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setEmail(e.target.value);
                      setError(null);
                      setSocialError(null);
                    }}
                  />                    
                </>
              )}
            </div>
          ) : (
            <>
              {step === 1 && (
                <AuthInput
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                    setError(null);
                    setSocialError(null);
                  }}
                />
              )}              
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">{email}</p>
                  <AuthInput
                    type="password"
                    placeholder={view === "login" ? "Your password" : "Create a password"}
                    id={view === "login" ? "login-password" : "reg-password"}
                    value={view === "login" ? loginPassword : signupPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setError(null);
                      if (view === "login") {
                        setLoginPassword(e.target.value);
                      } else {
                        setSignupPassword(e.target.value);
                      }
                    }}
                  />
                  {/* Confirm password — only shown during signup */}
                  {view === "signup" && (
                    <AuthInput
                      type="password"
                      placeholder="Confirm your password"
                      id="reg-password-confirm"
                      value={signupPasswordConfirm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setError(null);
                        setSignupPasswordConfirm(e.target.value);
                      }}
                    />
                  )}
                  {view === "login" && (
                    <button
                      type="button"
                      onClick={() => setView("forgot")}
                      className="text-xs text-[#38d] hover:underline cursor-pointer"
                    >
                      Forgot your password?
                    </button>
                  )}
                </div>
              )}
              {step === 3 && (
                <div className="flex flex-col gap-5">
                  <AuthInput
                    label="Display name"
                    type="text"
                    placeholder="Your display name"
                    id="display-name"
                  />
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase text-gray-400">
                      Date of birth (required)
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="birth-month"
                        className="flex-1 bg-[#333] text-white p-2.5 rounded-sm text-sm border-none outline-none cursor-pointer"
                      >
                        <option value="">Month</option>
                        {months.map((m, i) => (
                          <option key={m} value={i + 1}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        id="birth-day"
                        className="w-20 bg-[#333] text-white p-2.5 rounded-sm text-sm border-none outline-none cursor-pointer"
                      >
                        <option value="">Day</option>
                        {days.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <select
                        id="birth-year"
                        className="w-24 bg-[#333] text-white p-2.5 rounded-sm text-sm border-none outline-none cursor-pointer"
                      >
                        <option value="">Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold uppercase text-gray-400">
                      Gender (required)
                    </label>
                    <select
                      id="gender"
                      className="w-full bg-[#333] text-white p-3 rounded-sm text-sm border-none outline-none cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Prefer not to say</option>
                    </select>
                  </div>

                  <CaptchaField captchaRef={captchaRef} error={captchaError} />

                </div>
              )}
            </>
          )}

          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

          {/* Unverified email banner — shown after login attempt */}
          {showResendVerification && (
            <div className="rounded-sm border border-yellow-600/50 bg-yellow-900/20 p-4 flex flex-col gap-3">
              {resendSent ? (
                <p className="text-sm text-green-400">
                  Verification email sent! Check your inbox and click the link to activate your account.
                </p>
              ) : (
                <>
                  <p className="text-sm text-yellow-300">
                    Your email address hasn&apos;t been verified yet. Check your inbox for the verification link.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-sm font-bold text-white bg-yellow-700 hover:bg-yellow-600 rounded-sm py-2 px-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {resendLoading ? "Sending..." : "Resend verification email"}
                  </button>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-white/80 hover:bg-white text-black py-3 font-bold rounded-sm transition-all active:scale-[0.98] mt-4 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Please wait..."
              : view === "forgot"
                ? (isResetSent ? "Done" : "Send reset link")
                : step === 3
                  ? "Accept & Continue"
                  : "Continue"}
          </button>
        </form>

        {step === 1 && view !== "forgot" && (
          <div className="mt-auto pt-8 flex flex-col items-center">
            <button
              onClick={() => setView(view === "login" ? "signup" : "login")}
              className="text-sm text-white hover:underline cursor-pointer"
            >
              {view === "login"
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}