import {
  verifyEmail as verifyEmailApi,
  resendVerification as resendVerificationApi,
} from "@/src/services/authService";

// ─────────────────────────────────────────────────────────────
// useEmailVerification
//
// Thin wrapper around the two email-verification endpoints.
// Uses the shared authService (which uses our axios instance
// with cookies) instead of raw fetch.
// ─────────────────────────────────────────────────────────────

export const useEmailVerification = () => {
  /** Call POST /auth/verify-email with the token from the email link */
  const verifyEmail = async (token: string) => {
    try {
      await verifyEmailApi(token);
      return true;
    } catch {
      return false;
    }
  };

  /** Call POST /auth/resend-verification with the user's email */
  const resendVerification = async (email: string) => {
    try {
      await resendVerificationApi(email);
      return true;
    } catch {
      return false;
    }
  };

  return { verifyEmail, resendVerification };
};