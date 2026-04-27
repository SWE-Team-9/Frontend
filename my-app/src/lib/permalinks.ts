function isValidPart(value?: string | null) {
    const cleaned = value?.trim();

    return (
        !!cleaned &&
        cleaned.toLowerCase() !== "undefined" &&
        cleaned.toLowerCase() !== "null"
    );
}

export function buildFullShareUrl(permalink: string) {
    if (typeof window === "undefined") return permalink;

    if (permalink.startsWith("http://") || permalink.startsWith("https://")) {
        return permalink;
    }

    return `${window.location.origin}${permalink}`;
}

export function buildTrackPermalink(
    handleOrParams:
        | string
        | {
            trackId: string;
            artistHandle?: string | null;
            slug?: string | null;
        },
    slug?: string,
) {
    if (typeof handleOrParams === "string") {
        return `/${handleOrParams}/${slug}`;
    }

    const { trackId, artistHandle } = handleOrParams;

    if (isValidPart(artistHandle) && isValidPart(handleOrParams.slug)) {
        return `/${artistHandle?.trim()}/${handleOrParams.slug?.trim()}`;
    }

    return `/tracks/${trackId}`;
}

export function buildUserPermalink(handle: string) {
    return `/${handle}`;
}

export function buildPlaylistPermalink(
    handleOrParams:
        | string
        | {
            playlistId: string;
            ownerHandle?: string | null;
            slug?: string | null;
        },
    slug?: string,
) {
    if (typeof handleOrParams === "string") {
        return `/${handleOrParams}/sets/${slug}`;
    }

    const { playlistId, ownerHandle } = handleOrParams;

    if (isValidPart(ownerHandle) && isValidPart(handleOrParams.slug)) {
        return `/${ownerHandle?.trim()}/sets/${handleOrParams.slug?.trim()}`;
    }

    return `/playlists/${playlistId}`;
}