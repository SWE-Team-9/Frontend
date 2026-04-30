"use client";
import Box from "@/src/components/ui/Box";
import SideBarItem from "@/src/components/ui/SideBarItem";
import SuggestedArtists from "@/src/components/profile/sidebar/SuggestedArtists";
import { useFollowStore } from "@/src/store/followStore";

interface SideBarProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const SideBar: React.FC<SideBarProps> = ({ children, showSidebar = true }) => {
  const suggestionsLoading = useFollowStore(
    (state) => state.suggestionsLoading,
  );
  const fetchSuggestions = useFollowStore((state) => state.fetchSuggestions);

  return (
    <div className="flex h-screen">
      {/* Main Content Area */}
      <main className="h-full flex-1 overflow-y-auto p-2 bg-[#121212] py-16">
        {children}
      </main>

      {/* Sidebar */}
      <div
        className={`hidden md:flex flex-col gap-y-2 bg-[#121212] h-full w-96 p-2 
        ${showSidebar ? "visible" : "invisible"}`}
      >
        <Box className="flex-1">
          <div className="px-5 py-4">
            <SideBarItem label="ARTISTS TOOLS" href="/" />
          </div>
        </Box>

        <Box className="flex-1">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-3 pb-4">
            
                <SideBarItem
                  label="ARTISTS YOU SHOULD FOLLOW"
                  href="/artists"
                />
            
              <button
                type="button"
                onClick={() => fetchSuggestions()}
                disabled={suggestionsLoading}
                className="shrink-0 text-[12px] font-semibold ml-auto text-zinc-400 transition-colors text-sm disabled:opacity-40 hover:underline"
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
            <SideBarItem label="YOUR LIKES" href="/likes" />
          </div>
        </Box>
        <Box className="flex-1">
          <div className="px-5 py-4">
            <SideBarItem label="LISTENING HISTORY  " href="/history" />
          </div>
        </Box>
      </div>
    </div>
  );
};

export default SideBar;
