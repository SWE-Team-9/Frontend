import { create } from "zustand";
import {
  getPlaybackState,
  getPlaybackSource,
  getPreviewSource,
} from "@/src/services/playerService";

export interface Track {
  trackId: string;
  title: string;
  artist: string;
  cover: string;
  duration?: number;
  genre?: string;
  plays?: number;
  accessState?: "PLAYABLE" | "BLOCKED" | "PREVIEW";
  streamUrl?: string;
  previewUrl?: string;
}

let _audio: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = "auto";
  }
  return _audio;
}

export const mockTracks: Track[] = [
  {
    trackId: "1",
    title: "Neon Pulse",
    artist: "Synthwave Ghost",
    cover: "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=200&h=200&fit=crop",
    duration: 237,
    genre: "Synthwave",
    plays: 184932,
    accessState: "PLAYABLE",
  },
  {
    trackId: "2",
    title: "Midnight Circuit",
    artist: "Electric Void",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    duration: 312,
    genre: "Electronic",
    plays: 92841,
    accessState: "PLAYABLE",
  },
  {
    trackId: "3",
    title: "Coastal Drive",
    artist: "Lo-Fi Horizon",
    cover: "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=200&h=200&fit=crop",
    duration: 198,
    genre: "Lo-Fi",
    plays: 421008,
    accessState: "PLAYABLE",
  },
  {
    trackId: "4",
    title: "Urban Echoes",
    artist: "City Pulse Collective",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
    duration: 275,
    genre: "Hip-Hop",
    plays: 310245,
    accessState: "PLAYABLE",
  },
  {
    trackId: "5",
    title: "Digital Rain",
    artist: "Neon Frequencies",
    cover: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=200&fit=crop",
    duration: 341,
    genre: "Ambient",
    plays: 67293,
    accessState: "PLAYABLE",
  },
];

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;           // 0–100 in store; normalized to 0–1 before touching audio
  currentTime: number;      // driven by audio element events, not an interval
  duration: number;         //  sourced from audio element
  trackIndex: number;
  tracks: Track[];
  isProcessing: boolean;
  isResolvingPlayback: boolean;
  accessState: "PLAYABLE" | "BLOCKED" | "PREVIEW" | null;
  accessReason: string | null;
  streamError: string | null;
  isPlayerVisible: boolean;

  resetPlaybackStatus: () => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setTrack: (track: Track) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  //  fetch streamUrl from backend, then start playback
  fetchAndPlay: (track: Track) => Promise<void>;
  seekTo: (time: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 75,
  currentTime: 0,
  duration: 0,
  trackIndex: -1,
  tracks: mockTracks,
  isProcessing: false,
  isResolvingPlayback: false,
  accessState: null,
  accessReason: null,
  streamError: null,
  isPlayerVisible: false,

  resetPlaybackStatus: () =>
    set({
      isProcessing: false,
      isResolvingPlayback: false,
      accessState: null,
      accessReason: null,
      streamError: null,
    }),

  play: () => {
    const { currentTrack, accessState } = get();
    const audio = getAudioElement();

    if (!audio || !currentTrack) return;
    if (accessState === "BLOCKED") return;
    if (!audio.src) return;

    if (!audio.src) {
      set({
        isPlaying: false,
        streamError: "No audio source available",
      });
      return;
    }
    console.log("🎵 Trying to play:", audio.src);
    audio.play()
      .then(() => set({ isPlaying: true }))
      .catch(() => set({ isPlaying: false }));
  },

  pause: () => {
    const audio = getAudioElement();
    if (!audio) return;

    audio.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    const { isPlaying, currentTrack } = get();

    if (!currentTrack) return;

    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  // Use fetchAndPlay for real API; setTrack is kept for mock/offline use
  setTrack: (track: Track) => {
    const index = get().tracks.findIndex((t) => t.trackId === track.trackId);

    set({
      currentTrack: track,
      trackIndex: index,
      isPlaying: false,
      currentTime: 0,
      duration: track.duration ?? 0,
      accessState: track.accessState ?? null,
      accessReason: null,
      streamError: null,
      isProcessing: false,
      isResolvingPlayback: false,
      isPlayerVisible: true,
    });
  },

  //  fetch streamUrl, handle 409 and accessState
  fetchAndPlay: async (track: Track) => {
    const { currentTrack } = get();

    if (currentTrack?.trackId === track.trackId && get().isPlaying) {
      return;
    }
    const audio = getAudioElement();

    set({
      currentTrack: track,
      isPlayerVisible: true,
      isPlaying: false,
      currentTime: 0,
      duration: track.duration ?? 0,
      isProcessing: false,
      isResolvingPlayback: true,
      accessState: null,
      accessReason: null,
      streamError: null,
    });

    try {
      const stateData = await getPlaybackState(track.trackId);
      const accessState = stateData.accessState as "PLAYABLE" | "BLOCKED" | "PREVIEW";
      const accessReason =
        typeof stateData.reason === "string" ? stateData.reason : null;

      // 2) Blocked: do not continue
      if (accessState === "BLOCKED") {
        if (audio) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        }

        set({
          accessState: "BLOCKED",
          accessReason,
          isResolvingPlayback: false,
          isPlaying: false,
        });
        return;
      }

      // 3) Load the appropriate URL
      let playbackUrl = "";
      let previewUrl: string | undefined;
      let streamUrl: string | undefined;

      if (accessState === "PLAYABLE") {
        let sourceData;
        try {
          sourceData = await getPlaybackSource(track.trackId);
        } catch (error: unknown) {
          const status =
            typeof error === "object" &&
              error !== null &&
              "response" in error &&
              typeof (error as { response?: { status?: number } }).response?.status === "number"
              ? (error as { response?: { status?: number } }).response?.status
              : undefined;

          if (status === 409) {
            if (audio) {
              audio.pause();
              audio.removeAttribute("src");
              audio.load();
            }

            set({
              isProcessing: true,
              isResolvingPlayback: false,
              isPlaying: false,
            });
            return;
          }

          set({
            isResolvingPlayback: false,
            streamError: `Failed to load track source (${status ?? "unknown"})`,
          });
          return;
        }

        if (!sourceData.streamUrl) {
          set({
            isResolvingPlayback: false,
            streamError: "No stream URL returned from server",
          });
          return;
        }

        streamUrl = sourceData.streamUrl;
        playbackUrl = sourceData.streamUrl;
      }
      if (accessState === "PREVIEW") {
        let previewData;
        try {
          previewData = await getPreviewSource(track.trackId);
        } catch (error: unknown) {
          const status =
            typeof error === "object" &&
              error !== null &&
              "response" in error &&
              typeof (error as { response?: { status?: number } }).response?.status === "number"
              ? (error as { response?: { status?: number } }).response?.status
              : undefined;

          set({
            isResolvingPlayback: false,
            streamError: `Failed to load preview (${status ?? "unknown"})`,
          });
          return;
        }

        if (!previewData.previewUrl) {
          set({
            isResolvingPlayback: false,
            streamError: "No preview URL returned from server",
          });
          return;
        }

        previewUrl = previewData.previewUrl;
        playbackUrl = previewData.previewUrl;
      }

      if (!playbackUrl) {
        set({
          isResolvingPlayback: false,
          streamError: "No playback URL returned for this track",
        });
        return;
      }

      const index = get().tracks.findIndex((t) => t.trackId === track.trackId);
      const enrichedTrack: Track = {
        ...track,
        accessState,
        streamUrl,
        previewUrl,
      };

      set({
        currentTrack: enrichedTrack,
        trackIndex: index,
        accessState,
        accessReason,
        isProcessing: false,
        isResolvingPlayback: false,
        streamError: null,
        currentTime: 0,
      });

      if (!audio) {
        set({
          streamError: "Audio player is unavailable in this browser",
          isPlaying: false,
        });
        return;
      }

      audio.pause();
      audio.src = playbackUrl;
      audio.preload = "auto";
      audio.load();
      audio.currentTime = 0;
      audio.volume = get().volume / 100;

      try {
        await audio.play();
        set({ isPlaying: true });
      } catch {
        set({
          isPlaying: false,
          streamError: "Playback failed",
        });
      }
      // } catch {
      //   set({
      //     isResolvingPlayback: false,
      //     isProcessing: false,
      //     isPlaying: false,
      //     streamError: "Network error loading track",
      //   });
      // }
      //////////////////////////////////mock////////////////////////////////////////////////////////////
    } catch {
      const { currentTrack, isPlaying } = get();

      // 🚨 prevent infinite restart loop
      if (currentTrack?.trackId === track.trackId && isPlaying) {
        return;
      }
      console.warn("⚠️ Backend unavailable — using mock playback");

      // fallback to mock playback
      const index = get().tracks.findIndex((t) => t.trackId === track.trackId);

      const fallbackTrack: Track = {
        ...track,
        accessState: "PLAYABLE",
        streamUrl:
          "/Audio/Scarborough_Fair.mp3",
      };

      set({
        currentTrack: fallbackTrack,
        trackIndex: index,
        accessState: "PLAYABLE",
        accessReason: null,
        isProcessing: false,
        isResolvingPlayback: false,
        streamError: null,
        currentTime: 0,
      });

      const audio = getAudioElement();
      if (!audio) return;

      audio.pause();
      audio.src = fallbackTrack.streamUrl!;
      audio.preload = "auto";
      audio.load();
      audio.currentTime = 0;
      audio.volume = get().volume / 100;

      audio
        .play()
        .then(() => set({ isPlaying: true }))
        .catch(() =>
          set({
            isPlaying: false,
            streamError: "Playback failed",
          })
        );
    }
    //////////////////////////////////mock////////////////////////////////////////////////////////////

  },

  nextTrack: () => {
    const { tracks, trackIndex } = get();
    if (!tracks.length) return;

    const nextIndex = trackIndex < 0 ? 0 : (trackIndex + 1) % tracks.length;
    get().fetchAndPlay(tracks[nextIndex]);
  },

  previousTrack: () => {
    const { tracks, trackIndex, currentTime } = get();
    const audio = getAudioElement();

    if (!tracks.length) return;

    if (currentTime > 3) {
      if (audio) audio.currentTime = 0;
      set({ currentTime: 0 });
      return;
    }

    const prevIndex =
      trackIndex <= 0 ? tracks.length - 1 : trackIndex - 1;

    get().fetchAndPlay(tracks[prevIndex]);
  },

  //: store keeps 0–100; audio element gets 0–1
  setVolume: (volume: number) => {
    const audio = getAudioElement();
    if (audio) audio.volume = volume / 100;
    set({ volume });
  },

  //  seek on the actual audio element, not just the store
  setCurrentTime: (time: number) => set({ currentTime: time }),
  seekTo: (time: number) => {
    const audio = getAudioElement();
    if (audio && isFinite(time)) {
      audio.currentTime = time;
    }
    set({ currentTime: time });
  },
  setDuration: (duration: number) => set({ duration }),
}));