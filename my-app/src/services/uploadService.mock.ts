export const uploadTrack = async (file: File, metadata: any) => {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1500));
  return {
    trackId: "trk_mock_001",
    title: metadata.title,
    artistId: "user_123",
    status: "PROCESSING",
    visibility: "PRIVATE",
    waveformData: null,
  };
};
export const getTrackStatus = async (trackId: string) => {
  // Simulate processing time — returns PROCESSING twice, then FINISHED
  await new Promise((r) => setTimeout(r, 2000));
  return { trackId, status: "FINISHED" };
};

export const getTrackDetails = async (trackId: string) => {
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
    releaseDate: "2026-03-01",
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
    waveformData: Array.from({ length: 100 }, () => Math.random()),
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
};

export const changeTrackVisibility = async (trackId: string, visibility: "PUBLIC" | "PRIVATE") => {
  await new Promise((r) => setTimeout(r, 500));
  return { trackId, visibility };
};