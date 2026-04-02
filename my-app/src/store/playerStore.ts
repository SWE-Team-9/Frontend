import { create } from "zustand";


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
}

let _audio: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!_audio) {
    _audio = new Audio();
    _audio.preload = "metadata";
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
  isProcessing: boolean;    //  true when API returns 409
  accessState: "PLAYABLE" | "BLOCKED" | "PREVIEW" | null; 
  streamError: string | null;

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
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: mockTracks[0],
  isPlaying: false,
  volume: 75,
  currentTime: 0,
  duration: mockTracks[0]?.duration ?? 0,  
  trackIndex: 0,
  tracks: mockTracks,
  isProcessing: false,
  accessState: null,
  streamError: null,

  play: () => {
    const audio = getAudioElement();
    if (audio) audio.play().catch(() => {});
    set({ isPlaying: true });
  },

  pause: () => {
    const audio = getAudioElement();
    if (audio) audio.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    const { isPlaying } = get();
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
      isPlaying: true,
      currentTime: 0,
      duration: track.duration ?? 0,  
      accessState: track.accessState ?? null,
    });
  },

  //  fetch streamUrl, handle 409 and accessState
  fetchAndPlay: async (track: Track) => {
    set({
      isProcessing: false,
      streamError: null,
      accessState: null,
    });

    try {
      const res = await fetch(`/api/v1/player/tracks/${track.trackId}/source`);

      
      if (res.status === 409) {
        set({ isProcessing: true, currentTrack: track });
        return;
      }

      if (!res.ok) {
        set({ streamError: `Failed to load track (${res.status})` });
        return;
      }

      const data = await res.json();
      const streamUrl: string = data.streamUrl;
      const accessState: "PLAYABLE" | "BLOCKED" | "PREVIEW" = data.accessState;

      //  respect accessState
      if (accessState === "BLOCKED") {
        set({ accessState: "BLOCKED", currentTrack: track });
        return;
      }

      const index = get().tracks.findIndex((t) => t.trackId === track.trackId);
      const enrichedTrack: Track = { ...track, streamUrl, accessState };

      set({
        currentTrack: enrichedTrack,
        trackIndex: index,
        isPlaying: false,
        currentTime: 0,
        duration: track.duration ?? 0,
        accessState,
        isProcessing: false,
        streamError: null,
      });

      const audio = getAudioElement();
      if (audio) {
        audio.src = streamUrl;
        audio.load();
        //  volume is 0–100 in store → normalize to 0–1 for audio element
        audio.volume = get().volume / 100;
        audio.play().catch(() => set({ isPlaying: false }));
        set({ isPlaying: true });
      }
    } catch {
      set({ streamError: "Network error loading track" });
    }
  },

  nextTrack: () => {
    const { tracks, trackIndex } = get();
    const nextIndex = (trackIndex + 1) % tracks.length;
    get().fetchAndPlay(tracks[nextIndex]);
  },

  previousTrack: () => {
    const { tracks, trackIndex, currentTime } = get();
    if (currentTime > 3) {
      const audio = getAudioElement();
      if (audio) audio.currentTime = 0;
      set({ currentTime: 0 });
      return;
    }
    const prevIndex = (trackIndex - 1 + tracks.length) % tracks.length;
    get().fetchAndPlay(tracks[prevIndex]);
  },

  //: store keeps 0–100; audio element gets 0–1
  setVolume: (volume: number) => {
    const audio = getAudioElement();
    if (audio) audio.volume = volume / 100;
    set({ volume });
  },

  //  seek on the actual audio element, not just the store
  setCurrentTime: (time: number) => {
    const audio = getAudioElement();
    if (audio && isFinite(time)) audio.currentTime = time;
    set({ currentTime: time });
  },

  setDuration: (duration: number) => set({ duration }),
}));