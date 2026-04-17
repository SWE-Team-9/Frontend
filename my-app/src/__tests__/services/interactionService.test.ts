export {};
jest.mock("@/src/services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const getMockApi = () =>
  jest.requireMock("@/src/services/api").default as {
    get: jest.Mock;
    post: jest.Mock;
    delete: jest.Mock;
  };

describe("interactionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("getTrackEngagements maps likes users", async () => {
    getMockApi().get.mockResolvedValue({
      data: {
        items: [
          {
            interactedAt: "2026-04-12T10:00:00Z",
            user: {
              userId: "usr_1",
              displayName: "Ahmed Hassan",
              avatarUrl: "/avatar.jpg",
              handle: "ahmed",
            },
          },
        ],
      },
    });

    const { getTrackEngagements } = await import("@/src/services/interactionService");
    const result = await getTrackEngagements("trk_1", "likes");

    expect(getMockApi().get).toHaveBeenCalledWith("/interactions/tracks/trk_1/likers");
    expect(result).toEqual([
      {
        id: "usr_1",
        display_name: "Ahmed Hassan",
        handle: "ahmed",
        avatar_url: "/avatar.jpg",
      },
    ]);
  });

  it("getTrackEngagements derives handle when missing", async () => {
    getMockApi().get.mockResolvedValue({
      data: {
        items: [
          {
            interactedAt: "2026-04-12T10:00:00Z",
            user: {
              userId: "usr_2",
              displayName: "Maryam Soliman",
              avatarUrl: null,
            },
          },
        ],
      },
    });

    const { getTrackEngagements } = await import("@/src/services/interactionService");
    const result = await getTrackEngagements("trk_1", "reposts");

    expect(getMockApi().get).toHaveBeenCalledWith("/interactions/tracks/trk_1/reposters");
    expect(result[0].handle).toBe("maryamsoliman");
    expect(result[0].avatar_url).toBe("");
  });

  it("getTrackComments normalizes array response shape", async () => {
    getMockApi().get.mockResolvedValue({
      data: [
        {
          id: "c1",
          content: "Great drop",
          timestampAt: 30,
          createdAt: "2026-04-12T10:00:00Z",
          user: {
            userId: "usr_1",
            displayName: "Maryam",
          },
        },
      ],
    });

    const { getTrackComments } = await import("@/src/services/interactionService");
    const result = await getTrackComments("trk_1", 1, 100);

    expect(getMockApi().get).toHaveBeenCalledWith("/interactions/tracks/trk_1/comments?page=1&limit=100");
    expect(result).toEqual({
      page: 1,
      limit: 100,
      total: 1,
      comments: [
        {
          commentId: "c1",
          trackId: "trk_1",
          text: "Great drop",
          timestampSeconds: 30,
          createdAt: "2026-04-12T10:00:00Z",
          user: {
            id: "usr_1",
            display_name: "Maryam",
          },
        },
      ],
    });
  });

  it("getTrackComments normalizes object response shape", async () => {
    getMockApi().get.mockResolvedValue({
      data: {
        page: 2,
        limit: 20,
        total: 5,
        comments: [
          {
            commentId: "c2",
            text: "Nice",
            timestampSeconds: 40,
            createdAt: "2026-04-12T11:00:00Z",
            user: {
              id: "usr_2",
              display_name: "Ahmed",
            },
          },
        ],
      },
    });

    const { getTrackComments } = await import("@/src/services/interactionService");
    const result = await getTrackComments("trk_2", 2, 20);

    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(5);
    expect(result.comments[0]).toEqual({
      commentId: "c2",
      trackId: "trk_2",
      text: "Nice",
      timestampSeconds: 40,
      createdAt: "2026-04-12T11:00:00Z",
      user: {
        id: "usr_2",
        display_name: "Ahmed",
      },
    });
  });

  it("addTrackComment maps request body to backend payload", async () => {
    getMockApi().post.mockResolvedValue({
      data: {
        commentId: "c3",
        trackId: "trk_1",
        text: "Amazing",
        timestampSeconds: 50,
        createdAt: "2026-04-12T12:00:00Z",
      },
    });

    const { addTrackComment } = await import("@/src/services/interactionService");
    const result = await addTrackComment("trk_1", {
      content: "Amazing",
      timestampAt: 50,
    });

    expect(getMockApi().post).toHaveBeenCalledWith("/interactions/tracks/trk_1/comments", {
      content: "Amazing",
      timestampAt: 50,
    });
    expect(result.commentId).toBe("c3");
  });

  it("deleteTrackComment calls delete endpoint", async () => {
    getMockApi().delete.mockResolvedValue({
      data: { message: "Comment deleted successfully" },
    });

    const { deleteTrackComment } = await import("@/src/services/interactionService");
    const result = await deleteTrackComment("c1");

    expect(getMockApi().delete).toHaveBeenCalledWith("/interactions/comments/c1");
    expect(result).toEqual({ message: "Comment deleted successfully" });
  });
});