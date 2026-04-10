import React, { useEffect, useState } from "react";
import { getTrackEngagements } from "@/src/services/interactionService";
import { FollowUser } from "@/src/services/followService";
import FollowButton from "@/src/components/profile/sidebar/FollowButton";
import { IoClose } from "react-icons/io5";
import Image from "next/image";

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
    if (!isOpen || !trackId) return;
    
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#181818] w-full max-w-md rounded-xl border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-white font-bold uppercase tracking-widest text-[11px]">
            {loading ? "Loading..." : `${users.length} ${type}`}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition p-1">
            <IoClose size={22} />
          </button>
        </div>

        {/* List Content */}
        <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#ff5500] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 text-sm">No {type} yet.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                      {user.avatar_url ? (
                        <Image 
                          src={user.avatar_url} 
                          alt={user.display_name} 
                          fill 
                          className="object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold text-xs">
                          {user.display_name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{user.display_name}</p>
                      <p className="text-zinc-500 text-xs">@{user.handle}</p>
                    </div>
                  </div>
                  
                  {/* Keep the follow button for discovery */}
                  <div className="scale-90">
                    <FollowButton user={user} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};