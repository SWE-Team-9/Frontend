import api from "@/src/services/api";
import { getMyProfile, updateMyProfile } from "@/src/services/profileService";

jest.mock("@/src/services/api");
const mockedApi = api as jest.Mocked<typeof api>;

describe("profileService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps account_type from /profiles/me responses", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        id: "usr_1",
        handle: "menna",
        display_name: "Menna",
        account_type: "ARTIST",
        favorite_genres: [],
        social_links: [],
      },
    });

    const profile = await getMyProfile();

    expect(mockedApi.get).toHaveBeenCalledWith("/profiles/me");
    expect(profile.accountType).toBe("ARTIST");
  });

  it("normalizes lowercase account values from /profiles/me responses", async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: {
        id: "usr_2",
        handle: "menna2",
        display_name: "Menna Two",
        account_type: "artist",
        favorite_genres: [],
        social_links: [],
      },
    });

    const profile = await getMyProfile();

    expect(profile.accountType).toBe("ARTIST");
  });

  it("maps wrapped update responses and keeps account_tier", async () => {
    mockedApi.patch.mockResolvedValueOnce({
      data: {
        profile: {
          id: "usr_1",
          handle: "menna",
          display_name: "Menna",
          account_tier: "LISTENER",
          favorite_genres: [],
          social_links: [],
        },
      },
    });

    const profile = await updateMyProfile({ account_tier: "LISTENER" });

    expect(mockedApi.patch).toHaveBeenCalledWith("/profiles/me", {
      account_tier: "LISTENER",
    });
    expect(profile.accountType).toBe("LISTENER");
  });
});
