"use client";

import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";

function formatTime(seconds?: number) {
  if (!seconds || Number.isNaN(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MessageWaveform({
  waveformData,
  waveformSeed,
  progress,
  currentSeconds,
  durationSeconds,
  onSeek,
}: {
  waveformData?: number[] | null;
  waveformSeed: string;
  progress: number;
  currentSeconds: number;
  durationSeconds: number;
  onSeek?: (progress: number) => void;
}) {
  return (
    <div className="relative mt-3">
      <WaveformDisplay
        data={waveformData}
        seed={waveformSeed}
        progress={progress}
        onSeek={onSeek}
        bars={180}
      />

      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>{formatTime(currentSeconds)}</span>
        <span>{formatTime(durationSeconds)}</span>
      </div>
    </div>
  );
}