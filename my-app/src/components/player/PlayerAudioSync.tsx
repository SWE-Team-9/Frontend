"use client";

import { useEffect } from "react";
import { getAudioElement, usePlayerStore } from "@/src/store/playerStore";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function PlayerAudioSync() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const hydratedFromSession = usePlayerStore((s) => s.hydratedFromSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const store = usePlayerStore.getState();
    console.log("[PlayerAudioSync] calling hydratePlayerSession()");
    store.hydratePlayerSession();
  }, [isAuthenticated]);

  useEffect(() => {
    const audio = getAudioElement();
    if (!audio) return;

    const handleTimeUpdate = () => {
      usePlayerStore.getState().setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        usePlayerStore.getState().setDuration(audio.duration);
      }
    };

    const handlePlay = () => {
      // keep UI synced with real audio state
      const state = usePlayerStore.getState();
      if (!state.isPlaying) {
        // do not call store.play() here, just reflect state
        usePlayerStore.setState({ isPlaying: true });
      }
    };

    const handlePause = () => {
      const state = usePlayerStore.getState();
      if (state.isPlaying) {
        usePlayerStore.setState({ isPlaying: false });
      }
    };

    const handleEnded = async () => {
      const state = usePlayerStore.getState();
      await state.persistProgress();
      await state.persistPlayerSession();
      await state.nextTrack();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      usePlayerStore.getState().persistProgress();
    }, 15000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.trackId]);

  useEffect(() => {
    const audio = getAudioElement();
    if (!audio) return;
    if (!hydratedFromSession) return;
    if (!currentTrack) return;

    // If currentTrack was restored from session but audio source is empty,
    // fetch and prepare playback again.
    if (!audio.src) {
      usePlayerStore.getState().fetchAndPlay(currentTrack);
    }
  }, [hydratedFromSession, currentTrack]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = usePlayerStore.getState();
      if (!useAuthStore.getState().isAuthenticated) return;
      state.persistProgress();

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const { currentTrack, currentTime, isPlaying, volume, queue, isShuffleOn, loopMode } = state;
        const payload = JSON.stringify({
          currentTrackId: currentTrack?.trackId ?? null,
          positionSeconds: Math.floor(currentTime),
          isPlaying,
          volume: volume / 100,
          queueTrackIds: queue.map((t) => t.trackId),
          shuffle: isShuffleOn,
          repeatMode: loopMode,
        });
        navigator.sendBeacon("/api/v1/player/session", new Blob([payload], { type: "application/json" }));
      } else {
        state.persistPlayerSession();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return null;
}