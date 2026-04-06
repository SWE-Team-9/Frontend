interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  displayName: string;
  isBlocked: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  displayName,
  isBlocked,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#1e1e1e] border border-zinc-700 rounded-xl p-6 max-w-xl w-full mx-4 shadow-2xl">
        <h1 className="mb-4 font-semibold text-lg">
          {isBlocked ? `Unblock ${displayName}?` : `Block ${displayName}?`}
        </h1>

        {!isBlocked && (
          <p className="text-lg text-white mb-4">
            Blocking means that <strong>{displayName}</strong> will no longer be able to:
            <br />• follow you,
            <br />• like your tracks, repost your tracks,
            <br />• send you messages,
            <br />• share tracks with you,
            <br />• post new comments on your tracks, or
            <br />• send you new stream or email notifications.
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="bg-white text-black hover:bg-neutral-600 transition duration-300 font-bold text-lg px-3 py-1 rounded cursor-pointer">
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700  transition duration-300 font-bold text-lg px-3 py-1 rounded cursor-pointer"
          >
            {isBlocked ? `Unblock ${displayName}` : `Block ${displayName}`}
          </button>
        </div>
      </div>
    </div>
  );
}