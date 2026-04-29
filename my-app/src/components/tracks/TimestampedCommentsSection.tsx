"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiSend } from "react-icons/fi";
import { WaveformDisplay, type WaveformMarker } from "@/src/components/tracks/WaveformDisplay";
import { addTrackComment, getTrackComments } from "@/src/services/interactionService";
import type { TrackComment } from "@/src/types/interactions";

interface TimestampedCommentsSectionProps {
    trackId: string;
    trackTitle?: string;
    trackOwnerId?: string;
    durationSeconds?: number;
    waveformData?: number[] | null;
    waveformSeed?: string | number;
    waveformProgress?: number;
    onSeek?: (progress: number) => void;
    currentPlaybackSeconds: number;
    enabled?: boolean;
    className?: string;
}

function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function TimestampedCommentsSection({
    trackId,
    trackTitle,
    trackOwnerId,
    durationSeconds = 0,
    waveformData,
    waveformSeed,
    waveformProgress = 0,
    onSeek,
    currentPlaybackSeconds,
    enabled = true,
    className = "",
}: TimestampedCommentsSectionProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isInputActive, setIsInputActive] = useState(false);
    const [comments, setComments] = useState<TrackComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
    const [snapshotTimestamp, setSnapshotTimestamp] = useState(0);

    const inputRef = useRef<HTMLInputElement | null>(null);

    const isOpen = isHovered || isInputActive;

    const loadComments = async () => {
        try {
            setIsLoading(true);
            const data = await getTrackComments(trackId, 1, 100);
            console.log("[TimestampedCommentsSection] mapped comments:", data.comments);
            setComments(data.comments);
            setHasLoadedOnce(true);
        } catch (error) {
            console.error("Failed to load track comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen || hasLoadedOnce || !enabled) return;

        let cancelled = false;

        (async () => {
            setIsLoading(true);

            try {
                const data = await getTrackComments(trackId, 1, 100);

                if (cancelled) return;

                console.log("[TimestampedCommentsSection] mapped comments:", data.comments);
                setComments(data.comments);
                setHasLoadedOnce(true);
            } catch (error) {
                console.error("Failed to load track comments:", error);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, hasLoadedOnce, enabled, trackId]);

    const markers = useMemo<WaveformMarker[]>(() => {
        if (!durationSeconds || durationSeconds <= 0) return [];

        return comments.map((comment) => ({
            id: comment.commentId,
            progress: Math.min(1, Math.max(0, comment.timestampSeconds / durationSeconds)),
            label: `${comment.user.display_name}: ${comment.text}`,
        }));
    }, [comments, durationSeconds]);

    const activeComment = useMemo(() => {
        return comments.find((comment) => comment.commentId === activeMarkerId) ?? null;
    }, [comments, activeMarkerId]);

    const handleInputFocus = () => {
        setIsInputActive(true);
        const safeTimestamp = Math.max(0, Math.floor(currentPlaybackSeconds || 0));
        setSnapshotTimestamp(safeTimestamp);
    };

    const handleInputClick = () => {
        const safeTimestamp = Math.max(0, Math.floor(currentPlaybackSeconds || 0));
        setSnapshotTimestamp(safeTimestamp);
    };

    const handleInputBlur = () => {
        if (!text.trim()) {
            setIsInputActive(false);
        }
    };

    const handleSubmit = async () => {
        const trimmed = text.trim();
        if (!trimmed || isSubmitting) return;

        try {
            setIsSubmitting(true);

            const commentPayload = {
                content: trimmed,
                timestampAt: snapshotTimestamp,
            };

            const notificationMeta = trackTitle || trackOwnerId
                ? { trackTitle, targetUserId: trackOwnerId }
                : undefined;

            if (notificationMeta) {
                await addTrackComment(trackId, commentPayload, notificationMeta);
            } else {
                await addTrackComment(trackId, commentPayload);
            }

            setText("");
            await loadComments();
            setIsInputActive(false);
            inputRef.current?.blur();
        } catch (error) {
            console.error("Failed to add comment:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className={`relative ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setActiveMarkerId(null);
            }}
        >
            <WaveformDisplay
                data={waveformData}
                seed={waveformSeed}
                progress={waveformProgress}
                onSeek={onSeek}
                markers={markers}
                activeMarkerId={activeMarkerId}
                onMarkerEnter={setActiveMarkerId}
                onMarkerLeave={() => setActiveMarkerId(null)}
            />

            {activeComment && (
                <div
                    className="absolute left-0 top-18 z-20 rounded bg-zinc-800 px-2 py-1 text-xs text-white shadow-lg"
                    style={{
                        left: `${Math.min(
                            92,
                            Math.max(
                                6,
                                (durationSeconds > 0
                                    ? (activeComment.timestampSeconds / durationSeconds) * 100
                                    : 0) * 1
                            )
                        )}%`,
                        transform: "translateX(-20%)",
                    }}
                >
                    <span className="font-semibold">{activeComment.user.display_name}</span>{" "}
                    {activeComment.text}
                </div>
            )}

            <div
                className={`mt-5 overflow-hidden transition-all duration-200 ${isOpen ? "max-h-28 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-[#c77c73]" />

                    <div className="flex min-w-0 flex-1 items-center rounded border border-zinc-600 bg-zinc-800/70 px-4">
                        <input
                            ref={inputRef}
                            value={text}
                            onChange={(e) => {
                                setText(e.target.value);
                                setIsInputActive(true);
                            }}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            onClick={handleInputClick}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    void handleSubmit();
                                }
                            }}
                            placeholder="Write a comment"
                            className="h-12 w-full bg-transparent text-white outline-none placeholder:text-zinc-400"
                        />

                        <button
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={!text.trim() || isSubmitting}
                            className="ml-3 rounded p-2 text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Send comment"
                            title={`Comment at ${formatTime(snapshotTimestamp)}`}
                        >
                            <FiSend className="text-xl" />
                        </button>
                    </div>
                </div>

                <div className="mt-2 text-xs text-zinc-400">
                    Comment will be added at <span className="text-white">{formatTime(snapshotTimestamp)}</span>
                    {isLoading ? " • loading comments..." : ""}
                </div>
            </div>
        </div>
    );
}