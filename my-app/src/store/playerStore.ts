import { create } from "zustand";
import {
  getPlaybackState,
  getPlaybackSource,
  getPreviewSource,
  savePlaybackProgress,
  markTrackPlayed,
  getResumePosition,
  getPlayerSession,
  updatePlayerSession,
} from "@/src/services/playerService";
import {
  getOfflineCacheEntry,
  createObjectUrl,
} from "@/src/services/offlineAudioCache";

export interface Track {
  trackId: string;
  title: string;
  artist: string;
  artistId: string;
  artistHandle?: string;
  artistAvatarUrl?: string | null;
  cover: string;
  duration?: number;
  genre?: string;
  plays?: number;
  accessState?: "PLAYABLE" | "BLOCKED" | "PREVIEW";
  streamUrl?: string;
  previewUrl?: string;
}

export type LoopMode = "OFF" | "ALL" | "ONE";

let _audio: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = "auto";
  }
  return _audio;
}

function getRandomIndexExcluding(length: number, excludeIndex: number): number {
  if (length <= 1) return excludeIndex;

  let randomIndex = excludeIndex;
  while (randomIndex === excludeIndex) {
    randomIndex = Math.floor(Math.random() * length);
  }
  return randomIndex;
}

export const mockTracks: Track[] = [
  {
    trackId: "trk_001",
    title: "Neon Pulse",
    artist: "Synthwave Ghost",
    artistId: "usr_2",
    artistHandle: "synthwaveghost",
    artistAvatarUrl:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop",
    cover:
      "https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=200&h=200&fit=crop",
    duration: 237,
    genre: "Synthwave",
    plays: 184932,
    accessState: "PLAYABLE",
  },
  {
    trackId: "trk_002",
    title: "Midnight Circuit",
    artist: "Electric Void",
    artistId: "usr_3",
    artistHandle: "electricvoid",
    artistAvatarUrl: null,
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    duration: 312,
    genre: "Electronic",
    plays: 92841,
    accessState: "PLAYABLE",
  },
  {
    trackId: "trk_003",
    title: "Coastal Drive",
    artist: "Lo-Fi Horizon",
    artistId: "usr_4",
    artistHandle: "lofihorizon",
    artistAvatarUrl: null,
    cover:
      "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=200&h=200&fit=crop",
    duration: 198,
    genre: "Lo-Fi",
    plays: 421008,
    accessState: "PLAYABLE",
  },
  {
    trackId: "trk_004",
    title: "Urban Echoes",
    artist: "City Pulse Collective",
    artistId: "usr_5",
    artistHandle: "citypulsecollective",
    artistAvatarUrl: null,
    cover:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop",
    duration: 275,
    genre: "Hip-Hop",
    plays: 310245,
    accessState: "PLAYABLE",
  },
  {
    trackId: "trk_005",
    title: "Digital Rain",
    artist: "Neon Frequencies",
    artistId: "usr_6",
    artistHandle: "neonfrequencies",
    artistAvatarUrl: null,
    cover:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=200&fit=crop",
    duration: 341,
    genre: "Ambient",
    plays: 67293,
    accessState: "PLAYABLE",
  },
];

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;           // 0–100 in store
  currentTime: number;
  duration: number;
  trackIndex: number;
  tracks: Track[];

  isShuffleOn: boolean;
  loopMode: LoopMode;

  queue: Track[];
  hasRecordedPlay: boolean;
  hydratedFromSession: boolean;

  isProcessing: boolean;
  isResolvingPlayback: boolean;
  accessState: "PLAYABLE" | "BLOCKED" | "PREVIEW" | null;
  accessReason: string | null;
  streamError: string | null;
  isPlayerVisible: boolean;

  resetPlaybackStatus: () => void;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  setTrack: (track: Track) => void;
  setTracks: (tracks: Track[]) => void;
  setQueue: (queue: Track[]) => void;
  toggleShuffle: () => void;
  cycleLoopMode: () => void;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  fetchAndPlay: (track: Track) => Promise<void>;
  seekTo: (time: number) => Promise<void>;

  loadResumePosition: (trackId: string) => Promise<number>;
  recordPlayEvent: (trackId: string) => Promise<void>;
  persistProgress: () => Promise<void>;
  hydratePlayerSession: () => Promise<void>;
  persistPlayerSession: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 75,
  currentTime: 0,
  duration: 0,
  trackIndex: -1,
  tracks: mockTracks,
  isShuffleOn: false,
  loopMode: "OFF",
  queue: [],
  hasRecordedPlay: false,
  hydratedFromSession: false,
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

  loadResumePosition: async (trackId: string) => {
    try {
      const data = await getResumePosition(trackId);
      const resumeTime = data.resumePositionSeconds ?? 0;

      const audio = getAudioElement();
      if (audio && Number.isFinite(resumeTime)) {
        audio.currentTime = resumeTime;
      }

      set({ currentTime: resumeTime });
      return resumeTime;
    } catch {
      set({ currentTime: 0 });
      return 0;
    }
  },

  recordPlayEvent: async (trackId: string) => {
    const { hasRecordedPlay } = get();
    console.log("[playerStore] recordPlayEvent called", { trackId, hasRecordedPlay });

    if (hasRecordedPlay) {
      console.log("[playerStore] recordPlayEvent skipped");
      return;
    }

    try {
      console.log("[playerStore] sending play event for", trackId);
      await markTrackPlayed(trackId);
      set({ hasRecordedPlay: true });
      console.log("[playerStore] play event saved for", trackId);
    } catch (error) {
      console.error("Failed to record play event:", error);
    }
  },


  persistProgress: async () => {
    const { currentTrack, currentTime } = get();
    if (!currentTrack) return;

    const audio = getAudioElement();
    const durationSeconds =
      audio && Number.isFinite(audio.duration) ? Math.floor(audio.duration) : 0;

    const safeCurrentTime = Math.floor(currentTime);
    const isCompleted =
      durationSeconds > 0 && safeCurrentTime >= durationSeconds - 2;

    console.log("[playerStore] persistProgress", {
      trackId: currentTrack.trackId,
      positionSeconds: safeCurrentTime,
      durationSeconds,
      isCompleted,
    });

    try {
      await savePlaybackProgress(currentTrack.trackId, {
        positionSeconds: safeCurrentTime,
        durationSeconds,
        isCompleted,
      });
      console.log("[playerStore] persistProgress success");
    } catch (error) {
      console.error("Failed to save playback progress:", error);
    }
  },

  persistPlayerSession: async () => {
    const {
      currentTrack,
      currentTime,
      isPlaying,
      volume,
      queue,
      isShuffleOn,
      loopMode,
    } = get();
    const payload = {
      currentTrackId: currentTrack?.trackId ?? null,
      positionSeconds: Math.floor(currentTime),
      isPlaying,
      volume: volume / 100,
      queueTrackIds: queue.map((track) => track.trackId),
      shuffle: isShuffleOn,
      repeatMode: loopMode,
    };

    console.log("[playerStore] persistPlayerSession payload", payload);

    try {
      await updatePlayerSession(payload);
      console.log("[playerStore] persistPlayerSession success");
    } catch (error) {
      console.error("Failed to persist player session:", error);
    }
  },

  hydratePlayerSession: async () => {
    try {
      console.log("[playerStore] hydratePlayerSession started");
      const data = await getPlayerSession();
      console.log("[playerStore] hydratePlayerSession response:", data);
      const { tracks } = get();

      const restoredCurrentTrack = data.currentTrack
        ? tracks.find((t) => t.trackId === data.currentTrack?.trackId) ?? null
        : null;

      const restoredQueue = (data.queue ?? [])
        .map((item) => {
          const found = tracks.find((t) => t.trackId === item.trackId);
          if (found) return found;

          return {
            trackId: item.trackId,
            title: item.title,
            artist: "Unknown Artist",
            artistId: "usr_unknown",
            artistHandle: undefined,
            artistAvatarUrl: null,
            cover: "/images/track-placeholder.png",
          } as Track;
        });
      console.log("[playerStore] restoring session track:", restoredCurrentTrack);
      set({
        currentTrack: restoredCurrentTrack,
        queue: restoredQueue,
        currentTime: data.positionSeconds ?? 0,
        isPlaying: false,
        volume: typeof data.volume === "number" ? Math.round(data.volume * 100) : 75,
        hydratedFromSession: true,
        isPlayerVisible: !!restoredCurrentTrack,
        trackIndex: restoredCurrentTrack
          ? tracks.findIndex((t) => t.trackId === restoredCurrentTrack.trackId)
          : -1,
        isShuffleOn: !!data.shuffle,
        loopMode: data.repeatMode ?? "OFF",
      });

      const audio = getAudioElement();
      if (audio) {
        audio.volume = (typeof data.volume === "number" ? data.volume : 0.75);
      }
    } catch (error) {
      console.error("Failed to hydrate player session:", error);
      set({ hydratedFromSession: true });
    }
  },

  play: async () => {
    const { currentTrack, accessState, recordPlayEvent, persistPlayerSession } = get();
    const audio = getAudioElement();

    if (!audio || !currentTrack) return;
    if (accessState === "BLOCKED") return;
    if (!audio.src) {
      set({
        isPlaying: false,
        streamError: "No audio source available",
      });
      return;
    }

    try {
      await audio.play();

      set({
        isPlaying: true,
        streamError: null,
      });

      await recordPlayEvent(currentTrack.trackId);
      await persistPlayerSession();
    } catch (error: unknown) {
      const errorName =
        error instanceof DOMException ? error.name : undefined;

      if (
        (errorName === "AbortError" || errorName === "NotAllowedError") &&
        (!audio.paused || audio.currentTime > 0)
      ) {
        set({
          isPlaying: true,
          streamError: null,
        });
        return;
      }

      console.error("play() failed:", error);

      set({
        isPlaying: false,
        streamError: "Playback failed",
      });
    }
  },

  pause: async () => {
    const audio = getAudioElement();
    if (!audio) return;

    audio.pause();
    set({ isPlaying: false });

    await get().persistProgress();
    await get().persistPlayerSession();
  },

  toggle: async () => {
    const { isPlaying, currentTrack } = get();

    if (!currentTrack) return;

    if (isPlaying) {
      await get().pause();
    } else {
      await get().play();
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
      hasRecordedPlay: false,
    });
  },

  setTracks: (tracks) => set({ tracks }),
  setQueue: (queue) => set({ queue }),

  toggleShuffle: () => {
    const nextValue = !get().isShuffleOn;
    set({ isShuffleOn: nextValue });
    void get().persistPlayerSession();
  },

  cycleLoopMode: () => {
    const current = get().loopMode;
    const next: LoopMode =
      current === "OFF" ? "ALL" : current === "ALL" ? "ONE" : "OFF";

    set({ loopMode: next });
    void get().persistPlayerSession();
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
      hasRecordedPlay: false,
    });

    // ── Offline cache check ────────────────────────────────────────
    // If this track has been saved for offline listening, play it
    // directly from IndexedDB without any network request.
    try {
      const cachedEntry = await getOfflineCacheEntry(track.trackId);
      if (cachedEntry) {
        const objectUrl = createObjectUrl(cachedEntry);

        const enrichedTrack: Track = {
          ...track,
          accessState: "PLAYABLE",
          streamUrl: objectUrl,
        };

        set({
          currentTrack: enrichedTrack,
          trackIndex: get().tracks.findIndex((t) => t.trackId === track.trackId),
          accessState: "PLAYABLE",
          accessReason: null,
          isProcessing: false,
          isResolvingPlayback: false,
          streamError: null,
          currentTime: 0,
          hasRecordedPlay: false,
        });

        if (!audio) {
          set({ streamError: "Audio player is unavailable in this browser", isPlaying: false });
          return;
        }

        audio.pause();
        audio.src = objectUrl;
        audio.preload = "auto";
        audio.load();
        audio.currentTime = 0;
        set({ currentTime: 0 });
        audio.volume = get().volume / 100;

        try {
          await audio.play();
          set({ isPlaying: true, streamError: null });
          await get().recordPlayEvent(track.trackId);
          await get().persistPlayerSession();
        } catch (playErr: unknown) {
          const errName = playErr instanceof DOMException ? playErr.name : undefined;
          if ((errName === "AbortError" || errName === "NotAllowedError") &&
              (!audio.paused || audio.currentTime > 0)) {
            set({ isPlaying: true, streamError: null });
            return;
          }
          set({ isPlaying: false, streamError: "Playback failed" });
        }
        return;
      }
    } catch {
      // Cache read failure is non-fatal — fall through to network playback
    }

    try {
      const stateData = await getPlaybackState(track.trackId);
      const accessState = stateData.accessState as "PLAYABLE" | "BLOCKED" | "PREVIEW";
      const accessReason =
        typeof stateData.reason === "string" ? stateData.reason : null;

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

        await get().persistPlayerSession();
        return;
      }

      let playbackUrl = "";
      let previewUrl: string | undefined;
      let streamUrl: string | undefined;

      if (accessState === "PLAYABLE") {
        try {
          const sourceData = await getPlaybackSource(track.trackId);

          if (!sourceData.streamUrl) {
            set({
              isResolvingPlayback: false,
              streamError: "No stream URL returned from server",
            });
            return;
          }

          streamUrl = sourceData.streamUrl;
          playbackUrl = sourceData.streamUrl;
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

          throw error;
        }
      }

      if (accessState === "PREVIEW") {
        const previewData = await getPreviewSource(track.trackId);

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
        hasRecordedPlay: false,
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
      set({ currentTime: 0 });
      audio.volume = get().volume / 100;

      try {
        await audio.play();

        set({
          isPlaying: true,
          streamError: null,
        });

        await get().recordPlayEvent(track.trackId);
        await get().persistPlayerSession();
      } catch (error: unknown) {
        const errorName =
          error instanceof DOMException ? error.name : undefined;

        // Ignore aborted/interrupted play requests if audio actually starts/started
        if (
          errorName === "AbortError" ||
          errorName === "NotAllowedError"
        ) {
          if (!audio.paused || audio.currentTime > 0) {
            set({
              isPlaying: true,
              streamError: null,
            });
            return;
          }
        }

        console.error("audio.play() failed:", error);

        set({
          isPlaying: false,
          streamError: "Playback failed",
        });
      }
    } catch (error) {
      console.error("fetchAndPlay failed:", error);

      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }

      set({
        isResolvingPlayback: false,
        isProcessing: false,
        isPlaying: false,
        streamError: "Failed to load track playback",
      });
    }
  },

  nextTrack: async () => {
    const { tracks, trackIndex, isShuffleOn, loopMode, currentTrack } = get();
    if (!tracks.length) return;

    // Repeat current track
    if (loopMode === "ONE" && currentTrack) {
      const audio = getAudioElement();
      if (audio) audio.currentTime = 0;
      set({ currentTime: 0 });
      await get().fetchAndPlay(currentTrack);
      return;
    }

    let nextIndex: number;

    if (isShuffleOn) {
      const currentIndex =
        trackIndex >= 0
          ? trackIndex
          : currentTrack
            ? tracks.findIndex((t) => t.trackId === currentTrack.trackId)
            : 0;

      nextIndex = getRandomIndexExcluding(tracks.length, currentIndex);
    } else {
      const isLastTrack = trackIndex >= tracks.length - 1;

      if (isLastTrack) {
        if (loopMode === "ALL") {
          nextIndex = 0;
        } else {
          const audio = getAudioElement();
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }

          set({
            isPlaying: false,
            currentTime: 0,
          });

          await get().persistProgress();
          await get().persistPlayerSession();
          return;
        }
      } else {
        nextIndex = trackIndex < 0 ? 0 : trackIndex + 1;
      }
    }

    await get().fetchAndPlay(tracks[nextIndex]);
  },

  previousTrack: async () => {
    const { tracks, trackIndex, currentTime, isShuffleOn, loopMode, currentTrack } = get();
    const audio = getAudioElement();

    if (!tracks.length) return;

    if (currentTime > 3) {
      if (audio) audio.currentTime = 0;
      set({ currentTime: 0 });
      await get().persistProgress();
      await get().persistPlayerSession();
      return;
    }

    let prevIndex: number;

    if (isShuffleOn) {
      const currentIndex =
        trackIndex >= 0
          ? trackIndex
          : currentTrack
            ? tracks.findIndex((t) => t.trackId === currentTrack.trackId)
            : 0;

      prevIndex = getRandomIndexExcluding(tracks.length, currentIndex);
    } else {
      const isFirstTrack = trackIndex <= 0;

      if (isFirstTrack) {
        prevIndex = loopMode === "ALL" ? tracks.length - 1 : 0;
      } else {
        prevIndex = trackIndex - 1;
      }
    }

    await get().fetchAndPlay(tracks[prevIndex]);
  },

  //: store keeps 0–100; audio element gets 0–1
  setVolume: async (volume: number) => {
    const audio = getAudioElement();
    if (audio) audio.volume = volume / 100;
    set({ volume });
    await get().persistPlayerSession();
  },

  //  seek on the actual audio element, not just the store
  setCurrentTime: (time: number) => set({ currentTime: time }),
  seekTo: async (time: number) => {
    const audio = getAudioElement();
    if (audio && Number.isFinite(time)) {
      audio.currentTime = time;
    }

    set({ currentTime: time });

    await get().persistPlayerSession();
    await get().persistProgress();
  },
  setDuration: (duration: number) => set({ duration }),
}));