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

export interface SavePlaybackProgressBody {
    positionSeconds: number;
    durationSeconds: number;
    isCompleted: boolean;
}

export interface SavePlaybackProgressResponse {
    message: string;
    trackId: string;
    positionSeconds: number;
}

export interface MarkTrackPlayedResponse {
    message: string;
    trackId: string;
    playCount: number;
}

export interface ResumePositionResponse {
    trackId: string;
    resumePositionSeconds: number;
}

export interface QueueTrackItem {
    trackId: string;
    title: string;
}

export interface PlayerSessionResponse {
    currentTrack: QueueTrackItem | null;
    positionSeconds: number;
    isPlaying: boolean;
    volume: number;
    queue: QueueTrackItem[];
}

export interface UpdatePlayerSessionBody {
    currentTrackId: string | null;
    positionSeconds: number;
    isPlaying: boolean;
    volume: number;
    queueTrackIds: string[];
}

export interface UpdatePlayerSessionResponse {
    message: string;
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

let MOCK_PLAYER_SESSION: PlayerSessionResponse = {
    currentTrack: null,
    positionSeconds: 0,
    isPlaying: false,
    volume: 0.75,
    queue: [],
};

const MOCK_RESUME_POSITIONS: Record<string, number> = {
    trk_001: 97,
    trk_002: 120,
    trk_003: 200,
    trk_004: 56,
    trk_005: 275,
    trk_006: 341,
};

// ===============================
//  PLAYBACK STATE / SOURCE
// ===============================

export async function getPlaybackState(trackId: string): Promise<PlaybackStateResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 150));
        return {
            trackId,
            accessState: "PLAYABLE",
            reason: null,
        };
    }

    const { data } = await api.get(`/player/tracks/${trackId}/state`);
    return data;
}

export async function getPlaybackSource(trackId: string): Promise<PlaybackSourceResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 150));
        return {
            trackId,
            streamUrl: "/Audio/Scarborough_Fair.mp3",
            accessState: "PLAYABLE",
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        };
    }

    const { data } = await api.get(`/player/tracks/${trackId}/source`);
    return data;
}

export async function getPreviewSource(trackId: string): Promise<PreviewSourceResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 150));
        return {
            trackId,
            previewUrl: "/Audio/Scarborough_Fair.mp3",
            previewDurationSeconds: 30,
            accessState: "PREVIEW",
        };
    }

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


export async function savePlaybackProgress(
    trackId: string,
    body: SavePlaybackProgressBody
): Promise<SavePlaybackProgressResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 200));

        MOCK_RESUME_POSITIONS[trackId] = body.isCompleted ? 0 : body.positionSeconds;

        if (MOCK_PLAYER_SESSION.currentTrack?.trackId === trackId) {
            MOCK_PLAYER_SESSION.positionSeconds = body.isCompleted ? 0 : body.positionSeconds;
        }

        return {
            message: "Playback progress saved successfully",
            trackId,
            positionSeconds: body.positionSeconds,
        };
    }

    const { data } = await api.post(`/player/tracks/${trackId}/progress`, body);
    return data;
}

export async function markTrackPlayed(trackId: string): Promise<MarkTrackPlayedResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 200));
        return {
            message: "Play event recorded successfully",
            trackId,
            playCount: Math.floor(Math.random() * 5000) + 1,
        };
    }

    const { data } = await api.post(`/player/tracks/${trackId}/play`);
    return data;
}

export async function getResumePosition(trackId: string): Promise<ResumePositionResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 150));
        return {
            trackId,
            resumePositionSeconds: MOCK_RESUME_POSITIONS[trackId] ?? 0,
        };
    }

    const { data } = await api.get(`/player/tracks/${trackId}/resume`);
    return data;
}

export async function getPlayerSession(): Promise<PlayerSessionResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 200));
        return MOCK_PLAYER_SESSION;
    }

    const { data } = await api.get(`/player/session`);
    return data;
}

export async function updatePlayerSession(
    body: UpdatePlayerSessionBody
): Promise<UpdatePlayerSessionResponse> {
    if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 200));

        MOCK_PLAYER_SESSION = {
            currentTrack: body.currentTrackId
                ? {
                    trackId: body.currentTrackId,
                    title: `Mock Track ${body.currentTrackId}`,
                }
                : null,
            positionSeconds: body.positionSeconds,
            isPlaying: body.isPlaying,
            volume: body.volume,
            queue: body.queueTrackIds.map((id) => ({
                trackId: id,
                title: `Mock Track ${id}`,
            })),
        };

        return {
            message: "Player session updated successfully",
        };
    }

    const { data } = await api.put(`/player/session`, body);
    return data;
}