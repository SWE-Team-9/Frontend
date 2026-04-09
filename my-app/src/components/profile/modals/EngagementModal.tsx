import React, { useEffect, useState } from "react";
import { getTrackEngagements } from "@/src/services/interactionService";
import { FollowUser } from "@/src/services/followService";
import FollowButton from "@/src/components/profile/sidebar/FollowButton"; // Adjust path as needed
import { IoClose } from "react-icons/io5";

interface EngagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  type: "likes" | "reposts";
}

export const EngagementModal: React.FC<EngagementModalProps> = ({ isOpen, onClose, trackId, type }) => {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchEngagements = async () => {
      setLoading(true);
      try {
        const data = await getTrackEngagements(trackId, type);
        if (isMounted) setUsers(data);
      } catch (error) {
        console.error("Error fetching engagements:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEngagements();
    return () => { isMounted = false; };
  }, [isOpen, trackId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="bg-[#121212] w-full max-w-md rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-white font-bold uppercase tracking-widest text-[10px]">
            {loading ? "Loading..." : `${users.length} ${type}`}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition p-1">
            <IoClose size={22} />
          </button>
        </div>

        {/* List Content */}
        <div className="p-2 max-h-[400px] min-h-[250px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-5 h-5 border-2 border-[#ff5500] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-24 text-center text-zinc-600 text-sm">No {type} yet.</div>
          ) : (
            <div className="flex flex-col">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-zinc-900/40 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    {/* Avatar with fallback to initial */}
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-700 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">{user.display_name[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-tight">{user.display_name}</p>
                      <p className="text-zinc-500 text-xs">@{user.handle}</p>
                    </div>
                  </div>
                  
                  {/* The magic happens here: Logic is handled inside the component */}
                  <FollowButton user={user} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};