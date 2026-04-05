import api from "@/src/services/api";
import { getTrackDetails } from "@/src/services/trackService";
import { ListeningHistoryItem, RecentlyPlayedItem } from "@/src/types/history";

interface RecentTrackResponseItem {
  trackId: string;
  title: string;
  artist: {
    id: string;
    display_name: string;
  };
  lastPlayedAt: string;
  lastPositionSeconds: number;
}

interface RecentlyPlayedResponse {
  page: number;
  limit: number;
  total: number;
  tracks: RecentTrackResponseItem[];
}

interface ListeningHistoryResponseItem {
  trackId: string;
  title: string;
  playedAt: string;
  positionSeconds: number;
  durationSeconds: number;
  isCompleted: boolean;
}

interface ListeningHistoryResponse {
  page: number;
  limit: number;
  total: number;
  history: ListeningHistoryResponseItem[];
}

export async function getRecentlyPlayed(limit = 6, page = 1): Promise<RecentlyPlayedItem[]> {
  const { data } = await api.get<RecentlyPlayedResponse>(
    `/player/history/recent?page=${page}&limit=${limit}`
  );

  const details = await Promise.all(
    data.tracks.map((track) => getTrackDetails(track.trackId))
  );

  return data.tracks.map((track) => {
    const detail = details.find((d) => d.trackId === track.trackId);

    return {
      trackId: track.trackId,
      title: detail?.title || track.title,
      artist: detail?.artist || track.artist.display_name,
      coverArtUrl: detail?.coverArtUrl || null,
      lastPlayedAt: track.lastPlayedAt,
      lastPositionSeconds: track.lastPositionSeconds,
    };
  });
}

export async function getListeningHistory(limit = 20, page = 1): Promise<ListeningHistoryItem[]> {
  const { data } = await api.get<ListeningHistoryResponse>(
    `/player/history?page=${page}&limit=${limit}`
  );

  const details = await Promise.all(
    data.history.map((track) => getTrackDetails(track.trackId))
  );

  return data.history.map((track) => {
    const detail = details.find((d) => d.trackId === track.trackId);

    return {
      trackId: track.trackId,
      title: detail?.title || track.title,
      artist: detail?.artist || "Unknown Artist",
      coverArtUrl: detail?.coverArtUrl || null,
      playedAt: track.playedAt,
      positionSeconds: track.positionSeconds,
      durationSeconds: track.durationSeconds,
      isCompleted: track.isCompleted,
    };
  });
}

export async function clearListeningHistory() {
  const { data } = await api.delete(`/player/history`);
  return data;
}