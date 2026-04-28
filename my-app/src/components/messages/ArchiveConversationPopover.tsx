"use client";

export default function ArchiveConversationPopover({
  onCancel,
  onArchive,
}: {
  onCancel: () => void;
  onArchive: () => void;
}) {
  return (
    <div className="absolute right-0 top-11 z-30 w-72 rounded border border-zinc-700 bg-[#121212] p-4 shadow-xl">
      <h3 className="mb-3 text-sm font-bold text-white">Are you sure?</h3>
      <p className="mb-4 text-xs leading-5 text-zinc-300">
        Archiving a conversation removes it from your messages and will be
        restored if you contact this user again.
      </p>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="text-sm font-bold text-white">
          Cancel
        </button>
        <button
          onClick={onArchive}
          className="rounded bg-white px-4 py-2 text-sm font-bold text-black"
        >
          Archive
        </button>
      </div>
    </div>
  );
}