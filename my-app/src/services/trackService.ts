import api from "@/src/services/api";

export interface TrackDetails {
    trackId: string;
    title: string;
    artist: string;
    artistId: string;
    artistHandle?: string;
    artistAvatarUrl?: string | null;
    coverArtUrl?: string | null;
    durationMs?: number;
    genre?: string;
}

export async function getTrackDetails(trackId: string) {
    const { data } = await api.get<TrackDetails>(`/tracks/${trackId}`);
    return data;
}