import api from "@/src/services/api";
import type {
  TrackStatus,
  TrackVisibility,
  TrackDetails,
  Track,
  TrackFile,
  NormalizedArtist,
  UploadResponse,
  UploadTrackMetadata,
  ArtistTracksResponse,
  RawTrackDetails,
  RawArtistTrack,
  RawArtistTracksResponse,
} from "@/src/types/upload";

export type {
  TrackStatus,
  TrackVisibility,
  TrackDetails,
  Track,
  TrackFile,
  UploadResponse,
  ArtistTracksResponse,
};

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ============================================================
//  NORMALIZERS — convert raw backend shapes → normalized shapes
// ============================================================

/* GET /tracks/{id} returns flat artist fields */
function normalizeTrackDetails(raw: RawTrackDetails): TrackDetails {
  const artistObj: NormalizedArtist = {
    id: raw.artistId ?? null,
    displayName: raw.artist ?? null,
    handle: raw.artistHandle ?? null,
    avatarUrl: raw.artistAvatarUrl ?? null,
  };

  return {
    trackId: raw.trackId,
    title: raw.title,
    slug: raw.slug ?? null,
    description: raw.description ?? null,
    genre: raw.genre ?? null,
    tags: raw.tags ?? [],
    releaseDate: raw.releaseDate ?? null,
    durationMs: raw.durationMs ?? null,
    waveformData: raw.waveformData ?? null,
    visibility: raw.visibility ?? "PUBLIC",
    status: raw.status,
    coverArtUrl: raw.coverArtUrl ?? raw.coverArt ?? null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
    publishedAt: raw.publishedAt ?? null,
    artist: artistObj.displayName,
    artistId: artistObj.id,
    artistHandle: artistObj.handle,
    artistAvatarUrl: artistObj.avatarUrl,
    artistObj,
    accessLevel: raw.accessLevel,
    license: raw.license,
    allowComments: raw.allowComments,
    downloadable: raw.downloadable,
    secretToken: raw.secretToken ?? null,
    files: raw.files ?? [],
  };
}

/* GET /users/{id}/tracks returns a nested `artist` object per track */
function normalizeArtistTrack(
  raw: RawArtistTrack,
  fallbackArtist?: { userId: string; name: string; avatarUrl: string },
): Track {
  const a = raw.artist ?? {};
  const artistObj: NormalizedArtist = {
    id: a.id ?? fallbackArtist?.userId ?? null,
    displayName: a.displayName ?? fallbackArtist?.name ?? null,
    handle: a.handle ?? null,
    avatarUrl: a.avatarUrl ?? fallbackArtist?.avatarUrl ?? null,
  };

  return {
    trackId: raw.trackId,
    title: raw.title,
    slug: raw.slug ?? null,
    genre: raw.genre ?? null,
    durationMs: raw.durationMs ?? null,
    waveformData: raw.waveformData ?? null,
    visibility: raw.visibility ?? "PUBLIC",
    status: raw.status,
    coverArtUrl: raw.coverArtUrl ?? raw.coverArt ?? null,
    createdAt: raw.createdAt ?? null,
    artist: artistObj.displayName,
    artistId: artistObj.id,
    artistHandle: artistObj.handle,
    artistAvatarUrl: artistObj.avatarUrl,
    artistObj,
  };
}

// ===============================
//  UPLOAD TRACK
// ===============================
export const uploadTrack = async (
  file: File,
  metadata: UploadTrackMetadata,
): Promise<UploadResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    const slug = metadata.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return {
      trackId: "trk_mock_001",
      title: metadata.title,
      slug,
      artistId: "user_123",
      artistHandle: "mockartist",
      status: "PROCESSING",
      visibility: "PRIVATE",
      waveformData: null,
      description: metadata.description,
      coverArtUrl: null,
    };
  }

  const formData = new FormData();
  formData.append("title", metadata.title);
  formData.append("genre", metadata.genre);
  formData.append("releaseDate", metadata.releaseDate);
  metadata.tags.forEach((tag) => formData.append("tags[]", tag));
  formData.append("audioFile", file);
  if (metadata.coverArt) {
    formData.append("coverArt", metadata.coverArt);
  }
  formData.append("description", metadata.description);

  const res = await api.post<UploadResponse>("/tracks", formData);
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
    const mock: RawTrackDetails = {
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
    return normalizeTrackDetails(mock);
  }

  const res = await api.get<RawTrackDetails>(`/tracks/${trackId}`);
  return normalizeTrackDetails(res.data);
};

// ===============================
//  GET TRACK STATUS
// ===============================
export const getTrackStatus = async (
  trackId: string,
): Promise<{ trackId: string; status: TrackStatus }> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 2000));
    return { trackId, status: "FINISHED" };
  }

  try {
    const res = await api.get<{ trackId: string; status: TrackStatus }>(
      `/tracks/${trackId}/status`,
    );
    return res.data;
  } catch (err: unknown) {
    // Track not yet available in DB (created but not committed) — treat as still processing
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return { trackId, status: "PROCESSING" };
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

  const res = await api.delete(`/tracks/${trackId}`);
  return res.data;
};

// ===============================
//  GET ARTIST TRACKS
// ===============================
export const getUserTracks = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<ArtistTracksResponse> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    const raw: RawArtistTracksResponse = {
      artist: {
        userId: "usr_001",
        name: "Salma Vocals",
        avatarUrl: "",
      },
      page,
      limit,
      totalTracks: 2,
      tracks: [
        {
          trackId: "trk_001",
          title: "Layali El Qahira",
          slug: "layali-el-qahira",
          status: "FINISHED",
          visibility: "PUBLIC",
          genre: "lofi",
          coverArtUrl: "",
          createdAt: "2026-03-06T11:00:00.000Z",
          durationMs: 215000,
          waveformData: null,
          artist: {
            id: "usr_001",
            displayName: "Salma Vocals",
            handle: "salma-vocals",
            avatarUrl: "",
          },
        },
        {
          trackId: "trk_002",
          title: "Cairo Nights",
          slug: "cairo-nights",
          status: "FINISHED",
          visibility: "PRIVATE",
          genre: "lofi",
          coverArtUrl: "",
          createdAt: "2026-03-06T11:00:00.000Z",
          durationMs: 215000,
          waveformData: null,
          artist: {
            id: "usr_001",
            displayName: "Salma Vocals",
            handle: "salma-vocals",
            avatarUrl: "",
          },
        },
      ],
    };

    return {
      artist: raw.artist,
      tracks: raw.tracks.map((t) => normalizeArtistTrack(t, raw.artist)),
      totalTracks: raw.totalTracks,
      page: raw.page,
      limit: raw.limit,
    };
  }

  const res = await api.get<RawArtistTracksResponse>(
    `/users/${userId}/tracks?page=${page}&limit=${limit}`,
  );

  return {
    artist: res.data.artist,
    tracks: res.data.tracks.map((t) =>
      normalizeArtistTrack(t, res.data.artist),
    ),
    totalTracks: res.data.totalTracks,
    page: res.data.page,
    limit: res.data.limit,
  };
};

// ===============================
//  CHANGE TRACK VISIBILITY
// ===============================
export const changeTrackVisibility = async (
  trackId: string,
  visibility: TrackVisibility,
): Promise<{ trackId: string; visibility: TrackVisibility }> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    return { trackId, visibility };
  }

  const res = await api.patch<{ trackId: string; visibility: TrackVisibility }>(
    `/tracks/${trackId}/visibility`,
    { visibility },
  );
  return res.data;
};

// ===============================
//  RESOLVE PRIVATE TRACK
// ===============================
export const resolvePrivateTrack = async (
  secretToken: string,
): Promise<TrackDetails> => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 400));
    return normalizeTrackDetails({
      trackId: "trk_secret_001",
      title: "Unreleased Demo",
      slug: "unreleased-demo",
      description: null,
      artist: "Mock Artist",
      artistId: "usr_mock_456",
      artistHandle: "mockartist",
      artistAvatarUrl: "",
      genre: "Pop",
      tags: ["pop", "2026"],
      releaseDate: "2026-03-06T00:00:00.000Z",
      durationMs: 215000,
      waveformData: [0.1, 0.3, 0.5, 0.7, 0.4],
      visibility: "PRIVATE",
      status: "FINISHED",
      coverArtUrl: null,
      secretToken,
      publishedAt: null,
      createdAt: "2026-03-06T11:00:00.000Z",
      updatedAt: "2026-03-06T11:00:00.000Z",
      files: [],
    });
  }

  const res = await api.get<RawTrackDetails>(`/tracks/secret/${secretToken}`);
  return normalizeTrackDetails(res.data);
};