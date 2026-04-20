import api from "@/src/services/api";

export type TrackStatus = "PROCESSING" | "FINISHED";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export interface UploadResponse {
  trackId: string;
  title: string;
  artistId: string;
  status: TrackStatus;
  visibility: "PUBLIC" | "PRIVATE";
  waveformData: number[] | null;
  description: string;
}

export interface TrackFile {
  id: string;
  role: "ORIGINAL" | "STREAM";
  mimeType: string;
  format: string;
  size: number | null;
  status: "READY" | "PROCESSING";
}

export interface TrackDetails {
  trackId: string;
  title: string;
  slug: string;
  description: string | null;
  artist: string | null;
  artistId: string | null;
  artistHandle: string | null;
  artistAvatarUrl: string | null;
  genre: string | null;
  tags: string[];
  releaseDate: string | null;
  durationMs: number | null;
  waveformData: number[] | null;
  visibility: "PUBLIC" | "PRIVATE";
  accessLevel: string;
  status: TrackStatus;
  license: string;
  allowComments: boolean;
  downloadable: boolean;
  coverArtUrl: string | null;
  secretToken: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files: TrackFile[];
}

// ===============================
//  UPLOAD TRACK
// ===============================
export const uploadTrack = async (
  file: File,
  metadata: {
    title: string;
    genre: string;
    tags: string[];
    releaseDate: string;
    description: string;
  },
): Promise<UploadResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      trackId: "trk_mock_001",
      title: metadata.title,
      artistId: "user_123",
      status: "PROCESSING",
      visibility: "PRIVATE",
      waveformData: null,
      description: metadata.description,
    };
  }

  const formData = new FormData();

  formData.append("title", metadata.title);
  formData.append("genre", metadata.genre);
  formData.append("releaseDate", metadata.releaseDate);
  metadata.tags.forEach((tag) => formData.append("tags[]", tag));
  formData.append("audioFile", file);
  formData.append("description", metadata.description);

  const res = await api.post("/tracks", formData); // protected endpoint, cookies sent automatically
  return res.data;
};

// ===============================
//  GET TRACK DETAILS
// ===============================
export const getTrackDetails = async (
  trackId: string,
): Promise<TrackDetails> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return {
      trackId,
      title: "Mock Track",
      slug: "mock-track",
      description: "This is a mock description for testing purposes.",
      artist: "Mock Artist",
      artistId: "usr_mock_456",
      artistHandle: "mockartist",
      artistAvatarUrl: "",
      genre: "Pop",
      tags: ["pop", "test"],
      releaseDate: "2026-03-01T00:00:00.000Z",
      durationMs: 215000,
      visibility: "PRIVATE",
      accessLevel: "PUBLIC",
      status: "FINISHED",
      license: "ALL_RIGHTS_RESERVED",
      allowComments: true,
      downloadable: false,
      coverArtUrl: "",
      secretToken: null,
      publishedAt: "2026-03-06T12:00:00.000Z",
      createdAt: "2026-03-06T11:00:00.000Z",
      updatedAt: "2026-03-06T12:00:00.000Z",
      waveformData: Array.from({ length: 120 }, () =>
        Math.min(1, Math.max(0.08, 0.2 + Math.random() * 0.8)),
      ),
      files: [
        {
          id: "file_001",
          role: "ORIGINAL",
          mimeType: "audio/mpeg",
          format: "mp3",
          size: 8500000,
          status: "READY",
        },
      ],
    };
  }

  const res = await api.get(`/tracks/${trackId}`); // protected endpoint, cookies sent automatically
  return res.data;
};

// ===============================
//  GET TRACK STATUS
// ===============================
export const getTrackStatus = async (trackId: string) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 2000));
    return { trackId, status: "FINISHED" };
  }

  try {
    const res = await api.get(`/tracks/${trackId}/status`);
    return res.data;
  } catch (err: unknown) {
    // Track not yet available in DB (created but not committed) — treat as still processing
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return { trackId, status: "PROCESSING" as const };
    }
    throw err;
  }
};

// ===============================
//  UPDATE TRACK METADATA (Edit Track)
// ===============================
export const updateTrackMetadata = async (
  trackId: string,
  data: {
    title?: string;
    genre?: string;
    tags?: string[];
    releaseDate?: string;
    description?: string;
  },
) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return { trackId, ...data };
  }

  const res = await api.put(`/tracks/${trackId}`, data);
  return res.data;
};

// ===============================
//  DELETE TRACK
// ===============================
export const deleteTrack = async (trackId: string) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return;
  }

  const res = await api.delete(`/tracks/${trackId}`); // protected endpoint, cookies sent automatically
  return res.data;
};

// ===============================
//  GET ARTIST TRACKS
// ===============================
export const getUserTracks = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return {
      tracks: [
        {
          trackId: "trk_001",
          title: "Recording 2026-03-15",
          status: "PROCESSING",
          visibility: "PUBLIC",
          genre: "Pop",
          tags: ["pop", "demo"],
          artist: { avatarUrl: "" },
        },
        {
          trackId: "trk_002",
          title: "Second Track Demo",
          status: "FINISHED",
          visibility: "PRIVATE",
          genre: "Electronic",
          tags: ["electronic", "test"],
          artist: { avatarUrl: "" },
        },
      ],
      totalTracks: 2,
      page,
      limit,
    };
  }

  const res = await api.get(
    `/users/${userId}/tracks?page=${page}&limit=${limit}`,
  );
  return res.data;
};

// ===============================
//  CHANGE TRACK VISIBILITY
// ===============================
export const changeTrackVisibility = async (
  trackId: string,
  visibility: "PUBLIC" | "PRIVATE",
) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return { trackId, visibility };
  }

  const res = await api.patch(`/tracks/${trackId}/visibility`, { visibility }); // protected endpoint, cookies sent automatically
  return res.data;
};

// ===============================
//  RESOLVE PRIVATE TRACK
// ===============================
export const resolvePrivateTrack = async (secretToken: string) => {
  const res = await api.get(`/tracks/secret/${secretToken}`);
  return res.data;
};
