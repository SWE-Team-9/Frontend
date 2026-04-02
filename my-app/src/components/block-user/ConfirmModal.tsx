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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-black p-6 rounded-xl max-w-md w-full">
        <h2 className="mb-4 font-semibold text-lg">
          {isBlocked ? `Unblock ${displayName}?` : `Block ${displayName}?`}
        </h2>

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
          <button onClick={onClose} className="bg-gray-500 text-white px-3 py-1 rounded cursor-pointer">
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="bg-white text-black px-3 py-1 rounded cursor-pointer"
          >
            {isBlocked ? `Unblock ${displayName}` : `Block ${displayName}`}
          </button>
        </div>
      </div>
    </div>
  );
}