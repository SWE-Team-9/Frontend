import LibraryTabs from "@/src/components/library/LibraryTabs";

export default function PlaceholderPage() {
  return (
    <div className="min-h-screen bg-[#121212] px-6 py-8 text-white">
      <LibraryTabs />
      <div className="rounded-md border border-zinc-800 bg-[#181818] p-6 text-zinc-400">
        This page is not implemented yet.
      </div>
    </div>
  );
}