import NavBar from "@/src/components/ui/NavBar";

export default function TrendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <NavBar className="sticky top-0 z-50" />
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}