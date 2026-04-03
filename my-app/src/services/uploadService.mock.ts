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
    artist: "Mock Artist",
    artistAvatarUrl: "",
    genre: "Pop",
    tags: ["pop", "test"],
    releaseDate: "2026-03-01",
    visibility: "PRIVATE",
    status: "FINISHED",
    waveformData: Array.from({ length: 100 }, () => Math.random()),
  };
};

export const changeTrackVisibility = async (trackId: string, visibility: "PUBLIC" | "PRIVATE") => {
  await new Promise((r) => setTimeout(r, 500));
  return { trackId, visibility };
};