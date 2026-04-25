"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getTrackDetails,
  updateTrackMetadata,
  changeTrackVisibility,
} from "@/src/services/uploadService";
import { WaveformDisplay } from "@/src/components/tracks/WaveformDisplay";
import { DownloadButton } from "@/src/components/tracks/DownloadButton";

const GENRES = [
  "None",
  "electronic",
  "hip-hop",
  "pop",
  "rock",
  "alternative",
  "ambient",
  "classical",
  "jazz",
  "r-b-soul",
  "metal",
  "folk-singer-songwriter",
  "country",
  "reggaeton",
  "dancehall",
  "drum-bass",
  "house",
  "techno",
  "deep-house",
  "trance",
  "lo-fi",
  "indie",
  "punk",
  "blues",
  "latin",
  "afrobeat",
  "trap",
  "experimental",
  "world",
  "gospel",
  "spoken-word",
];

interface TrackFile {
  id: string;
  role: string;
  mimeType: string;
  format: string;
  size: number;
  status: string;
}

interface Track {
  trackId: string;
  title: string;
  slug: string;
  description: string | null;
  artist: string | null;
  artistId: string | null;
  artistHandle: string | null;
  artistAvatarUrl: string | null;
  genre: string | null;
  tags: string[];
  releaseDate: string | null;
  durationMs: number | null;
  waveformData: number[] | null;
  visibility: "PUBLIC" | "PRIVATE";
  accessLevel: string;
  status: string;
  license: string;
  allowComments: boolean;
  downloadable: boolean;
  coverArtUrl: string | null;
  secretToken: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files: TrackFile[];
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatBytes = (bytes: number) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function TrackDetailPage() {
  const router = useRouter();
  const { trackId } = useParams<{ trackId: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editReleaseDate, setEditReleaseDate] = useState("");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "PRIVATE">(
    "PRIVATE",
  );

  useEffect(() => {
    getTrackDetails(trackId)
      .then((data) => {
        setError(null);
        setTrack(data as unknown as Track);
      })
      .catch(() => {
        setError("Could not load track details.");
      })
      .finally(() => setLoading(false));
  }, [trackId]);

  const enterEditMode = () => {
    if (!track) return;
    setEditTitle(track.title);
    setEditGenre(track.genre ?? "");
    setEditTags(track.tags?.join(", ") ?? "");
    setEditDescription(track.description ?? "");
    setEditReleaseDate(track.releaseDate?.split("T")[0] ?? "");
    setEditVisibility(track.visibility);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!track) return;
    setSaving(true);
    try {
      setError(null);
      await updateTrackMetadata(track.trackId, {
        title: editTitle,
        genre: editGenre,
        tags: editTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        releaseDate: editReleaseDate ? new Date(editReleaseDate).toISOString() : undefined,
        description: editDescription,
      });

      if (editVisibility !== track.visibility) {
        await changeTrackVisibility(track.trackId, editVisibility);
      }

      setTrack((prev) =>
        prev
          ? {
              ...prev,
              title: editTitle,
              genre: editGenre,
              tags: editTags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              description: editDescription,
              releaseDate: editReleaseDate,
              visibility: editVisibility,
            }
          : prev,
      );
      setIsEditing(false);
    } catch {
      setError("Failed to save track changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewOnProfile = () => {
    if (track?.artistHandle) {
      router.push(`/profiles/${track.artistHandle}`);
    } else {
      router.push("/profile");
    }
  };

  if (loading)
    return (
      <main className="min-h-screen bg-[#121212] flex items-center justify-center">
        <h1 className="text-[#ff5500] text-lg">Loading Track...</h1>
      </main>
    );

  if (!track)
    return (
      <main className="min-h-screen bg-[#121212] flex items-center justify-center">
        <h1 className="text-[#ff5500] text-lg">Track not found.</h1>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#121212] flex items-start justify-center p-6 pt-12">
      <div className="w-full max-w-3xl bg-[#1a1a1a] rounded-2xl p-8 shadow-xl border border-[#2a2a2a]">
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {isEditing ? (
              <input
                className="text-3xl font-bold bg-transparent border-b border-[#8c8c8c] text-white w-full focus:outline-none focus:border-white pb-1"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            ) : (
              <h1 className="text-3xl font-bold text-white">{track.title}</h1>
            )}
            {track.artistHandle && (
              <p className="text-[#ff5500] mt-1 text-sm">
                @{track.artistHandle}
              </p>
            )}
          </div>

          {/* Status + Visibility badges */}
          <div className="flex flex-col items-end gap-2 ml-4">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                track.status === "FINISHED"
                  ? "border-green-500 text-green-400"
                  : track.status === "FAILED"
                    ? "border-red-500 text-red-400"
                    : "border-yellow-500 text-yellow-400"
              }`}
            >
              {track.status}
            </span>
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                track.visibility === "PUBLIC"
                  ? "border-blue-400 text-blue-400"
                  : "border-gray-500 text-gray-400"
              }`}
            >
              {track.visibility}
            </span>
          </div>
        </div>

        {/* Artist row */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#2a2a2a]">
          {track.artistAvatarUrl ? (
            <Image
              src={track.artistAvatarUrl}
              alt={track.artist ?? "Artist"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-500 text-sm font-bold">
              {track.artist?.charAt(0) ?? "?"}
            </div>
          )}
          <div>
            <p className="text-white font-medium">
              {track.artist ?? "Unknown Artist"}
            </p>
            {track.artistHandle && (
              <p className="text-gray-500 text-sm">@{track.artistHandle}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
            Description
          </label>
          {isEditing ? (
            <textarea
              className="w-full bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm resize-none min-h-25 focus:outline-none focus:border-white"
              value={editDescription}
              maxLength={5000}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed">
              {track.description ?? (
                <span className="text-gray-600 italic">No description</span>
              )}
            </p>
          )}
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
              Genre
            </label>
            {isEditing ? (
              <select
                value={editGenre || "None"}
                onChange={(e) =>
                  setEditGenre(e.target.value === "None" ? "" : e.target.value)
                }
                className="w-full bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm focus:outline-none focus:border-white"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g} className="bg-[#1a1a1a]">
                    {g}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-white text-sm">{track.genre ?? "—"}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
              Release Date
            </label>
            {isEditing ? (
              <input
                type="date"
                className="w-full bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm focus:outline-none focus:border-white"
                value={editReleaseDate}
                onChange={(e) => setEditReleaseDate(e.target.value)}
              />
            ) : (
              <p className="text-white text-sm">
                {formatDate(track.releaseDate)}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
              Tags
            </label>
            {isEditing ? (
              <input
                className="w-full bg-[#121212] border border-[#8c8c8c] rounded p-2 text-white text-sm focus:outline-none focus:border-white"
                placeholder="Comma separated"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
              />
            ) : (
              <div className="flex flex-wrap gap-1">
                {track.tags?.length ? (
                  track.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#2a2a2a] text-gray-300 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-600 italic text-sm">No tags</span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
              Duration
            </label>
            <p className="text-white text-sm">
              {track.durationMs ? formatDuration(track.durationMs) : "—"}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
              License
            </label>
            <p className="text-white text-sm">
              {track.license?.replace(/_/g, " ") ?? "—"}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
              Slug
            </label>
            <p className="text-gray-400 text-sm font-mono">
              {track.slug ?? "—"}
            </p>
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
              Comments
            </label>
            <p className="text-white text-sm">
              {track.allowComments ? "Enabled" : "Disabled"}
            </p>
          </div>

         <div>
  <label className="text-xs text-gray-500 uppercase tracking-widest mb-1 block">
    Downloadable
  </label>
  {track.downloadable ? (
    <DownloadButton
      trackId={track.trackId}
      trackTitle={track.title}
      downloadable={track.downloadable}
      size="full"
    />
  ) : (
    <p className="text-zinc-500 text-sm italic">Not available</p>
  )}
</div>
        </div>

        {/* Visibility toggle — edit mode only */}
        {isEditing && (
          <div className="mb-6">
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">
              Visibility
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditVisibility("PUBLIC")}
                className={`flex-1 py-2 rounded border font-bold transition duration-300 text-sm ${
                  editVisibility === "PUBLIC"
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-[#8c8c8c] border-[#8c8c8c]"
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setEditVisibility("PRIVATE")}
                className={`flex-1 py-2 rounded border font-bold transition duration-300 text-sm ${
                  editVisibility === "PRIVATE"
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-[#8c8c8c] border-[#8c8c8c]"
                }`}
              >
                Private
              </button>
            </div>
          </div>
        )}

        {/* Waveform Preview */}
        <div className="mt-6">
          <label className="font-medium pb-2 text-xl block mb-2 text-white">
            Waveform Preview
          </label>
          <div className="w-full h-20 rounded overflow-hidden">
            <WaveformDisplay />
          </div>
        </div>

        {/* Files */}
        {track.files?.length > 0 && (
          <div className="mb-6">
            <label className="text-xs text-gray-500 uppercase tracking-widest mb-2 block">
              Files
            </label>
            <div className="space-y-2">
              {track.files.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between bg-[#121212] border border-[#2a2a2a] rounded-lg px-4 py-3"
                >
                  <div>
                    <span className="text-white text-sm font-medium uppercase">
                      {f.format}
                    </span>
                    <span className="text-gray-500 text-xs ml-2">
                      {f.mimeType}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400 text-xs">
                      {formatBytes(f.size)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        f.status === "READY"
                          ? "border-green-500 text-green-400"
                          : "border-yellow-500 text-yellow-400"
                      }`}
                    >
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-xs text-gray-600 border-t border-[#2a2a2a] pt-4">
          <div>
            <span className="uppercase tracking-widest">Published</span>
            <p className="text-gray-500 mt-0.5">
              {formatDate(track.publishedAt)}
            </p>
          </div>
          <div>
            <span className="uppercase tracking-widest">Created</span>
            <p className="text-gray-500 mt-0.5">
              {formatDate(track.createdAt)}
            </p>
          </div>
          <div>
            <span className="uppercase tracking-widest">Last Updated</span>
            <p className="text-gray-500 mt-0.5">
              {formatDate(track.updatedAt)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-white text-black font-bold py-2 px-4 rounded hover:bg-[#ff5500] transition disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="flex-1 border border-[#8c8c8c] text-[#8c8c8c] font-bold py-2 px-4 rounded hover:border-white hover:text-white transition"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={enterEditMode}
                className="bg-white text-black font-bold py-2 px-6 rounded hover:bg-[#ff5500] transition"
              >
                Edit
              </button>

              {track.artistHandle && (
                <button
                  onClick={handleViewOnProfile}
                  className="border border-[#8c8c8c] text-[#8c8c8c] font-bold py-2 px-6 rounded hover:border-[#ff5500] hover:text-[#ff5500] transition"
                >
                  View on Profile
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
