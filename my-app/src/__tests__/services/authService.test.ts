/* eslint-disable @typescript-eslint/no-explicit-any */

const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

const mockSetUser = jest.fn();
let mockCurrentUser: any = null;

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: mockApi,
}));

jest.mock("@/src/store/useAuthStore", () => ({
  useAuthStore: {
    getState: () => ({
      user: mockCurrentUser,
      setUser: mockSetUser,
      setEmail: jest.fn(),
      logout: jest.fn(),
    }),
  },
}));

jest.mock("@/src/store/useProfileStore", () => ({
  useProfileStore: {
    getState: () => ({
      resetProfile: jest.fn(),
    }),
  },
}));

describe("authService password flows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: "user-1",
      email: "user@example.com",
      displayName: "User",
      handle: "user",
      account_status: "ACTIVE",
      hasPassword: false,
    };
    process.env.NEXT_PUBLIC_USE_MOCK = "false";
  });

  it("omits current_password when setting the first local password", async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: "Password set successfully.", hasPassword: true } });
    const { changePassword } = await import("@/src/services/authService");

    const result = await changePassword(undefined, "NewPass123!", "NewPass123!");

    expect(mockApi.post).toHaveBeenCalledWith("/auth/change-password", {
      new_password: "NewPass123!",
      new_password_confirm: "NewPass123!",
    });
    expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ hasPassword: true }));
    expect(result.hasPassword).toBe(true);
  });

  it("sends current_password for normal password changes", async () => {
    mockCurrentUser = { ...mockCurrentUser, hasPassword: true };
    mockApi.post.mockResolvedValueOnce({ data: { message: "Password changed.", hasPassword: true } });
    const { changePassword } = await import("@/src/services/authService");

    await changePassword("OldPass123!", "NewPass123!", "NewPass123!");

    expect(mockApi.post).toHaveBeenCalledWith("/auth/change-password", {
      current_password: "OldPass123!",
      new_password: "NewPass123!",
      new_password_confirm: "NewPass123!",
    });
  });

  it("maps hasPassword=false from /auth/me into the auth store", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        id: "oauth-user",
        email: "oauth@example.com",
        display_name: "OAuth User",
        handle: "oauth",
        avatar_url: null,
        is_verified: true,
        system_role: "USER",
        account_status: "ACTIVE",
        hasPassword: false,
      },
    });
    const { getCurrentUser } = await import("@/src/services/authService");

    await getCurrentUser();

    expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ hasPassword: false }));
  });

  it("maps has_password=true from /auth/me into the auth store", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        id: "local-user",
        email: "local@example.com",
        display_name: "Local User",
        handle: "local",
        avatar_url: null,
        is_verified: true,
        system_role: "USER",
        account_status: "ACTIVE",
        has_password: true,
      },
    });
    const { getCurrentUser } = await import("@/src/services/authService");

    await getCurrentUser();

    expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({ hasPassword: true }));
  });
});
