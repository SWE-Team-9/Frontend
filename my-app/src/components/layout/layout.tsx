import SideBar from "@/src/components/ui/SideBar";
import NavBar from "@/src/components/ui/NavBar";
import { Player } from "@/src/components/player/Player";  //////////////manal//////////
export default function SideNavLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans text-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          <SideBar>
            <NavBar />
            {children}
          </SideBar>
        </div>
      </body>
    </html>
  );
}
