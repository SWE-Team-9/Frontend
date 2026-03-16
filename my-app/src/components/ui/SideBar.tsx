"use client";
import Box from "@/src/components/ui/navigation/Box";
import SideBarItem from "@/src/components/ui/navigation/SideBarItem";
interface SideBarProps {
  children: React.ReactNode; 
}
const SideBar: React.FC<SideBarProps> = ({ children }) => {
  return (
    <div className="flex h-screen">

      {/* Main Content Area */}
      <main className="h-full flex-1 overflow-y-auto p-2 bg-amber-950 py-20">{children}</main>

      {/* Sidebar */}
      <div className="hidden md:flex flex-col gap-y-2 bg-black h-full w-96 p-2">   {/* pt-20  for the NavBar*/}
        <Box className="flex-1">
          <div className="px-5 py-4">
            <SideBarItem label="ARTISTS TOOLS" href="/" />
          </div>
        </Box>
        <Box className="flex-1">
          <div className="px-5 py-4">
            <SideBarItem label="ARTISTS YOU SHOULD FOLLOW" href="/artists" />
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
