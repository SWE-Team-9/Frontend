import { useAuthStore } from "@/src/store/useAuthStore";

export const useEmailVerification = () => { // email verification logic hook
  const { verificationToken, setVerified, resetVerification } = useAuthStore();

  // token verification
  const verifyEmail = async (token?: string) => { // token can come from URL or store
    if (!token && !verificationToken) return false;

    try {
      const t = token || verificationToken;
      const RESPONSE = await fetch(`/api/auth/verify-email?token=${t}`); // Our backend endpoint
      if (!RESPONSE.ok) throw new Error();
      setVerified(true);
      return true;
    } catch {
      setVerified(false);
      return false;
    }
  };

  // resend verification email
  const resendVerification = async (email: string) => {
    try {
      const RESPONSE = await fetch("/api/auth/resend-verification", { // Our backend endpoint
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return RESPONSE.ok;
    } catch {
      return false;
    }
  };

  return { verifyEmail, resendVerification, resetVerification };
};