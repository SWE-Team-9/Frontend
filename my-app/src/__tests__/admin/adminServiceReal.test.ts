/**
 * Module 11: adminService.real.ts tests
 *
 * Tests that the real admin service transforms backend responses
 * correctly to match the AdminStats type.
 */

const mockGet = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: mockGet,
    post: jest.fn(),
    patch: jest.fn(),
    interceptors: { response: { use: jest.fn() } },
  },
}));

const BACKEND_OVERVIEW = {
  users: {
    total: 100,
    active: 80,
    suspended: 10,
    banned: 5,
    verified: 60,
    unverified: 40,
    artists: 20,
    listeners: 80,
    artist_to_listener_ratio: 0.25,
  },
  content: {
    total_tracks: 500,
    tracks_visible: 480,
    tracks_hidden: 15,
    tracks_removed: 5,
    total_playlists: 50,
    total_comments: 1000,
  },
  engagement: {
    total_play_events: 5000,
    completed_play_events: 4000,
    play_through_rate_pct: 80,
    total_likes: 2000,
    total_reposts: 300,
  },
  billing: {
    active_subscriptions: 30,
    total_storage_bytes: 1073741824, // 1 GB
  },
  moderation: {
    reports_pending: 12,
    reports_in_review: 3,
    reports_resolved_this_week: 20,
    actions_taken_this_week: 8,
  },
};

describe("adminServiceReal.getInitialData", () => {
  beforeEach(() => {
    jest.resetModules();
    mockGet.mockReset();
  });

  it("transforms backend overview stats to AdminStats shape", async () => {
    mockGet
      .mockResolvedValueOnce({ data: BACKEND_OVERVIEW }) // stats/overview
      .mockResolvedValueOnce({ data: { users: [] } }) // admin/users
      .mockResolvedValueOnce({ data: { items: [] } }) // admin/reports
      .mockResolvedValueOnce({ data: { items: [] } }) // audit-log
      .mockResolvedValueOnce({ data: null }); // most-reported

    const { adminServiceReal } = await import("@/src/services/admin/adminService.real");
    const result = await adminServiceReal.getInitialData();
    const stats = result.stats;

    expect(stats.users.total).toBe(100);
    expect(stats.users.artists).toBe(20);
    expect(stats.users.listeners).toBe(80);
    expect(stats.users.active).toBe(80);
    expect(stats.users.suspended).toBe(10);
    expect(stats.users.banned).toBe(5);

    expect(stats.content.total_tracks).toBe(500);
    expect(stats.content.tracks_visible).toBe(480);

    expect(stats.moderation.reports_pending).toBe(12);

    expect(stats.storage.used_bytes).toBe(1073741824);
    expect(typeof stats.storage.total_human_readable).toBe("string");
    expect(stats.storage.total_human_readable).toContain("GB");
  });

  it("returns engagement metrics from backend", async () => {
    mockGet
      .mockResolvedValueOnce({ data: BACKEND_OVERVIEW })
      .mockResolvedValueOnce({ data: { users: [] } })
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({ data: null });

    const { adminServiceReal } = await import("@/src/services/admin/adminService.real");
    const result = await adminServiceReal.getInitialData();

    expect(result.stats.engagement?.play_through_rate_pct).toBe(80);
    expect(result.stats.engagement?.total_play_events).toBe(5000);
    expect(result.stats.engagement?.completed_play_events).toBe(4000);
  });

  it("handles zero storage gracefully", async () => {
    const zeroStorageOverview = {
      ...BACKEND_OVERVIEW,
      billing: { active_subscriptions: 0, total_storage_bytes: 0 },
    };
    mockGet
      .mockResolvedValueOnce({ data: zeroStorageOverview })
      .mockResolvedValueOnce({ data: { users: [] } })
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({ data: null });

    const { adminServiceReal } = await import("@/src/services/admin/adminService.real");
    const result = await adminServiceReal.getInitialData();

    expect(result.stats.storage.used_bytes).toBe(0);
    expect(result.stats.storage.total_human_readable).toBe("0 B");
  });

  it("submitAction — suspend calls correct endpoint with duration", async () => {
    const mockPost = jest.fn().mockResolvedValueOnce({ data: { success: true } });
    jest.doMock("@/src/services/api", () => ({
      __esModule: true,
      default: { get: mockGet, post: mockPost, patch: jest.fn() },
    }));

    const { adminServiceReal } = await import("@/src/services/admin/adminService.real");
    await adminServiceReal.submitAction("suspend", "user-uuid", {
      reason: "Violation",
      current_password: "pass",
      duration_days: 7,
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/admin/users/user-uuid/suspend",
      expect.objectContaining({ durationDays: 7, currentPassword: "pass" }),
    );
  });
});
