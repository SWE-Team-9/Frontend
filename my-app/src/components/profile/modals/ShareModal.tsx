"use client";
import React from "react";
import { FaFacebook, FaTwitter, FaPinterest } from "react-icons/fa";
import { TiSocialTumbler } from "react-icons/ti";
import { HiOutlineEnvelope } from "react-icons/hi2";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareTab: string;
  setShareTab: (tab: string) => void;
  isShortened: boolean;
  setIsShortened: (val: boolean) => void;
  longLink: string;
  shortLink: string;
  copyToClipboard: () => void;
  copied: boolean;
}

export const ShareModal = ({
  isOpen,
  onClose,
  shareTab,
  setShareTab,
  isShortened,
  setIsShortened,
  longLink,
  shortLink,
  copyToClipboard,
  copied,
}: ShareModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] w-full max-w-125 rounded-sm border border-[#333] shadow-2xl overflow-hidden relative">
        {/* Modal Internal Tabs */}
        <div className="flex border-b border-[#333]">
          <button
            onClick={() => setShareTab("Share")}
            className={`px-6 py-4 text-sm font-bold transition-all uppercase ${
              shareTab === "Share"
                ? "text-white border-b-2 border-white"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            Share
          </button>
          <button
            onClick={() => setShareTab("Message")}
            className={`px-6 py-4 text-sm font-bold transition-all uppercase ${
              shareTab === "Message"
                ? "text-white border-b-2 border-white"
                : "text-zinc-500 hover:text-white"
            }`}
          >
            Message
          </button>
        </div>

        <div className="p-8 space-y-8">
          {shareTab === "Share" ? (
            <>
              {/* Social Icon Grid */}
              <div className="flex gap-4 mb-10">
                <div className="w-12.5 h-12.5 rounded-full bg-[#1DA1F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"><FaTwitter size={30} /></div>
                <div className="w-12.5 h-12.5 rounded-full bg-[#1877F2] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg "><FaFacebook size={30} /></div>
                <div className="w-12.5 h-12.5 rounded-full bg-[#35465C] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"><TiSocialTumbler size={50} /></div>
                <div className="w-12.5 h-12.5 rounded-full bg-[#E60023] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg"><FaPinterest size={30} /></div>
                <div className="w-12.5 h-12.5 rounded-full bg-[#333] flex items-center justify-center cursor-pointer hover:opacity-80 transition-all shadow-lg border border-zinc-700"><HiOutlineEnvelope size={30} /></div>
              </div>

              {/* Link Copy UI */}
              <div className="space-y-4">
                <div className="bg-[#111] border border-[#333] p-1 rounded flex items-center justify-between group">
                  <input
                    readOnly
                    value={isShortened ? shortLink : longLink}
                    className="bg-transparent text-[13px] text-zinc-300 w-full outline-none px-2 font-bold"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-all uppercase ${
                      copied ? "bg-green-600" : "bg-white text-black"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                {/* Link Shortening Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="shorten"
                    checked={isShortened}
                    onChange={() => setIsShortened(!isShortened)}
                    className="w-5 h-5 accent-white"
                  />
                  <label htmlFor="shorten" className="text-sm text-white font-bold uppercase">
                    Shorten link
                  </label>
                </div>
              </div>
            </>
          ) : (
            /* Direct Message UI */
            <div className="space-y-4 animate-in fade-in duration-300 text-left">
              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-zinc-400">To <span className="text-red-500">*</span></label>
                <input type="text" className="w-full bg-[#111] border border-[#333] p-2 rounded outline-none focus:border-white text-sm font-bold uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 uppercase text-zinc-400">Message <span className="text-red-500">*</span></label>
                <textarea defaultValue={longLink} className="w-full bg-[#111] border border-[#333] p-2 rounded h-32 outline-none focus:border-white text-sm resize-none font-bold uppercase" />
              </div>
              <div className="flex justify-end pt-2">
                <button className="bg-white text-black px-6 py-1.5 rounded font-bold text-sm hover:bg-zinc-200 uppercase">Send</button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Exit Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white text-xl uppercase"
        >
          ×
        </button>
      </div>
    </div>
  );
};