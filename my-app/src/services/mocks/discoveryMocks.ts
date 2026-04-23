import type { SearchResponse, SearchType } from "@/src/types/search";
import type { ResolveResponse } from "@/src/types/resolver";

// ============================================================
// Fixtures — these power BOTH search and resolver
// ============================================================

export const MOCK_TRACKS = [
  {
    id: "trk_lofi_001",
    title: "Layali El Qahira",
    slug: "layali-el-qahira",
    artist_handle: "salma-vocals",
    genre: "lofi",
    artwork_url: "https://picsum.photos/seed/lofi1/200/200",
  },
  {
    id: "trk_lofi_002",
    title: "Cairo Nights",
    slug: "cairo-nights",
    artist_handle: "salma-vocals",
    genre: "lofi",
    artwork_url: "https://picsum.photos/seed/lofi2/200/200",
  },
  {
    id: "trk_rock_001",
    title: "Rock the Casbah",
    slug: "rock-the-casbah",
    artist_handle: "ahmed-hassan",
    genre: "rock",
    artwork_url: "https://picsum.photos/seed/rock1/200/200",
  },
  {
    id: "trk_pop_001",
    title: "Summer Pop Anthem",
    slug: "summer-pop-anthem",
    artist_handle: "ahmed-hassan",
    genre: "pop",
    artwork_url: "https://picsum.photos/seed/pop1/200/200",
  },
];

export const MOCK_USERS = [
  {
    id: "usr_001",
    handle: "salma-vocals",
    display_name: "Salma Vocals",
    avatar_url: "https://picsum.photos/seed/u1/200/200",
  },
  {
    id: "usr_002",
    handle: "ahmed-hassan",
    display_name: "Ahmed Hassan Beats",
    avatar_url: "https://picsum.photos/seed/u2/200/200",
  },
  {
    id: "usr_003",
    handle: "mona-lisa",
    display_name: "Mona Lisa",
    avatar_url: "https://picsum.photos/seed/u3/200/200",
  },
];

export const MOCK_PLAYLISTS = [
  {
    id: "pl_001",
    title: "Best of Lofi 2026",
    slug: "best-of-lofi-2026",
    owner_handle: "salma-vocals",
    cover_url: "https://picsum.photos/seed/p1/200/200",
  },
  {
    id: "pl_002",
    title: "Workout Rock Mix",
    slug: "workout-rock-mix",
    owner_handle: "ahmed-hassan",
    cover_url: "https://picsum.photos/seed/p2/200/200",
  },
];

// ============================================================
// Search mock — filters + paginates the fixtures
// ============================================================

interface SearchOpts {
  q: string;
  type: SearchType;
  page: number;
  limit: number;
}

export function mockSearch({ q, type, page, limit }: SearchOpts): SearchResponse {
  const needle = q.trim().toLowerCase();

  const matchTrack = (t: (typeof MOCK_TRACKS)[number]) =>
    t.title.toLowerCase().includes(needle) ||
    t.genre.toLowerCase().includes(needle) ||
    t.artist_handle.toLowerCase().includes(needle);

  const matchUser = (u: (typeof MOCK_USERS)[number]) =>
    u.display_name.toLowerCase().includes(needle) ||
    u.handle.toLowerCase().includes(needle);

  const matchPlaylist = (p: (typeof MOCK_PLAYLISTS)[number]) =>
    p.title.toLowerCase().includes(needle) ||
    p.owner_handle.toLowerCase().includes(needle);

  const tracks = type === "all" || type === "tracks" ? MOCK_TRACKS.filter(matchTrack) : [];
  const users = type === "all" || type === "users" ? MOCK_USERS.filter(matchUser) : [];
  const playlists =
    type === "all" || type === "playlists" ? MOCK_PLAYLISTS.filter(matchPlaylist) : [];

  // Simple per-bucket pagination (only meaningful when type !== "all")
  const start = (page - 1) * limit;
  const paginate = <T,>(arr: T[]) => arr.slice(start, start + limit);

  const total =
    type === "tracks"
      ? tracks.length
      : type === "users"
        ? users.length
        : type === "playlists"
          ? playlists.length
          : tracks.length + users.length + playlists.length;

  return {
    data: {
      tracks: paginate(tracks) as never,
      users: paginate(users) as never,
      playlists: paginate(playlists) as never,
    },
    meta: {
      total_results: total,
      current_page: page,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

// ============================================================
// Resolver mock — maps any permalink format to a resource
// ============================================================

export function mockResolve(permalink: string): ResolveResponse {
  // Strip any leading slash and trailing slash, then split
  const clean = permalink.replace(/^\/+|\/+$/g, "");
  const parts = clean.split("/").filter(Boolean);

  // /{handle}/sets/{slug}  → playlist (3 segments)
  if (parts.length === 3 && parts[1] === "sets") {
    const [handle, , slug] = parts;
    const playlist = MOCK_PLAYLISTS.find(
      (p) => p.owner_handle === handle && p.slug === slug,
    );
    if (playlist) return { type: "PLAYLIST", resource_id: playlist.id };
    throw makeNotFound("Playlist not found");
  }

  // /{handle}/{slug}  → track (2 segments)
  if (parts.length === 2) {
    const [handle, slug] = parts;
    const track = MOCK_TRACKS.find(
      (t) => t.artist_handle === handle && t.slug === slug,
    );
    if (track) return { type: "TRACK", resource_id: track.id };
    throw makeNotFound("Track not found");
  }

  // /{handle}  → user (1 segment)
  if (parts.length === 1) {
    const [handle] = parts;
    const user = MOCK_USERS.find((u) => u.handle === handle);
    if (user) return { type: "USER", resource_id: user.id };
    throw makeNotFound("User not found");
  }

  throw makeNotFound("Invalid permalink");
}

function makeNotFound(message: string): Error {
  const err = new Error(message);
  // Mimic an axios-shaped error so the rest of the app behaves the same
  (err as unknown as { response: { status: number } }).response = { status: 404 };
  return err;
}