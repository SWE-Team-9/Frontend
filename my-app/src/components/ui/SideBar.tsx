"use client";
import Box from "@/src/components/ui/Box";
import SideBarItem from "@/src/components/ui/SideBarItem";
import SuggestedArtists from "@/src/components/profile/sidebar/SuggestedArtists";
import { useFollowStore } from "@/src/store/followStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import LikedTracksPreview from "@/src/components/profile/sidebar/LikedTracksPreview";
import ListeningHistoryPreview from "@/src/components/library/ListeningHistoryPreview";

interface SideBarProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const SideBar: React.FC<SideBarProps> = ({ children, showSidebar = true }) => {
  const suggestionsLoading = useFollowStore(
    (state) => state.suggestionsLoading,
  );
  const fetchSuggestions = useFollowStore((state) => state.fetchSuggestions);
  const systemRole = useAuthStore((s) => s.user?.systemRole);
  const userId = useAuthStore((s) => s.user?.id);
  const isStaff = systemRole === "ADMIN" || systemRole === "MODERATOR";

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <main className="h-full flex-1 overflow-y-auto p-2 bg-[#121212]">
        {children}
      </main>

      {/* Sidebar */}
      <div
        className={`hidden md:flex flex-col gap-y-2 bg-[#121212] h-full w-96 p-2 
        ${showSidebar ? "visible" : "invisible"}`}
      >
        {isStaff && (
          <Box className="flex-1">
            <div className="px-5 py-4">
              <SideBarItem label="ADMIN DASHBOARD" href="/admin" />
            </div>
          </Box>
        )}

        <Box className="flex-1">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-3 pb-4">

              <SideBarItem
                label="ARTISTS TO FOLLOW"
                href="/artists"
              />

              <button
                type="button"
                onClick={() => fetchSuggestions()}
                disabled={suggestionsLoading}
                className="shrink-0 text-[12px] font-semibold uppercase ml-auto cursor-pointer text-zinc-400 transition-colors text-sm disabled:opacity-40 hover:text-white"
                title="Refresh suggestions"
              >
                Refresh List
              </button>
            </div>
            <SuggestedArtists />
          </div>
        </Box>

        <Box className="flex-1">
          <div className="px-5 py-4">
            {userId ? (
              <LikedTracksPreview userId={userId} />
            ) : (
              <SideBarItem label="YOUR LIKES" href="/library/likes" />
            )}
          </div>
        </Box>
        <Box className="flex-1">
          <div className="px-5 py-4">
            <ListeningHistoryPreview />
          </div>
        </Box>
      </div>
    </div>
  );
};

export default SideBar;
