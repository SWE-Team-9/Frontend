"use client";

import React from "react";

export interface WaveformMarker {
  id: string;
  progress: number; // 0 -> 1
  label?: string;
}

interface WaveformDisplayProps {
  data?: number[] | null;
  seed?: string | number;
  bars?: number;
  progress?: number; // 0 -> 1
  onSeek?: (progress: number) => void;
  playedColor?: string;
  unplayedColor?: string;
  className?: string;
  markers?: WaveformMarker[];
  onMarkerEnter?: (markerId: string) => void;
  onMarkerLeave?: () => void;
  activeMarkerId?: string | null;
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
  unplayedColor = "#d4d4d8", //"#52525b"
  className = "",
  markers = [],
  onMarkerEnter,
  onMarkerLeave,
  activeMarkerId = null,
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
    <div className={`relative h-full w-full ${className}`}>
      <div
        onClick={handleSeek}
        className={`flex h-[52px] w-full items-center overflow-hidden rounded-sm bg-zinc-800/70 px-2 ${onSeek ? "cursor-pointer" : ""}`}
        role={onSeek ? "button" : undefined}
        aria-label={onSeek ? "Seek audio waveform" : undefined}
      >
        <div className="flex h-[75%] w-full items-end gap-px">
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

      {!!markers.length && (
        <div className="pointer-events-none absolute left-0 right-0 top-[54px] h-4">
          {markers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              onMouseEnter={() => onMarkerEnter?.(marker.id)}
              onMouseLeave={() => onMarkerLeave?.()}
              className={`pointer-events-auto absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full border border-zinc-900 transition ${activeMarkerId === marker.id ? "scale-110 bg-[#d28b82]" : "bg-[#c77c73]"
                }`}
              style={{ left: `${marker.progress * 100}%` }}
              aria-label={marker.label ?? "Comment marker"}
            />
          ))}
        </div>
      )}
    </div>
  );
};