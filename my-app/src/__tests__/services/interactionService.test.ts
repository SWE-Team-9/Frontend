import api from "@/src/services/api";
import { 
  getTrackEngagements, 
  getTrackComments, 
  addTrackComment, 
  deleteTrackComment 
} from "@/src/services/interactionService";

jest.mock("@/src/services/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("interactionService Coverage Boost", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTrackEngagements", () => {
    test("calls likers endpoint and maps data correctly", async () => {
      const mockItems = [
        {
          user: { userId: "1", displayName: "Salma Mohamed", avatarUrl: "url" },
          interactedAt: "2026-04-14"
        }
      ];
      mockedApi.get.mockResolvedValue({ data: { items: mockItems } });

      const result = await getTrackEngagements("track_123", "likes");

      expect(mockedApi.get).toHaveBeenCalledWith("/interactions/tracks/track_123/likers");
      expect(result[0]).toEqual({
        id: "1",
        display_name: "Salma Mohamed",
        handle: "salmamohamed", // Testing handle fallback logic
        avatar_url: "url"
      });
    });

    test("calls reposters endpoint and handles missing items", async () => {
      mockedApi.get.mockResolvedValue({ data: {} }); // Missing items field
      const result = await getTrackEngagements("track_123", "reposts");
      
      expect(mockedApi.get).toHaveBeenCalledWith("/interactions/tracks/track_123/reposters");
      expect(result).toEqual([]);
    });
  });

  describe("getTrackComments", () => {
    test("handles raw array response from backend", async () => {
      const mockArray = [
        { id: "c1", content: "Great track!", user: { id: "u1", display_name: "User" } }
      ];
      mockedApi.get.mockResolvedValue({ data: mockArray });

      const result = await getTrackComments("track_123");
      expect(result.comments).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.comments[0].text).toBe("Great track!");
    });

    test("handles object response and complex fallback mapping", async () => {
      const mockObject = {
        page: 1,
        limit: 10,
        total: 50,
        comments: [{
          commentId: "c2",
          text: "Love it",
          timestampAt: 120,
          createdAt: "2026-01-01T00:00:00Z",
          user: { userId: "u2", displayName: "Expert User" }
        }]
      };
      mockedApi.get.mockResolvedValue({ data: mockObject });

      const result = await getTrackComments("track_123", 1, 10);
      
      expect(result.total).toBe(50);
      expect(result.comments[0]).toMatchObject({
        commentId: "c2",
        text: "Love it",
        timestampSeconds: 120,
        user: { id: "u2", display_name: "Expert User" }
      });
    });

    test("handles missing user fields with defaults", async () => {
      mockedApi.get.mockResolvedValue({ 
        data: [{ id: "c1", user: {} }] // Extreme case: empty user object
      });
      const result = await getTrackComments("track_123");
      expect(result.comments[0].user.display_name).toBe("Unknown User");
    });
  });

  describe("add & delete", () => {
    test("addTrackComment sends correct payload", async () => {
      mockedApi.post.mockResolvedValue({ data: { id: "new_id" } });
      const body = { content: "Nice", timestampAt: 10 };
      
      const result = await addTrackComment("t1", body);
      expect(mockedApi.post).toHaveBeenCalledWith("/interactions/tracks/t1/comments", body);
      expect(result).toEqual({ id: "new_id" });
    });

    test("deleteTrackComment calls correct endpoint", async () => {
      mockedApi.delete.mockResolvedValue({ data: { message: "Deleted" } });
      const result = await deleteTrackComment("c_99");
      expect(mockedApi.delete).toHaveBeenCalledWith("/interactions/comments/c_99");
      expect(result.message).toBe("Deleted");
    });
  });
});