import { UserCard } from "@/src/components/user/UserCard";
import type { SearchUser } from "@/src/types/search";

interface Props {
  user: SearchUser;
  compact?: boolean;
  onNavigate?: () => void;
}

export default function UserResultCard({
  user,
  compact = false,
  onNavigate,
}: Props) {
  return (
    <div
      className="rounded-lg p-3 hover:bg-neutral-800 transition-colors"
      onClick={(event) => {
        if (!onNavigate) return;
        const target = event.target as HTMLElement | null;
        if (target?.closest("a")) {
          onNavigate();
        }
      }}
    >
      <UserCard
        compact={compact}
        user={{
          userId: user.id,
          displayName: user.display_name,
          handle: user.handle,
          avatarUrl: user.avatar_url,
        }}
      />
    </div>
  );
}