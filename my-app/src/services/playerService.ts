import api from "@/src/services/api";

export type PlaybackAccessState = "PLAYABLE" | "BLOCKED" | "PREVIEW";

export interface PlaybackStateResponse {
  trackId: string;
  accessState: PlaybackAccessState;
  reason: string | null;
}

export interface PlaybackSourceResponse {
  trackId: string;
  streamUrl: string;
  accessState: "PLAYABLE";
  expiresAt?: string;
}

export interface PreviewSourceResponse {
  trackId: string;
  previewUrl: string;
  previewDurationSeconds?: number;
  accessState: "PREVIEW";
}

export async function getPlaybackState(trackId: string): Promise<PlaybackStateResponse> {
  const { data } = await api.get(`/player/tracks/${trackId}/state`);
  return data;
}

export async function getPlaybackSource(trackId: string): Promise<PlaybackSourceResponse> {
  const { data } = await api.get(`/player/tracks/${trackId}/source`);
  return data;
}

export async function getPreviewSource(trackId: string): Promise<PreviewSourceResponse> {
  const { data } = await api.get(`/player/tracks/${trackId}/preview`);
  return data;
}