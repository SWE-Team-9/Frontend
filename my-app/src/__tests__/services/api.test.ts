/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

let capturedSuccessHandler: (r: any) => any;
let capturedErrorHandler: (e: any) => any;

const mockApiInstance = {
  interceptors: {
    response: {
      use: jest.fn((successFn: any, errorFn: any) => {
        capturedSuccessHandler = successFn;
        capturedErrorHandler = errorFn;
      }),
    },
  },
  post: jest.fn(),
};

jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => mockApiInstance),
  },
}));

jest.mock("@/src/store/useAuthStore", () => ({
  useAuthStore: { getState: () => ({ logout: jest.fn() }) },
}));
jest.mock("@/src/store/useProfileStore", () => ({
  useProfileStore: { getState: () => ({ resetProfile: jest.fn() }) },
}));

describe("api.ts", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("creates axios instance with correct config", () => {
    jest.resetModules();
    const freshAxios = require("axios").default;
    require("@/src/services/api");
    expect(freshAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: process.env.NEXT_PUBLIC_API_URL,
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("registers a response interceptor", () => {
    require("@/src/services/api");
    expect(mockApiInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it("success interceptor passes response through unchanged", () => {
    require("@/src/services/api");
    const fakeResponse = { data: { ok: true }, status: 200 };
    expect(capturedSuccessHandler(fakeResponse)).toBe(fakeResponse);
  });

  it("non-401 errors are rejected without retry", async () => {
    require("@/src/services/api");
    const error = { response: { status: 500 }, config: {} };
    await expect(capturedErrorHandler(error)).rejects.toEqual(error);
    expect(mockApiInstance.post).not.toHaveBeenCalled();
  });

  it("401 error triggers refresh attempt", async () => {
    require("@/src/services/api");
    mockApiInstance.post.mockResolvedValueOnce({});
    const originalRequest = { _retry: false, method: "get", url: "/test" };
    const error = { response: { status: 401 }, config: originalRequest };
    try {
      await capturedErrorHandler(error);
    } catch {
      /* expected */
    }
    expect(mockApiInstance.post).toHaveBeenCalledWith("/auth/refresh");
  });

  it("does not retry if _retry is already true", async () => {
    require("@/src/services/api");
    const error = { response: { status: 401 }, config: { _retry: true } };
    await expect(capturedErrorHandler(error)).rejects.toEqual(error);
    expect(mockApiInstance.post).not.toHaveBeenCalled();
  });
});