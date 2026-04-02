import SideBar from "@/src/components/ui/SideBar";
import NavBar from "@/src/components/ui/NavBar";

export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="font-sans text-white min-h-screen max-w-7xl mx-auto">
      <NavBar className="sticky top-0 z-50" />
      <main className="flex justify-center w-full px-4 py-8">
        <div className="w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
