import type { SearchTrack } from "@/src/types/search";
import { TrackCard } from "@/src/components/tracks/TrackCard";

interface Props {
  track: SearchTrack;
  contextTrackIds?: string[];
}

export default function TrackResultCard({ track, contextTrackIds }: Props) {
  return (
    <TrackCard
      track={{
        trackId: track.id,
        title: track.title,
        genre: track.genre,
        coverArtUrl: track.artwork_url ?? undefined,

        artistName: track.artist_handle || "Unknown Artist",
        artistHandle: track.artist_handle,

        status: "FINISHED",
        visibility: "PUBLIC",
      }}
      isOwner={false}
      contextTrackIds={contextTrackIds}
    />
  );
}