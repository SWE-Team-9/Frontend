/**
 * Module 11: Report service tests
 *
 * Tests that reportService.createReport sends the correct
 * request and handles errors properly.
 */

const mockPost = jest.fn();

jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    post: mockPost,
    interceptors: { response: { use: jest.fn() } },
  },
}));

describe("reportService.createReport", () => {
  beforeEach(() => {
    jest.resetModules();
    mockPost.mockReset();
  });

  it("sends POST /reports with correct payload for TRACK", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: "report-1",
        targetType: "TRACK",
        reason: "COPYRIGHT",
        status: "PENDING",
      },
    });

    const { reportService } = await import("@/src/services/reportService");
    const result = await reportService.createReport({
      targetId: "track-uuid",
      targetType: "TRACK",
      reason: "COPYRIGHT",
    });

    expect(mockPost).toHaveBeenCalledWith("/reports", {
      targetId: "track-uuid",
      targetType: "TRACK",
      reason: "COPYRIGHT",
    });
    expect(result.status).toBe("PENDING");
  });

  it("sends POST /reports with correct payload for COMMENT", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        id: "report-2",
        targetType: "COMMENT",
        reason: "INAPPROPRIATE",
        status: "PENDING",
      },
    });

    const { reportService } = await import("@/src/services/reportService");
    await reportService.createReport({
      targetId: "comment-uuid",
      targetType: "COMMENT",
      reason: "INAPPROPRIATE",
      description: "Offensive language",
    });

    expect(mockPost).toHaveBeenCalledWith("/reports", {
      targetId: "comment-uuid",
      targetType: "COMMENT",
      reason: "INAPPROPRIATE",
      description: "Offensive language",
    });
  });

  it("includes description when provided", async () => {
    mockPost.mockResolvedValueOnce({ data: { id: "r3", status: "PENDING" } });

    const { reportService } = await import("@/src/services/reportService");
    await reportService.createReport({
      targetId: "track-uuid",
      targetType: "TRACK",
      reason: "SPAM",
      description: "This is spam content",
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/reports",
      expect.objectContaining({ description: "This is spam content" }),
    );
  });

  it("propagates API errors", async () => {
    mockPost.mockRejectedValueOnce(
      Object.assign(new Error("Conflict"), {
        response: { data: { code: "DUPLICATE_REPORT" }, status: 409 },
      }),
    );

    const { reportService } = await import("@/src/services/reportService");
    await expect(
      reportService.createReport({
        targetId: "track-uuid",
        targetType: "TRACK",
        reason: "SPAM",
      }),
    ).rejects.toMatchObject({ response: { data: { code: "DUPLICATE_REPORT" } } });
  });
});
