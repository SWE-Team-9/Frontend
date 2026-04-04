export type TrackStatus = "PROCESSING" | "FINISHED";

export interface UploadResponse {
  trackId: string;
  title: string;
  artistId: string;
  status: TrackStatus;
  visibility: "PUBLIC" | "PRIVATE";
  waveformData: number[] | null;
  description: string;
}

export interface TrackDetails {
  trackId: string;
  title: string;
  artist: string;
  artistAvatarUrl: string;
  genre: string;
  tags: string[];
  releaseDate: string;
  visibility: "PUBLIC" | "PRIVATE";
  status: TrackStatus;
  waveformData: number[];
}

// ===============================
//  UPLOAD TRACK ✔️
// ===============================
export const uploadTrack = async (
  file: File,
  metadata: {
    title: string;
    genre: string;
    tags: string[];
    releaseDate: string;
    description: string;
  }
): Promise<UploadResponse> => {
  const formData = new FormData();

  formData.append("title", metadata.title);
  formData.append("genre", metadata.genre);
  formData.append("releaseDate", metadata.releaseDate);
  formData.append("tags", JSON.stringify(metadata.tags));
  formData.append("audioFile", file);
  formData.append("description", metadata.description);

  const res = await fetch("/api/v1/tracks", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  return res.json();
};

// ===============================
//  GET TRACK DETAILS ✔️
// ===============================
export const getTrackDetails = async (
  trackId: string
): Promise<TrackDetails> => {
  const res = await fetch(`/api/v1/tracks/${trackId}`);

  if (!res.ok) {
    throw new Error("Failed to fetch track details");
  }

  return res.json();
};

// ===============================
//  GET TRACK STATUS ✔️
// ===============================
export const getTrackStatus = async (trackId: string) => {
  const res = await fetch(`/api/v1/tracks/${trackId}/status`);

  if (!res.ok) {
    throw new Error("Failed to get track status");
  }

  return res.json(); // { trackId, status }
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
  }
) => {
  const res = await fetch(`/api/v1/tracks/${trackId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update track");
  }

  return res.json();
};

// ===============================
//  DELETE TRACK
// ===============================
export const deleteTrack = async (trackId: string) => {
  const res = await fetch(`/api/v1/tracks/${trackId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete track");
  }
};

// ===============================
//  GET ARTIST TRACKS
// ===============================
export const getUserTracks = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const res = await fetch(
    `/api/v1/users/${userId}/tracks?page=${page}&limit=${limit}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch user tracks");
  }

  return res.json();
};

// ===============================
//  CHANGE TRACK VISIBILITY ✔️
// ===============================
export const changeTrackVisibility = async (
  trackId: string,
  visibility: "PUBLIC" | "PRIVATE"
) => {
  const res = await fetch(`/api/v1/tracks/${trackId}/visibility`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ visibility }),
  });

  if (!res.ok) {
    throw new Error("Failed to change visibility");
  }

  return res.json();
};

// ===============================
//  RESOLVE PRIVATE TRACK
// ===============================
export const resolvePrivateTrack = async (secretToken: string) => {
  const res = await fetch(`/api/v1/tracks/secret/${secretToken}`);

  if (!res.ok) {
    throw new Error("Invalid or expired token");
  }

  return res.json();
};