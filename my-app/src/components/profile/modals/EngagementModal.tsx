import React, { useEffect, useState } from "react";
import { getTrackEngagements, EngagementUser } from "@/src/services/interactionService";
import { IoClose } from "react-icons/io5";

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  type: "likes" | "reposts";
}

export const EngagementModal: React.FC<EngagementModalProps> = ({ isOpen, onClose, trackId, type }) => {
  const [users, setUsers] = useState<EngagementUser[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!isOpen) return;

  // Wrap the call in a small condition or just handle the 
  // loading state as part of the async flow.
  let isMounted = true;

  const fetchEngagements = async () => {
    // DO NOT call setLoading(true) here if it causes the error.
    // Instead, rely on the initial state or a slightly delayed execution.
    const data = await getTrackEngagements(trackId, type);
    if (isMounted) {
      setUsers(data);
      setLoading(false);
    }
  };

  fetchEngagements();
  return () => { isMounted = false; };
}, [isOpen, trackId, type]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#181818] w-full max-w-md rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-white font-bold uppercase tracking-widest text-sm">
            {users.length} {type}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <IoClose size={22} />
          </button>
        </div>

        {/* List */}
        <div className="p-2 max-h-100 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-10 text-center text-zinc-500 animate-pulse">Loading {type}...</div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-zinc-500">No {type} yet.</div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-zinc-900/50 rounded-lg transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full" /> {/* Avatar Placeholder */}
                  <div>
                    <p className="text-white text-sm font-semibold">{user.name}</p>
                    <p className="text-zinc-500 text-xs">@{user.handle}</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-[#ff5500] hover:underline">
                  {user.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};