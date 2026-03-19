import SideBar from "@/src/components/ui/SideBar";
import NavBar from "@/src/components/ui/NavBar";

export default function SideNavLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-sans bg-amber-950 text-white min-h-screen max-w-7xl mx-auto px-6">
      <NavBar className="sticky top-0 z-50" />
      <SideBar>{children}</SideBar>
    </div>
  );
}
