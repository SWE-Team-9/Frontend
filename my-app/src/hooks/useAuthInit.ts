"use client";
import { useEffect } from "react";
import { getBootstrapData, toSystemRole } from "@/src/services/bffService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useProfileStore } from "@/src/store/useProfileStore";

// ─────────────────────────────────────────────────────────────
// useAuthInit
//
// Runs once when the app shell mounts. Calls GET /app/bootstrap
// (requires a valid JWT cookie) to restore session state in one
// round-trip. On 401 or network error the user stays a guest.
//
// Security notes:
//   • system_role is validated against a known whitelist via
//     toSystemRole() before being stored. Unexpected values
//     fall back to the least-privilege "USER" role.
//   • All admin API routes enforce @Roles('ADMIN') server-side,
//     so store manipulation cannot grant real access.
//   • The role is fetched fresh from the DB on every bootstrap
//     call — role changes take effect on the next page load
//     without requiring a full re-login.
// ─────────────────────────────────────────────────────────────

export const useAuthInit = () => {
  useEffect(() => {
    getBootstrapData()
      .then((data) => {
        // Seed profile store (shell-level data; full profile still
        // needs its own fetch for bio, links, genres, etc.)
        if (data.profile) {
          const p = data.profile;
          useProfileStore.getState().setProfileData({
            userId: p.id,
            displayName: p.displayName ?? "",
            handle: p.handle ?? "",
            avatarUrl: p.avatarUrl ?? null,
            coverUrl: p.coverUrl ?? null,
            accountType: (p.accountType as "ARTIST" | "LISTENER") ?? "LISTENER",
            followersCount: p.followersCount ?? 0,
            followingCount: p.followingCount ?? 0,
            tracksCount: p.tracksCount ?? 0,
            isLoaded: false,
          });
        }

        // Seed auth store last. Validate system_role against the known
        // whitelist before storing — unknown values default to "USER".
        const me = data.me;
        useAuthStore.getState().setUser({
          id: me.id,
          email: me.email,
          displayName: me.display_name ?? "",
          handle: me.handle ?? "",
          avatarUrl: me.avatar_url ?? null,
          isVerified: me.is_verified ?? false,
          systemRole: toSystemRole(me.system_role),
        });
      })
      .catch(() => {
        // 401 or network error — user is a guest, nothing to do
      });
  }, []);
};
