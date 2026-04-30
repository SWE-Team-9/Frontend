"use client";

import { useEffect, useRef } from "react";
import { getAudioElement, usePlayerStore } from "@/src/store/playerStore";
import { useAuthStore } from "@/src/store/useAuthStore";

export default function PlayerAudioSync() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const hydratedFromSession = usePlayerStore((s) => s.hydratedFromSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isPlayingAd = usePlayerStore((s) => s.isPlayingAd);
  const currentAd = usePlayerStore((s) => s.currentAd);
  const adTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const state = usePlayerStore.getState();
      if (!state.isPlaying) {
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
      // If an ad with audio just ended, advance to next real track
      if (state.isPlayingAd) {
        usePlayerStore.setState({ isPlayingAd: false, currentAd: null });
        await state.nextTrack();
        return;
      }
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

  // Ad countdown: when an ad has no audioUrl, tick elapsed seconds and auto-advance
  useEffect(() => {
    if (adTimerRef.current) {
      clearTimeout(adTimerRef.current);
      adTimerRef.current = null;
    }
    if (adIntervalRef.current) {
      clearInterval(adIntervalRef.current);
      adIntervalRef.current = null;
    }

    if (isPlayingAd && currentAd && !currentAd.audioUrl) {
      // Pause and clear the previous track's audio so it doesn't keep playing
      const audio = getAudioElement();
      if (audio) {
        audio.pause();
        audio.src = "";
      }

      // Tick adElapsedSeconds every second for the progress bar
      adIntervalRef.current = setInterval(() => {
        usePlayerStore.setState((s) => ({ adElapsedSeconds: s.adElapsedSeconds + 1 }));
      }, 1000);

      // Auto-advance after full duration
      adTimerRef.current = setTimeout(async () => {
        if (adIntervalRef.current) {
          clearInterval(adIntervalRef.current);
          adIntervalRef.current = null;
        }
        usePlayerStore.setState({ isPlayingAd: false, currentAd: null, adElapsedSeconds: 0 });
        await usePlayerStore.getState().nextTrack();
      }, currentAd.durationSeconds * 1000);
    }

    return () => {
      if (adTimerRef.current) {
        clearTimeout(adTimerRef.current);
        adTimerRef.current = null;
      }
      if (adIntervalRef.current) {
        clearInterval(adIntervalRef.current);
        adIntervalRef.current = null;
      }
    };
  }, [isPlayingAd, currentAd]);

  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      usePlayerStore.getState().persistProgress();
    }, 15000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrack?.trackId]);

  useEffect(() => {
    const audio = getAudioElement();
    if (!audio) return;
    if (!hydratedFromSession) return;
    if (!currentTrack) return;

    if (!audio.src) {
      usePlayerStore.getState().fetchAndPlay(currentTrack, true);
    }
  }, [hydratedFromSession, currentTrack]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = usePlayerStore.getState();
      if (!useAuthStore.getState().isAuthenticated) return;
      state.persistProgress();

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const { currentTrack, currentTime, isPlaying, volume, isShuffleOn, loopMode } = state;
        const payload = JSON.stringify({
          currentTrackId: currentTrack?.trackId ?? null,
          positionSeconds: Math.floor(currentTime),
          isPlaying,
          volume: volume / 100,
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