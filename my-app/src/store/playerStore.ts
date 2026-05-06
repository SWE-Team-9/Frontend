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
  loadQueue,
  requestNextTrack,
  requestPreviousTrack,
  getQueueState,
  jumpToQueueTrack,
  addQueueItem,
  removeQueueItem,
  moveQueueItem,
  clearQueue,
  type LoadQueueBody,
  type QueueTrackMetadata,
  type AdSlot,
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
  accessState?: "PLAYABLE" | "BLOCKED" | "PREVIEW" | "PROCESSING";
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

const FALLBACK_COVER = "/images/track-placeholder.png";

function mapQueueMetaToTrack(meta: QueueTrackMetadata): Track {
  return {
    trackId: meta.trackId,
    title: meta.title,
    artist: meta.artist,
    artistId: meta.artistId,
    artistHandle: meta.artistHandle ?? undefined,
    artistAvatarUrl: meta.artistAvatarUrl,
    cover: meta.cover ?? FALLBACK_COVER,
    duration: meta.duration ?? undefined,
    genre: meta.genre ?? undefined,
  };
}

function uniqueTrackIds(trackIds: string[]): string[] {
  return Array.from(new Set(trackIds.filter(Boolean)));
}

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

  // Backend-managed queue state
  currentQueueIndex: number;
  queueLength: number;
  /** null for paid-tier users who never receive ads. */
  tracksUntilAd: number | null;

  // Ad slot state
  currentAd: AdSlot | null;
  isPlayingAd: boolean;
  /** Elapsed seconds for text-only (no audioUrl) ads, updated every second by PlayerAudioSync */
  adElapsedSeconds: number;

  isProcessing: boolean;
  isResolvingPlayback: boolean;
  accessState: "PLAYABLE" | "BLOCKED" | "PREVIEW" | "PROCESSING" | null;
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

  /**
   * Load a queue context onto the backend and begin playing the start track.
   * This is the preferred entry-point for playlist/artist/feed playback.
   */
  loadQueueContext: (body: LoadQueueBody) => Promise<void>;

  /**
   * Preferred action for any component that plays one track from a visible list.
   * Examples: trending row, history list, profile tracks, feed, search results.
   */
  playTrackFromContext: (args: {
    track: Track;
    contextTrackIds?: string[];
    contextType?: "TRACK" | "CONTEXT_IDS" | "PLAYLIST" | "ARTIST";
    contextId?: string;
    shuffle?: boolean;
  }) => Promise<void>;

  /**
   * Add a track immediately after the current queue item.
   * Used by "Add to Next Up" buttons.
   */
  addTrackToNextUp: (trackId: string) => Promise<void>;

  /**
   * Queue panel actions.
   */
  jumpToTrackInQueue: (trackId: string) => Promise<void>;
  removeTrackFromQueue: (position: number) => Promise<void>;
  moveTrackInQueue: (fromPosition: number, toPosition: number) => Promise<void>;
  clearBackendQueue: () => Promise<void>;
  refreshBackendQueueState: () => Promise<void>;

  /**
   * Play a single track.  If called from next/prev navigation `_fromQueue`
   * should be `true` to skip re-loading the backend queue.
   */
  fetchAndPlay: (track: Track, _fromQueue?: boolean) => Promise<void>;

  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seekTo: (time: number) => Promise<void>;

  isQueuePanelOpen: boolean;
  toggleQueuePanel: () => void;
  /** Incremented every time a new queue is loaded on the backend.
   *  QueuePanel subscribes to this to know when to re-fetch. */
  queueVersion: number;

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
  currentQueueIndex: 0,
  queueLength: 0,
  tracksUntilAd: null,
  currentAd: null,
  isPlayingAd: false,
  adElapsedSeconds: 0,
  isQueuePanelOpen: false,
  queueVersion: 0,
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
      isShuffleOn,
      loopMode,
    } = get();
    // Do NOT include currentTrackId when it is null — the backend DTO's
    // @IsUUID validator rejects explicit null and returns 400.
    const payload: {
      currentTrackId?: string;
      positionSeconds: number;
      isPlaying: boolean;
      volume: number;
      shuffle: boolean;
      repeatMode: "OFF" | "ALL" | "ONE";
    } = {
      positionSeconds: Math.floor(currentTime),
      isPlaying,
      volume: volume / 100,
      shuffle: isShuffleOn,
      repeatMode: loopMode,
    };
    if (currentTrack?.trackId) {
      payload.currentTrackId = currentTrack.trackId;
    }

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

      console.log("[playerStore] restoring session track:", restoredCurrentTrack);
      set({
        currentTrack: restoredCurrentTrack,
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

      // Restore backend queue state (currentQueueIndex / queueLength) without
      // touching the queue itself - the backend owns it exclusively.
      try {
        const queueData = await getQueueState();
        set({
          currentQueueIndex: queueData.currentIndex,
          queueLength: queueData.queueLength,
        });
      } catch {
        // Non-fatal: queue state will be populated on next play
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

  /**
   * Load a playback context (playlist / artist / feed / single track) onto the
   * backend and immediately start playing the designated start track.
   */
  loadQueueContext: async (body: LoadQueueBody) => {
    try {
      const response = await loadQueue(body);
      set({
        currentQueueIndex: response.currentIndex,
        queueLength: response.queueLength,
        tracksUntilAd: response.tracksUntilAd,
        currentAd: null,
        isPlayingAd: false,
        queueVersion: get().queueVersion + 1,
      });

      if (response.currentTrack) {
        const meta = response.currentTrack;
        const track: Track = {
          trackId: meta.trackId,
          title: meta.title,
          artist: meta.artist,
          artistId: meta.artistId,
          artistHandle: meta.artistHandle ?? undefined,
          artistAvatarUrl: meta.artistAvatarUrl,
          cover: meta.cover ?? "/images/track-placeholder.png",
          duration: meta.duration ?? undefined,
          genre: meta.genre ?? undefined,
        };
        // _fromQueue = true so fetchAndPlay won't call loadQueue again
        await get().fetchAndPlay(track, true);
      }
    } catch (error) {
      console.error("[playerStore] loadQueueContext failed:", error);
    }
  },

  playTrackFromContext: async ({
    track,
    contextTrackIds,
    contextType,
    contextId,
    shuffle,
  }) => {
    const state = get();

    if (state.currentTrack?.trackId === track.trackId) {
      await state.toggle();
      return;
    }

    try {
      const ids = uniqueTrackIds(contextTrackIds ?? []);

      if (contextType === "PLAYLIST" && contextId) {
        await state.loadQueueContext({
          contextType: "PLAYLIST",
          contextId,
          startTrackId: track.trackId,
          shuffle: shuffle ?? state.isShuffleOn,
        });
        return;
      }

      if (contextType === "ARTIST" && contextId) {
        await state.loadQueueContext({
          contextType: "ARTIST",
          contextId,
          startTrackId: track.trackId,
          shuffle: shuffle ?? state.isShuffleOn,
        });
        return;
      }

      if (ids.length > 1) {
        await state.loadQueueContext({
          contextType: "CONTEXT_IDS",
          trackIds: ids,
          startTrackId: track.trackId,
          shuffle: shuffle ?? state.isShuffleOn,
        });
        return;
      }

      await state.loadQueueContext({
        contextType: "TRACK",
        startTrackId: track.trackId,
        shuffle: shuffle ?? state.isShuffleOn,
      });
    } catch (error) {
      console.error("[playerStore] playTrackFromContext failed:", error);

      // Last fallback: play the clicked track directly.
      await get().fetchAndPlay(track);
    }
  },

  addTrackToNextUp: async (trackId: string) => {
    try {
      const current = get();

      // If no queue exists yet but a track is currently playing, create a queue first.
      if (current.queueLength === 0 && current.currentTrack) {
        const resp = await loadQueue({
          contextType: "TRACK",
          startTrackId: current.currentTrack.trackId,
        });

        set({
          currentQueueIndex: resp.currentIndex,
          queueLength: resp.queueLength,
          tracksUntilAd: resp.tracksUntilAd,
          queueVersion: get().queueVersion + 1,
        });
      }

      const resp = await addQueueItem({
        trackId,
        mode: "NEXT",
      });

      set({
        queueLength: resp.queueLength,
        queueVersion: get().queueVersion + 1,
      });
    } catch (error) {
      console.error("[playerStore] addTrackToNextUp failed:", error);
      throw error;
    }
  },

  jumpToTrackInQueue: async (trackId: string) => {
    try {
      const resp = await jumpToQueueTrack(trackId);
      if (resp.type !== "TRACK") return;

      set({
        currentQueueIndex: resp.currentIndex,
        queueLength: resp.queueLength,
        tracksUntilAd: resp.tracksUntilAd,
        currentAd: null,
        isPlayingAd: false,
        queueVersion: get().queueVersion + 1,
      });

      await get().fetchAndPlay(mapQueueMetaToTrack(resp.track), true);
    } catch (error) {
      console.error("[playerStore] jumpToTrackInQueue failed:", error);
      throw error;
    }
  },

  removeTrackFromQueue: async (position: number) => {
    try {
      const wasCurrent = position === get().currentQueueIndex;
      const resp = await removeQueueItem(position);

      set((s) => ({
        queueLength: resp.queueLength,
        currentQueueIndex:
          position < s.currentQueueIndex
            ? Math.max(0, s.currentQueueIndex - 1)
            : Math.min(s.currentQueueIndex, Math.max(0, resp.queueLength - 1)),
        queueVersion: s.queueVersion + 1,
      }));

      if (resp.queueLength === 0) {
        const audio = getAudioElement();
        if (audio) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        }

        set({
          currentTrack: null,
          isPlaying: false,
          isPlayerVisible: false,
          currentTime: 0,
          duration: 0,
          currentQueueIndex: 0,
          queueLength: 0,
          tracksUntilAd: null,
          currentAd: null,
          isPlayingAd: false,
        });

        await get().persistPlayerSession();
        return;
      }

      // Backend says if current item is removed, playback continues at same index.
      // So ask backend for the full queue and jump/play the track now at current index.
      if (wasCurrent) {
        const queueState = await getQueueState();
        const nextMeta = queueState.queue[queueState.currentIndex];

        set({
          currentQueueIndex: queueState.currentIndex,
          queueLength: queueState.queueLength,
          tracksUntilAd: queueState.tracksUntilAd,
          isShuffleOn: queueState.shuffle,
          loopMode: queueState.repeatMode,
          queueVersion: get().queueVersion + 1,
        });

        if (nextMeta) {
          await get().fetchAndPlay(mapQueueMetaToTrack(nextMeta), true);
        }
      }
    } catch (error) {
      console.error("[playerStore] removeTrackFromQueue failed:", error);
      throw error;
    }
  },

  moveTrackInQueue: async (fromPosition: number, toPosition: number) => {
    if (fromPosition === toPosition) return;

    try {
      const resp = await moveQueueItem(fromPosition, toPosition);

      const queueState = await getQueueState();

      set({
        queueLength: resp.queueLength,
        currentQueueIndex: queueState.currentIndex,
        tracksUntilAd: queueState.tracksUntilAd,
        isShuffleOn: queueState.shuffle,
        loopMode: queueState.repeatMode,
        queueVersion: get().queueVersion + 1,
      });
    } catch (error) {
      console.error("[playerStore] moveTrackInQueue failed:", error);
      throw error;
    }
  },

  clearBackendQueue: async () => {
    try {
      await clearQueue();

      const audio = getAudioElement();
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }

      set({
        currentTrack: null,
        isPlaying: false,
        isPlayerVisible: false,
        currentTime: 0,
        duration: 0,
        currentQueueIndex: 0,
        queueLength: 0,
        tracksUntilAd: null,
        currentAd: null,
        isPlayingAd: false,
        queueVersion: get().queueVersion + 1,
      });

      await get().persistPlayerSession();
    } catch (error) {
      console.error("[playerStore] clearBackendQueue failed:", error);
      throw error;
    }
  },

  refreshBackendQueueState: async () => {
    try {
      const queueData = await getQueueState();

      set({
        currentQueueIndex: queueData.currentIndex,
        queueLength: queueData.queueLength,
        tracksUntilAd: queueData.tracksUntilAd,
        isShuffleOn: queueData.shuffle,
        loopMode: queueData.repeatMode,
        queueVersion: get().queueVersion + 1,
      });
    } catch (error) {
      console.error("[playerStore] refreshBackendQueueState failed:", error);
    }
  },

  toggleQueuePanel: () => set((s) => ({ isQueuePanelOpen: !s.isQueuePanelOpen })),

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
  fetchAndPlay: async (track: Track, _fromQueue = false) => {
    const { currentTrack } = get();

    if (currentTrack?.trackId === track.trackId && get().isPlaying) {
      return;
    }

    // While an ad is playing, block manual track starts until the ad completes.
    if (get().isPlayingAd && !_fromQueue) {
      return;
    }

    // If this is a user-initiated play (not from queue navigation),
    // tell the backend to reset the queue to this single track.
    if (!_fromQueue) {
      try {
        const response = await loadQueue({
          contextType: "TRACK",
          startTrackId: track.trackId,
        });
        set({
          currentQueueIndex: response.currentIndex,
          queueLength: response.queueLength,
          tracksUntilAd: response.tracksUntilAd,
          currentAd: null,
          isPlayingAd: false,
          queueVersion: get().queueVersion + 1,
        });
      } catch (err) {
        // Non-fatal - continue with local playback even if queue load fails
        console.error("[playerStore] fetchAndPlay queue load failed:", err);
      }
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

    // Offline cache check
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
      // Cache read failure is non-fatal - fall through to network playback
    }

    try {
      const stateData = await getPlaybackState(track.trackId);
      const accessState = stateData.accessState as
        | "PLAYABLE"
        | "BLOCKED"
        | "PREVIEW"
        | "PROCESSING";
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

      if (accessState === "PROCESSING") {
        if (audio) {
          audio.pause();
          audio.removeAttribute("src");
          audio.load();
        }

        set({
          accessState: "PROCESSING",
          accessReason: accessReason || "Track is still processing.",
          isProcessing: true,
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
    const { loopMode, currentTrack } = get();

    // Repeat ONE: frontend handles it locally (no backend call needed)
    if (loopMode === "ONE" && currentTrack) {
      const audio = getAudioElement();
      if (audio) audio.currentTime = 0;
      set({ currentTime: 0 });
      await get().fetchAndPlay(currentTrack, true);
      return;
    }

    // Ensure the backend queue is loaded before navigating.
    // This handles page-refresh hydration and any other path that
    // sets currentTrack without going through loadQueue.
    const { queueLength } = get();
    if (queueLength === 0 && currentTrack) {
      try {
        const resp = await loadQueue({
          contextType: "TRACK",
          startTrackId: currentTrack.trackId,
        });
        set({
          currentQueueIndex: resp.currentIndex,
          queueLength: resp.queueLength,
          tracksUntilAd: resp.tracksUntilAd,
          queueVersion: get().queueVersion + 1,
        });
      } catch (err) {
        console.error("[playerStore] nextTrack queue reload failed:", err);
        return;
      }
    }

    try {
      const response = await requestNextTrack();

      if (response.type === "ENDED") {
        // Queue finished - autoplay radio from current artist (SoundCloud-style)
        const { currentTrack } = get();
        if (currentTrack?.artistId) {
          try {
            const radioResp = await loadQueue({
              contextType: "ARTIST",
              contextId: currentTrack.artistId,
              startTrackId: undefined,
            });
            set({
              currentQueueIndex: radioResp.currentIndex,
              queueLength: radioResp.queueLength,
              tracksUntilAd: radioResp.tracksUntilAd,
              currentAd: null,
              isPlayingAd: false,
              queueVersion: get().queueVersion + 1,
            });
            if (radioResp.currentTrack) {
              const meta = radioResp.currentTrack;
              await get().fetchAndPlay(
                {
                  trackId: meta.trackId,
                  title: meta.title,
                  artist: meta.artist,
                  artistId: meta.artistId,
                  artistHandle: meta.artistHandle ?? undefined,
                  artistAvatarUrl: meta.artistAvatarUrl,
                  cover: meta.cover ?? "/images/track-placeholder.png",
                  duration: meta.duration ?? undefined,
                  genre: meta.genre ?? undefined,
                },
                true,
              );
            }
            return;
          } catch {
            // Radio load failed - fall through to stop
          }
        }
        // No artist or radio failed - stop playback
        const audio = getAudioElement();
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        set({
          isPlaying: false,
          currentTime: 0,
          currentQueueIndex: response.currentIndex,
          queueLength: response.queueLength,
        });
        await get().persistProgress();
        await get().persistPlayerSession();
        return;
      }

      if (response.type === "AD") {
        // Show ad overlay; no audio to play for MVP ads
        set({
          currentAd: response.ad,
          isPlayingAd: true,
          adElapsedSeconds: 0,
          currentQueueIndex: response.currentIndex,
          queueLength: response.queueLength,
          tracksUntilAd: response.tracksUntilAd,
        });

        if (response.ad.audioUrl) {
          // Play the ad audio if a URL is provided
          const audio = getAudioElement();
          if (audio) {
            audio.pause();
            audio.src = response.ad.audioUrl;
            audio.load();
            audio.volume = get().volume / 100;
            try {
              await audio.play();
              set({ isPlaying: true });
            } catch {
              // If ad audio fails, auto-advance after a short delay is handled
              // by PlayerAudioSync's ended/error events
            }
          }
        }
        // If no audioUrl, the ad overlay is shown and PlayerAudioSync will call
        // nextTrack() again after the ad countdown (handled in Player.tsx)
        return;
      }

      // type === "TRACK"
      set({
        currentQueueIndex: response.currentIndex,
        queueLength: response.queueLength,
        tracksUntilAd: response.tracksUntilAd,
        currentAd: null,
        isPlayingAd: false,
      });

      const meta = response.track;
      const nextTrackObj: Track = {
        trackId: meta.trackId,
        title: meta.title,
        artist: meta.artist,
        artistId: meta.artistId,
        artistHandle: meta.artistHandle ?? undefined,
        artistAvatarUrl: meta.artistAvatarUrl,
        cover: meta.cover ?? "/images/track-placeholder.png",
        duration: meta.duration ?? undefined,
        genre: meta.genre ?? undefined,
      };

      await get().fetchAndPlay(nextTrackObj, true);
    } catch (error) {
      console.error("[playerStore] nextTrack failed:", error);
    }
  },

  previousTrack: async () => {
    const { currentTime, currentTrack } = get();
    const audio = getAudioElement();

    // If we're more than 3 seconds in, restart the current track
    if (currentTime > 3) {
      if (audio) audio.currentTime = 0;
      set({ currentTime: 0 });
      await get().persistProgress();
      await get().persistPlayerSession();
      return;
    }

    // Ensure the backend queue is loaded before navigating.
    const { queueLength } = get();
    if (queueLength === 0 && currentTrack) {
      try {
        const resp = await loadQueue({
          contextType: "TRACK",
          startTrackId: currentTrack.trackId,
        });
        set({
          currentQueueIndex: resp.currentIndex,
          queueLength: resp.queueLength,
          tracksUntilAd: resp.tracksUntilAd,
          queueVersion: get().queueVersion + 1,
        });
      } catch (err) {
        console.error("[playerStore] previousTrack queue reload failed:", err);
        return;
      }
    }

    try {
      const response = await requestPreviousTrack();

      if (response.type !== "TRACK") return;

      set({
        currentQueueIndex: response.currentIndex,
        queueLength: response.queueLength,
        currentAd: null,
        isPlayingAd: false,
      });

      const meta = response.track;
      const prevTrackObj: Track = {
        trackId: meta.trackId,
        title: meta.title,
        artist: meta.artist,
        artistId: meta.artistId,
        artistHandle: meta.artistHandle ?? undefined,
        artistAvatarUrl: meta.artistAvatarUrl,
        cover: meta.cover ?? "/images/track-placeholder.png",
        duration: meta.duration ?? undefined,
        genre: meta.genre ?? undefined,
      };

      await get().fetchAndPlay(prevTrackObj, true);
    } catch (error) {
      console.error("[playerStore] previousTrack failed:", error);
    }
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