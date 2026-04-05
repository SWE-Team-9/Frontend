import api from "@/src/services/api";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

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

export interface RecentTrackResponseItem {
    trackId: string;
    title: string;
    artist: {
        id: string;
        display_name: string;
    };
    lastPlayedAt: string;
    lastPositionSeconds: number;
}

export interface RecentlyPlayedResponse {
    page: number;
    limit: number;
    total: number;
    tracks: RecentTrackResponseItem[];
}

// ===============================
//  MOCK DATA
// ===============================

const MOCK_RECENT_TRACKS: RecentTrackResponseItem[] = [
    {
        trackId: "trk_001",
        title: "Layali",
        artist: { id: "usr_1", display_name: "Ahmed Hassan" },
        lastPlayedAt: "2026-03-07T17:15:00Z",
        lastPositionSeconds: 97,
    },
    {
        trackId: "trk_002",
        title: "Neon Pulse",
        artist: { id: "usr_2", display_name: "Synthwave Ghost" },
        lastPlayedAt: "2026-03-07T15:42:00Z",
        lastPositionSeconds: 120,
    },
    {
        trackId: "trk_003",
        title: "Midnight Circuit",
        artist: { id: "usr_3", display_name: "Electric Void" },
        lastPlayedAt: "2026-03-07T14:00:00Z",
        lastPositionSeconds: 200,
    },
    {
        trackId: "trk_004",
        title: "Coastal Drive",
        artist: { id: "usr_4", display_name: "Lo-Fi Horizon" },
        lastPlayedAt: "2026-03-06T22:30:00Z",
        lastPositionSeconds: 56,
    },
    {
        trackId: "trk_005",
        title: "Urban Echoes",
        artist: { id: "usr_5", display_name: "City Pulse Collective" },
        lastPlayedAt: "2026-03-06T20:00:00Z",
        lastPositionSeconds: 275,
    },
    {
        trackId: "trk_006",
        title: "Digital Rain",
        artist: { id: "usr_6", display_name: "Neon Frequencies" },
        lastPlayedAt: "2026-03-06T18:15:00Z",
        lastPositionSeconds: 341,
    },
];

// ===============================
//  PLAYBACK STATE / SOURCE
// ===============================

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

// ===============================
//  GET RECENTLY PLAYED
// ===============================

export async function getRecentlyPlayed(limit = 6, page = 1): Promise<RecentlyPlayedResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        const start = (page - 1) * limit;
        const sliced = MOCK_RECENT_TRACKS.slice(start, start + limit);
        return {
            page,
            limit,
            total: MOCK_RECENT_TRACKS.length,
            tracks: sliced,
        };
    }

    const { data } = await api.get<RecentlyPlayedResponse>(
        `/player/history/recent?page=${page}&limit=${limit}`
    );
    return data;
}
