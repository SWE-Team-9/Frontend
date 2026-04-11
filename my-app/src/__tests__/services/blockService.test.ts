/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as blockService from "@/src/services/blockService";

const mockPost = jest.fn();
const mockGet = jest.fn();
const mockDelete = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    post: (...args: any[]) => mockPost(...args),
    get: (...args: any[]) => mockGet(...args),
    delete: (...args: any[]) => mockDelete(...args),
  },
}));

describe("blockService (real mode)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_USE_MOCK;
  });

  it("blockUser calls POST /social/block/:userId", async () => {
    mockPost.mockResolvedValueOnce({ data: { message: "blocked", blockedUserId: "u1" } });
    const result = await blockService.blockUser("u1");
    expect(mockPost).toHaveBeenCalledWith("/social/block/u1");
    expect(result).toEqual({ message: "blocked", blockedUserId: "u1" });
  });

  it("unblockUser calls DELETE /social/block/:userId", async () => {
    mockDelete.mockResolvedValueOnce({ data: { message: "unblocked", blockedUserId: "u1" } });
    const result = await blockService.unblockUser("u1");
    expect(mockDelete).toHaveBeenCalledWith("/social/block/u1");
    expect(result).toEqual({ message: "unblocked", blockedUserId: "u1" });
  });

  it("getBlockedUsers calls GET with page and limit params", async () => {
    mockGet.mockResolvedValueOnce({ data: { page: 2, limit: 10, total: 0, blockedUsers: [] } });
    const result = await blockService.getBlockedUsers(2, 10);
    expect(mockGet).toHaveBeenCalledWith("/social/blocked-users?page=2&limit=10");
    expect(result).toEqual({ page: 2, limit: 10, total: 0, blockedUsers: [] });
  });

  it("getBlockedUsers uses default page=1 and limit=20", async () => {
    mockGet.mockResolvedValueOnce({ data: { page: 1, limit: 20, total: 0, blockedUsers: [] } });
    await blockService.getBlockedUsers();
    expect(mockGet).toHaveBeenCalledWith("/social/blocked-users?page=1&limit=20");
  });
});

describe("blockService (mock mode)", () => {
  let mockBlockService: typeof import("@/src/services/blockService");

  beforeAll(() => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
    jest.resetModules();
    mockBlockService = require("@/src/services/blockService");
  });

  afterAll(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCK;
    jest.resetModules();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("blockUser returns success message without calling API", async () => {
    const result = await mockBlockService.blockUser("user-999");
    expect(mockPost).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ blockedUserId: "user-999" }));
  });

  it("unblockUser returns success message without calling API", async () => {
    const result = await mockBlockService.unblockUser("user-001");
    expect(mockDelete).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ blockedUserId: "user-001" }));
  });

  it("getBlockedUsers returns paginated mock data without calling API", async () => {
    const result = await mockBlockService.getBlockedUsers(1, 20);
    expect(mockGet).not.toHaveBeenCalled();
    expect(result).toHaveProperty("blockedUsers");
    expect(result).toHaveProperty("total");
  });
});