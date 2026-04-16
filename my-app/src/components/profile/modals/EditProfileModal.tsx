import React, { useState } from "react";
import { PrivacyToggle } from "@/src/components/ui/PrivacyToggle";
import { SocialLinkInput } from "@/src/components/ui/SocialLinkInput";

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
    handleSave: (draft: {
      displayName: string;
      bio: string;
      location: string;
      website: string;
      isPrivate?: boolean;
      favoriteGenres: string[];
      accountType: "ARTIST" | "LISTENER";
      links?: SocialLink[];
    }) => void;
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
  const [draft, setDraft] = useState(() => ({
    displayName: data.displayName,
    handle: data.handle,
    bio: data.bio,
    location: data.location,
    website: data.website,
    accountType: data.accountType,
    favoriteGenres: data.favoriteGenres,
    links: data.links ?? [{ id: 1, platform: "", url: "" }],
    isPrivate: data.isPrivate,
  }));
  const addDraftLink = () => {
    setDraft((prev) => ({
      ...prev,
      links: [...(prev.links ?? []), { id: Date.now(), platform: "", url: "" }],
    }));
  };

  const removeDraftLink = (id: number) => {
    setDraft((prev) => ({
      ...prev,
      links: (prev.links ?? []).filter((link) => link.id !== id),
    }));
  };

  const updateDraftLink = (id: number, field: string, value: string) => {
    setDraft((prev) => ({
      ...prev,
      links: (prev.links ?? []).map((link) =>
        link.id === id ? { ...link, [field]: value } : link,
      ),
    }));
  };
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
                    value={draft.displayName}
                    onChange={(e) =>
                      setDraft({ ...draft, displayName: e.target.value })
                    }
                    className="w-full bg-[#333] border border-zinc-800 p-2 rounded text-white font-bold h-10 outline-none focus:border-white"
                  />
                </div>

                {/* Profile URL / handle */}
                <div>
                  <label className="block text-[13px] font-bold text-white mb-2 uppercase">
                    Profile URL *
                  </label>
                  <div className="flex items-center bg-[#333] border border-zinc-800 rounded p-2 h-10 overflow-hidden">
                    <span className="text-zinc-500 text-[11px] font-bold mr-1 uppercase whitespace-nowrap">
                      iqa3.tech/
                    </span>
                    <input
                      type="text"
                      value={draft.handle}
                      readOnly
                      className="bg-transparent text-white font-bold outline-none w-full text-sm"
                    />
                  </div>
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
                        setDraft({ ...draft, accountType: "ARTIST" })
                      }
                      className={`flex-1 py-2 rounded font-bold text-xs uppercase transition-all ${
                        draft.accountType === "ARTIST"
                          ? "bg-white text-black"
                          : "bg-transparent border border-zinc-700 text-zinc-400"
                      }`}
                    >
                      Artist
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDraft({ ...draft, accountType: "LISTENER" })
                      }
                      className={`flex-1 py-2 rounded font-bold text-xs uppercase transition-all ${
                        draft.accountType === "LISTENER"
                          ? "bg-white text-black"
                          : "bg-transparent border border-zinc-700 text-zinc-400"
                      }`}
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
                    value={draft.location}
                    onChange={(e) =>
                      setDraft({ ...draft, location: e.target.value })
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
                    value={draft.website}
                    placeholder="https://..."
                    onChange={(e) =>
                      setDraft({ ...draft, website: e.target.value })
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
                    value={draft.favoriteGenres?.[0] || "None"}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
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
                    value={draft.bio}
                    onChange={(e) =>
                      setDraft({ ...draft, bio: e.target.value })
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
                  {draft.links?.map((link) => (
                    <SocialLinkInput
                      key={link.id}
                      link={link}
                      onRemove={removeDraftLink}
                      onChange={updateDraftLink}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={addDraftLink}
                    className="bg-[#333] hover:bg-[#444] text-white text-[13px] font-bold py-1.5 px-6 rounded transition-all border border-zinc-700 uppercase"
                  >
                    Add link
                  </button>
                </div>

                <PrivacyToggle
                  isPrivate={Boolean(draft.isPrivate)}
                  onToggle={() =>
                    setDraft((prev) => ({
                      ...prev,
                      isPrivate: !prev.isPrivate,
                    }))
                  }
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-4 bg-[#1a1a1a]">
          <button
            type="button"
            onClick={onClose}
            className="text-white font-bold uppercase px-4 hover:bg-zinc-600 text-lg transition duration-300 py-1.5 rounded cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              handlers.handleSave({
                displayName: draft.displayName,
                bio: draft.bio,
                location: draft.location,
                website: draft.website,
                isPrivate: draft.isPrivate,
                favoriteGenres: draft.favoriteGenres,
                accountType: draft.accountType,
                links: draft.links,
              })
            }
            disabled={data.isSaving}
            className="bg-white hover:bg-[#ff5500] transition duration-300 cursor-pointer font-bold text-lg text-black px-6 py-1.5 rounded uppercase shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {data.isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
