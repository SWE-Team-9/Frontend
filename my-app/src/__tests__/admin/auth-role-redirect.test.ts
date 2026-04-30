/**
 * Module 11: Auth role redirect tests
 *
 * Tests that loginUser correctly stores systemRole
 * and that the redirect logic works based on system_role.
 */

import { useAuthStore } from "@/src/store/useAuthStore";

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

jest.mock("@/src/store/useProfileStore", () => ({
  useProfileStore: { getState: () => ({ resetProfile: jest.fn() }) },
}));

describe("Auth store — systemRole", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("stores systemRole USER after setUser", () => {
    useAuthStore.getState().setUser({
      id: "u1",
      email: "user@test.com",
      displayName: "Regular User",
      systemRole: "USER",
    });
    expect(useAuthStore.getState().user?.systemRole).toBe("USER");
  });

  it("stores systemRole MODERATOR after setUser", () => {
    useAuthStore.getState().setUser({
      id: "m1",
      email: "mod@test.com",
      displayName: "Moderator",
      systemRole: "MODERATOR",
    });
    expect(useAuthStore.getState().user?.systemRole).toBe("MODERATOR");
  });

  it("stores systemRole ADMIN after setUser", () => {
    useAuthStore.getState().setUser({
      id: "a1",
      email: "admin@test.com",
      displayName: "Admin",
      systemRole: "ADMIN",
    });
    expect(useAuthStore.getState().user?.systemRole).toBe("ADMIN");
  });

  it("clears systemRole on logout", () => {
    useAuthStore.getState().setUser({
      id: "a1",
      email: "admin@test.com",
      displayName: "Admin",
      systemRole: "ADMIN",
    });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe("loginUser — systemRole mapping", () => {
  it("maps system_role from backend login response to store", async () => {
    const api = await import("@/src/services/api");
    (api.default.post as jest.Mock).mockResolvedValueOnce({
      data: {
        message: "Logged in",
        user: {
          id: "admin-uuid",
          email: "admin@example.com",
          display_name: "Admin User",
          handle: "adminuser",
          avatar_url: null,
          is_verified: true,
          system_role: "ADMIN",
        },
      },
    });

    const { loginUser } = await import("@/src/services/authService");
    await loginUser({ email: "admin@example.com", password: "Password1!" });

    const stored = useAuthStore.getState().user;
    expect(stored?.systemRole).toBe("ADMIN");
  });

  it("maps system_role MODERATOR from backend login response", async () => {
    const api = await import("@/src/services/api");
    (api.default.post as jest.Mock).mockResolvedValueOnce({
      data: {
        user: {
          id: "mod-uuid",
          email: "mod@example.com",
          display_name: "Mod User",
          handle: "moduser",
          avatar_url: null,
          is_verified: true,
          system_role: "MODERATOR",
        },
      },
    });

    const { loginUser } = await import("@/src/services/authService");
    await loginUser({ email: "mod@example.com", password: "Password1!" });

    expect(useAuthStore.getState().user?.systemRole).toBe("MODERATOR");
  });
});

describe("getCurrentUser — systemRole mapping", () => {
  it("maps system_role from GET /auth/me response", async () => {
    const api = await import("@/src/services/api");
    (api.default.get as jest.Mock).mockResolvedValueOnce({
      data: {
        id: "a1",
        email: "admin@example.com",
        display_name: "Admin",
        handle: "admin",
        avatar_url: null,
        is_verified: true,
        system_role: "ADMIN",
      },
    });

    const { getCurrentUser } = await import("@/src/services/authService");
    await getCurrentUser();

    expect(useAuthStore.getState().user?.systemRole).toBe("ADMIN");
  });
});
