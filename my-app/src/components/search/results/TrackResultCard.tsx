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
        coverArtUrl: track.artwork_url,
        artistName: track.artist_handle,
        artistHandle: track.artist_handle,
      }}
      contextTrackIds={contextTrackIds}
    />
  );
}