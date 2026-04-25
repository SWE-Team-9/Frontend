"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/store/useAuthStore";
import {
  changePassword,
  requestEmailChange,
  getSessions,
  revokeSession,
  logoutAllSessions,
  logoutUser,
} from "@/src/services/authService";
import AuthInput from "@/src/components/auth/AuthInput";
import BlockedUsersList from "@/src/components/block-user/BlockedUsersList";
import { useBlockStore } from "@/src/store/useblockStore";
import { deactivateMyAccount } from "@/src/services/profileService";
import { useProfileStore } from "@/src/store/useProfileStore";
import SubscriptionSettings from "@/src/components/profile/SubscriptionSettings";
import {  useSearchParams } from "next/navigation";

// ─── Validation helpers ──────────────────────────────────────────────────────
// Must match backend DTO rules exactly so we surface errors before the round-trip.

/** Min 8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit, ≥1 special char */
const isStrongPassword = (p: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(p);

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Validate a UUID before sending DELETE to prevent injection via crafted IDs */
const isUUID = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-6">
      <h2 className="text-base font-bold uppercase tracking-wide text-zinc-300 mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatusMessage({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  return (
    <p
      className={`text-sm mt-3 ${type === "error" ? "text-red-400" : "text-green-400"}`}
      role="alert"
    >
      {message}
    </p>
  );
}

// Change password Section
function ChangePasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Client-side validation
    if (!current.trim()) {
      setStatus({ type: "error", msg: "Current password is required." });
      return;
    }
    if (!isStrongPassword(next)) {
      setStatus({
        type: "error",
        msg: "New password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
      return;
    }
    if (next !== confirm) {
      setStatus({ type: "error", msg: "Passwords do not match." });
      return;
    }
    if (next === current) {
      setStatus({
        type: "error",
        msg: "New password must be different from current password.",
      });
      return;
    }

    try {
      setLoading(true);
      await changePassword(current, next, confirm);
      setStatus({
        type: "success",
        msg: "Password changed. All other sessions have been signed out for your security.",
      });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setStatus({
        type: "error",
        msg: axiosErr.response?.data?.message ?? "Failed to change password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Change Password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <AuthInput
          label="Current Password"
          type="password"
          id="current-password"
          name="current-password"
          placeholder="Enter your current password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <AuthInput
          label="New Password"
          type="password"
          id="new-password"
          name="new-password"
          placeholder="Min 8 chars, uppercase, number, special char"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <AuthInput
          label="Confirm New Password"
          type="password"
          id="confirm-password"
          name="confirm-password"
          placeholder="Repeat your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {status && <StatusMessage type={status.type} message={status.msg} />}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-10 bg-white hover:bg-[#ff5500] transition duration-300 cursor-pointer text-black font-bold text-lg rounded-sm"
        >
          {loading ? "Saving…" : "Update Password"}
        </button>
      </form>
    </SectionCard>
  );
}

// Change Email Section
function ChangeEmailSection({ currentEmail }: { currentEmail: string }) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      setStatus({ type: "error", msg: "Please enter a valid email address." });
      return;
    }
    if (trimmedEmail === currentEmail.toLowerCase()) {
      setStatus({
        type: "error",
        msg: "New email must be different from your current email.",
      });
      return;
    }
    if (!password.trim()) {
      setStatus({
        type: "error",
        msg: "Current password is required to change email.",
      });
      return;
    }

    try {
      setLoading(true);
      await requestEmailChange(trimmedEmail, password);
      setStatus({
        type: "success",
        msg: `A confirmation link has been sent to ${trimmedEmail}. Click it to complete the change.`,
      });
      setNewEmail("");
      setPassword("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setStatus({
        type: "error",
        msg:
          axiosErr.response?.data?.message ?? "Failed to request email change.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Change Email Address">
      <p className="text-sm text-zinc-400 mb-4">
        Current email:{" "}
        <span className="text-zinc-200 font-medium">{currentEmail}</span>
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <AuthInput
          label="New Email Address"
          type="email"
          id="new-email"
          name="new-email"
          placeholder="your@newemail.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <AuthInput
          label="Current Password (to confirm)"
          type="password"
          id="email-change-password"
          name="email-change-password"
          placeholder="Enter your current password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {status && <StatusMessage type={status.type} message={status.msg} />}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-10 bg-white hover:bg-[#ff5500] transition duration-300 cursor-pointer text-black font-bold text-lg rounded-sm"
        >
          {loading ? "Sending…" : "Send Confirmation Email"}
        </button>
      </form>
    </SectionCard>
  );
}

//  Sessions Management
// Matches the shape returned by GET /auth/sessions → { sessions: Session[] }
interface Session {
  id: string;
  device?: { platform?: string; device_name?: string };
  ip_address?: string;
  user_agent?: string;
  is_current?: boolean;
  created_at?: string;
  expires_at?: string;
}

function SessionsSection() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [logoutCurrentLoading, setLogoutCurrentLoading] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  // Load sessions from the backend
  const fetchSessions = useCallback(async () => {
    try {
      setFetchError(null);
      setLoadingFetch(true);
      const data = await getSessions();
      // Backend returns { sessions: [...] }
      setSessions(Array.isArray(data) ? data : (data?.sessions ?? []));
    } catch {
      setFetchError("Could not load sessions. Please try again.");
    } finally {
      setLoadingFetch(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Revoke a DIFFERENT session (not the one you are using)
  // After revoking, the other browser/tab will be sent to the
  // home page automatically the next time it makes an API call.
  const handleRevoke = async (sessionId: string) => {
    if (!isUUID(sessionId)) return;
    setActionStatus(null);
    setRevoking(sessionId);
    try {
      await revokeSession(sessionId);
      // Remove it from the list right away so the user sees the change
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setActionStatus({
        type: "success",
        msg: "Session revoked. That device has been signed out.",
      });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionStatus({
        type: "error",
        msg: axiosErr.response?.data?.message ?? "Failed to revoke session.",
      });
    } finally {
      setRevoking(null);
    }
  };

  // Sign out from the CURRENT session (this browser/tab)
  // This calls the normal logout endpoint which clears the cookies,
  // then redirects to the home page.
  const handleSignOutCurrent = async () => {
    setActionStatus(null);
    setLogoutCurrentLoading(true);
    try {
      await logoutUser(); // clears httpOnly cookies + auth store
      router.replace("/");
    } catch {
      // Even if the backend call fails, clear local state and redirect
      router.replace("/");
    }
  };

  // Sign out from ALL sessions
  const handleLogoutAll = async () => {
    setActionStatus(null);
    setLogoutAllLoading(true);
    try {
      await logoutAllSessions();
      router.replace("/");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setActionStatus({
        type: "error",
        msg:
          axiosErr.response?.data?.message ??
          "Failed to sign out all sessions.",
      });
      setLogoutAllLoading(false);
    }
  };

  return (
    <SectionCard title="Active Sessions">
      {/* Refresh button row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">
          Revoke any session you don&apos;t recognise.
        </p>
        <button
          onClick={fetchSessions}
          disabled={loadingFetch}
          className="shrink-0 ml-4 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        >
          {loadingFetch ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {loadingFetch && (
        <p className="text-sm text-zinc-400">Loading sessions…</p>
      )}
      {fetchError && <StatusMessage type="error" message={fetchError} />}

      {!loadingFetch && !fetchError && sessions.length === 0 && (
        <p className="text-sm text-zinc-400">No active sessions found.</p>
      )}

      {/* Sessions list */}
      {sessions.length > 0 && (
        <ul className="divide-y divide-zinc-800 mb-5">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between py-3 gap-4"
            >
              {/* Left side: device name + details */}
              <div className="min-w-0">
                <p className="text-sm text-white truncate">
                  {session.device?.device_name ?? "Unknown device"}
                  {session.is_current && (
                    <span className="ml-2 text-xs bg-white text-black px-1.5 py-0.5 rounded">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {session.ip_address ?? "Unknown IP"}
                  {session.created_at
                    ? ` · signed in ${new Date(session.created_at).toLocaleString()}`
                    : ""}
                </p>
              </div>

              {/* Right side: action button */}
              {session.is_current ? (
                // For the current session, "Sign out" logs you out of this browser
                <button
                  onClick={handleSignOutCurrent}
                  disabled={logoutCurrentLoading}
                  title="Sign out of this browser"
                  className="shrink-0 text-xs text-white hover:text-white border border-white hover:border-white cursor-pointer px-3 py-1 rounded"
                >
                  {logoutCurrentLoading ? "Signing out…" : "Sign out"}
                </button>
              ) : (
                // For any other session, "Revoke" terminates it remotely.
                // That device will be redirected to the home page the next
                // time it tries to make an API call.
                <button
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking === session.id}
                  title="Terminate this session on the remote device"
                  className="shrink-0 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 border border-red-400/30 hover:border-red-300/50 px-3 py-1 rounded transition-colors"
                >
                  {revoking === session.id ? "Revoking…" : "Revoke"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {actionStatus && (
        <StatusMessage type={actionStatus.type} message={actionStatus.msg} />
      )}

      {/* Sign out from every session at once */}
      <button
        onClick={handleLogoutAll}
        disabled={logoutAllLoading}
        className="mt-4 h-10 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-sm text-lg transition-colors"
      >
        {logoutAllLoading ? "Signing out…" : "Sign out from all devices"}
      </button>
    </SectionCard>
  );
}

function AccountSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [status, setStatus] = useState<{
    type: "error" | "success";
    msg: string;
  } | null>(null);

  const handleDeactivateAccount = async () => {
    try {
      setLoading(true);
      setStatus(null);

      const result = await deactivateMyAccount();

      setStatus({
        type: "success",
        msg: result.message,
      });

      useAuthStore.getState().logout();
      useProfileStore.getState().resetProfile();

      setTimeout(() => {
        router.replace("/");
      }, 1200);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };

      setStatus({
        type: "error",
        msg:
          axiosErr.response?.data?.message ??
          "Failed to deactivate account. Please try again.",
      });

      setLoading(false);
    }
  };

  return (
    <SectionCard title="Account">
      <button
        type="button"
        onClick={() => setShowDeleteModal(true)}
        disabled={loading}
        className="h-10 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-sm text-lg transition-colors"
      >
        Delete Account
      </button>
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-lg border border-zinc-700 bg-[#1a1a1a] p-8 shadow-2xl">
            <h2 className="mb-6 text-xl font-bold text-white">
              Delete your account?
            </h2>

            <div className="mb-8 text-lg leading-8 text-zinc-200">
              <p className="mb-4">
                Deleting your account means your account will be deactivated
                and:
              </p>

              <ul className="list-disc space-y-1 pl-6">
                <li>your profile will no longer be active,</li>
                <li>your tracks will be hidden,</li>
                <li>other users will not be able to find your account,</li>
                <li>you may lose access to your account data.</li>
              </ul>
            </div>

            {status && (
              <StatusMessage type={status.type} message={status.msg} />
            )}

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="rounded bg-white px-6 py-2 font-bold text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeactivateAccount}
                disabled={loading}
                className="rounded bg-red-600 px-6 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// Page root
type Tab = "security" | "sessions" | "privacy" | "subscription";


export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);

  // Define valid tabs for validation
  const validTabs: Tab[] = ["security", "sessions", "privacy", "subscription"];
  
  // Get the tab from URL query params
  const tabFromUrl = searchParams.get("tab") as Tab;

  // Initialize state directly from URL if valid, otherwise default to "security"
  // This avoids the 'react-hooks/set-state-in-effect' error by calculating state during render
  const [activeTab, setActiveTab] = useState<Tab>(
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "security"
  );

  // Function to handle tab changes and update the URL simultaneously
  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    // Sync the URL with the selected tab without triggering a page reload
    router.push(`/settings?tab=${tabId}`, { scroll: false });
  };

  const { fetchBlockedUsers, loadingUserId, blockUser, unblockUser } =
    useBlockStore();

  useEffect(() => {
    // Middleware already blocks unauthenticated access via the cookie check,
    // but if the Zustand store is empty (page refresh race) we redirect safely.
    if (user === null) {
      // Small delay to let useAuthInit populate the store before redirecting
      const t = setTimeout(() => {
        if (!useAuthStore.getState().user) {
          router.replace("/");
        }
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  // Rest of your tabs array and other logic...
  const tabs: { id: Tab; label: string }[] = [
    { id: "security", label: "Security" },
    { id: "sessions", label: "Sessions" },
    { id: "privacy", label: "Privacy" },
    { id: "subscription", label: "Subscription" },
  ];

  // Fetch blocked users when Privacy tab is opened
  useEffect(() => {
    if (activeTab === "privacy") {
      fetchBlockedUsers();
    }
  }, [activeTab, fetchBlockedUsers]);

  return (
    <div className="min-h-screen text-white px-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Account Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-6 border-b border-zinc-700 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)} // Use the new handler here
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab.id
                ? "text-[#ff5500] border-b-2 border-[#ff5500]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render sections based on activeTab... */}
      {activeTab === "security" && (
        <>
          <ChangePasswordSection />
          <ChangeEmailSection currentEmail={user?.email ?? ""} />
        </>
      )}

      {activeTab === "sessions" && <SessionsSection />}

      {activeTab === "privacy" && (
        <SectionCard title="Blocked Users">
          <BlockedUsersList loadingUserId={loadingUserId} />
        </SectionCard>
      )}

      {activeTab === "subscription" && <SubscriptionSettings />}
    </div>
  );
}
