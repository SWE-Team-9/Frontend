import React from "react";
import { PrivacyToggle } from "@/src/components/ui/PrivacyToggle";
import { SocialLinkInput } from "@/src/components/ui/SocialLinkInput";

// ─────────────────────────────────────────────────────────────
// Edit Profile Modal
//
// BEGINNER TIP:
//   This component receives TWO props:
//     - `data`     → the current values to show in the form
//     - `handlers` → functions to call when the user types or clicks
//   This separation keeps the modal "dumb" — it just displays
//   things and calls handlers. The real logic lives in
//   useProfileController.
// ─────────────────────────────────────────────────────────────

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    displayName: string;
    handle: string;
    bio: string;
    location: string;
    website: string;
    accountType: "ARTIST" | "LISTENER";
    favoriteGenres: string[];
    genres?: string[];
    links?: SocialLink[];
    isPrivate?: boolean;
    error?: string;
    isSaving?: boolean;
  };
  handlers: {
    setProfileData: (data: Record<string, unknown>) => void;
    handleSave: () => void;
    addLink: () => void;
    removeLink: (id: number) => void;
    updateLink: (id: number, field: string, value: string) => void;
    togglePrivate: () => void;
  };
}

export const EditProfileModal = ({
  isOpen,
  onClose,
  data,
  handlers,
}: EditModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto scrollbar-hide">
      <div className="bg-[#1a1a1a] w-full max-w-250 rounded-lg border border-zinc-800 shadow-2xl my-auto overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white text-2xl"
        >
          ×
        </button>

        <div className="p-8 pb-0">
          <h2 className="text-[28px] font-bold text-white uppercase tracking-tight">
            Edit your Profile
          </h2>
        </div>
        {data.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-xs font-bold uppercase animate-pulse">
            {data.error}
          </div>
        )}
        <div className="h-auto overflow-visible px-2">
          <form
            className="p-8 space-y-8 text-left"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="flex flex-col md:flex-row gap-12">
              <div className="flex-1 space-y-6">
                <div>
                  <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                    Display name *
                  </label>
                  <input
                    type="text"
                    value={data.displayName}
                    onChange={(e) =>
                      handlers.setProfileData({ displayName: e.target.value })
                    }
                    className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold h-10 outline-none focus:border-white"
                  />
                </div>

                {/* Profile URL / handle */}
                <div>
                  <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                    Profile URL
                  </label>
                  {/* Handle cannot be changed after registration — shown for reference only */}
                  <div className="flex items-center bg-[#333] border border-zinc-800 rounded p-2 h-10 overflow-hidden opacity-60 cursor-not-allowed">
                    <span className="text-zinc-500 text-[11px] font-bold mr-1 uppercase whitespace-nowrap">
                      spotly.com/
                    </span>
                    <span className="text-zinc-400 font-bold text-sm select-none">
                      {data.handle}
                    </span>
                  </div>
                  <p className="text-zinc-600 text-[11px] mt-1">
                    Your profile URL cannot be changed.
                  </p>
                </div>

                {/* Account Type */}
                <div className="space-y-3">
                  <label className="block text-[13px] font-bold text-white uppercase">
                    Account Type
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        handlers.setProfileData({ accountType: "ARTIST" })
                      }
                      className={`flex-1 py-2 rounded font-bold text-xs uppercase transition-all ${data.accountType === "ARTIST" ? "bg-white text-black" : "bg-transparent border border-zinc-700 text-zinc-400"}`}
                    >
                      Artist
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handlers.setProfileData({ accountType: "LISTENER" })
                      }
                      className={`flex-1 py-2 rounded font-bold text-xs uppercase transition-all ${data.accountType === "LISTENER" ? "bg-white text-black" : "bg-transparent border border-zinc-700 text-zinc-400"}`}
                    >
                      Listener
                    </button>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                    Location
                  </label>
                  <input
                    type="text"
                    value={data.location}
                    onChange={(e) =>
                      handlers.setProfileData({ location: e.target.value })
                    }
                    className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold h-10 outline-none focus:border-white"
                  />
                </div>

                {/* Website */}
                <div>
                  <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                    Website
                  </label>
                  <input
                    type="text"
                    value={data.website}
                    placeholder="https://..."
                    onChange={(e) =>
                      handlers.setProfileData({ website: e.target.value })
                    }
                    className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold h-10 outline-none focus:border-white"
                  />
                </div>

                {/* Favorite Genre */}
                <div>
                  <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                    Favorite Genre
                  </label>
                  <select
                    value={data.favoriteGenres?.[0] || "None"}
                    onChange={(e) =>
                      handlers.setProfileData({
                        favoriteGenres:
                          e.target.value === "None" ? [] : [e.target.value],
                      })
                    }
                    className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold h-10 outline-none"
                  >
                    {data.genres?.map((g) => (
                      <option key={g} value={g} className="bg-[#1a1a1a]">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                    Bio *
                  </label>
                  <textarea
                    value={data.bio}
                    onChange={(e) =>
                      handlers.setProfileData({ bio: e.target.value })
                    }
                    className="w-full bg-[#333] border border-zinc-800 p-2 rounded h-28 text-white font-bold resize-none outline-none focus:border-white"
                  />
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-800">
                  <label className="text-[14px] font-bold text-white uppercase flex items-center gap-2">
                    Your links{" "}
                    <span className="bg-zinc-700 w-4 h-4 rounded-full flex items-center justify-center text-[10px]">
                      i
                    </span>
                  </label>
                  {data.links?.map((link) => (
                    <SocialLinkInput
                      key={link.id}
                      link={link}
                      onRemove={handlers.removeLink}
                      onChange={handlers.updateLink}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handlers.addLink}
                    className="bg-[#333] hover:bg-[#444] text-white text-[13px] font-bold py-1.5 px-6 rounded transition-all border border-zinc-700 uppercase"
                  >
                    Add link
                  </button>
                </div>

                <PrivacyToggle
                  isPrivate={Boolean(data.isPrivate)}
                  onToggle={handlers.togglePrivate}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-4 bg-[#1a1a1a]">
          <button
            type="button"
            onClick={onClose}
            className="text-white font-bold uppercase text-sm px-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlers.handleSave}
            disabled={data.isSaving}
            className="bg-white text-black px-6 py-1.5 rounded font-bold uppercase text-[11px] hover:bg-zinc-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {data.isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
