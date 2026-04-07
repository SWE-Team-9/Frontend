"use client";

import React from "react";

interface WaveformDisplayProps {
  data?: number[] | null;
  seed?: string | number;
  bars?: number;
  progress?: number; // 0 -> 1
  onSeek?: (progress: number) => void;
  playedColor?: string;
  unplayedColor?: string;
  className?: string;
}

function stringToSeed(value: string | number) {
  const str = String(value);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  return hash || 1;
}

function seededRandom(seed: number) {
  let s = seed;

  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function generateMockData(seed: string | number, count = 180): number[] {
  const rand = seededRandom(stringToSeed(seed));

  return Array.from({ length: count }, (_, i) => {
    const base = 0.18 + rand() * 0.72;
    const wave = 0.08 * Math.sin(i / 6) + 0.05 * Math.sin(i / 13);

    return Math.min(1, Math.max(0.08, base + wave));
  });
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  data,
  seed = "default-waveform",
  bars = 260,
  progress = 0,
  onSeek,
  playedColor = "#ff5500",
  unplayedColor = "#52525b",
  className = "",
}) => {
  const waveformData = React.useMemo(() => {
    if (data && data.length > 0) return data;
    return generateMockData(seed, bars);
  }, [data, seed, bars]);

  const clampedProgress = Math.min(1, Math.max(0, progress));

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const nextProgress = rect.width > 0 ? clickX / rect.width : 0;

    onSeek(Math.min(1, Math.max(0, nextProgress)));
  };

  return (
    <div
      onClick={handleSeek}
      className={`flex h-full w-full items-center overflow-hidden rounded-sm bg-zinc-800/70 px-2 ${onSeek ? "cursor-pointer" : ""} ${className}`}
      role={onSeek ? "button" : undefined}
      aria-label={onSeek ? "Seek audio waveform" : undefined}
    >
      <div className="flex h-[75%] w-full items-end gap-[1px]">
        {waveformData.map((val, i) => {
          const barProgress = (i + 1) / waveformData.length;
          const isPlayed = barProgress <= clampedProgress;

          return (
            <div key={i} className="flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[1px] transition-all duration-150"
                style={{
                  height: `${val * 100}%`,
                  minWidth: "1px",
                  backgroundColor: isPlayed ? playedColor : unplayedColor,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};