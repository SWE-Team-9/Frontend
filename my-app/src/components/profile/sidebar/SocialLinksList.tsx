import React from "react";

export const SocialLinksList = ({
  links,
}: {
  links: { id: number; platform: string; url: string }[];
}) => (
  <div className="mt-6 border-t border-zinc-900 pt-4 text-left">
    <p className="text-zinc-500 text-[10px] font-bold uppercase mb-3">
      Social Links
    </p>
    <div className="space-y-2">
      {links?.filter((link) => link.url.trim() !== "").length > 0 ? (
        links
          .filter((link) => link.url.trim() !== "")
          .map((link) => (
            <a
              key={link.id}
              href={
                link.url.startsWith("http") ? link.url : `https://${link.url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors text-sm group"
            >
              <span className="text-[10px]">🔗</span>
              <span className="truncate">
                {link.platform || link.url.replace(/^https?:\/\//, "")}
              </span>
            </a>
          ))
      ) : (
        <p className="text-zinc-600 text-xs italic">No social links added</p>
      )}
    </div>
  </div>
);
