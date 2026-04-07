"use client";

import React from "react";

interface WaveformDisplayProps {
  data?: number[] | null;
  seed?: string | number;
  bars?: number;
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

  return Array.from({ length: count }, () =>
    Math.min(1, Math.max(0.08, 0.18 + rand() * 0.82))
  );
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  data,
  seed = "default-waveform",
  bars = 260,
}) => {
  const waveformData = React.useMemo(() => {
    if (data && data.length > 0) return data;
    return generateMockData(seed, bars);
  }, [data, seed, bars]);

  return (
    <div className="flex h-full w-full items-center rounded-sm bg-zinc-800/70 px-2 overflow-hidden">
      <div className="flex h-[75%] w-full items-end gap-[1px]">
        {waveformData.map((val, i) => (
          <div key={i} className="flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-[1px] bg-gray-300 transition-all"
              style={{
                height: `${val * 100}%`,
                minWidth: "1px",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};