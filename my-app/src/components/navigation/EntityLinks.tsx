import Link from "next/link";
import { buildTrackPermalink } from "@/src/lib/permalinks";

interface UserProfileLinkProps {
  handle?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function UserProfileLink({
  handle,
  children,
  className,
}: UserProfileLinkProps) {
  if (!handle) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={`/profiles/${handle}`}
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}

interface TrackPageLinkProps {
  trackId: string;
  artistHandle?: string | null;
  slug?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function TrackPageLink({
  trackId,
  artistHandle,
  slug,
  children,
  className,
}: TrackPageLinkProps) {
  const href = buildTrackPermalink({
    trackId,
    artistHandle: artistHandle ?? undefined,
    slug: slug ?? undefined,
  });

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
}