"use client";

import DropdownMenu from "@/src/components/ui/DropdownMenu";
import NavBarItem from "@/src/components/ui/NavBarItem";
import { useState, useRef, useEffect } from "react";
import { FaSoundcloud } from "react-icons/fa";
import { MdPerson, MdPersonAddAlt1, MdStars, MdBarChart } from "react-icons/md";
import { BsPersonCheckFill } from "react-icons/bs";
import { ImHeart } from "react-icons/im";
import { PiWaveformBold } from "react-icons/pi";
import { IoRadio } from "react-icons/io5";
import { TbArrowLeftRight } from "react-icons/tb";
import {
  FiSearch,
  FiBell,
  FiMail,
  FiList,
  FiChevronDown,
  FiMoreHorizontal,
  FiMenu,
} from "react-icons/fi";

interface NavBarProps {
  children?: React.ReactNode; 
}
const NavBar: React.FC<NavBarProps> = ({ children }) => {
  const LEFT_ROUTES = [
    { label: "Home", href: "/" },
    { label: "Feed", href: "/feed" },
    { label: "Library", href: "/library" },
  ];

  const RIGHT_ROUTES = [
    { label: "Try ArtistPro", href: "/pro" },
    { label: "For Artists", href: "/artists" },
    { label: "Upload", href: "/upload" },
  ];

  const PROFILE_MENU = [
    { label: "Profile", icon: MdPerson },
    { label: "Likes", icon: ImHeart },
    { label: "Playlists", icon: FiList },
    { label: "Stations", icon: IoRadio },
    { label: "Following", icon: BsPersonCheckFill },
    { label: "Who to follow", icon: MdPersonAddAlt1 },
    { label: "Try Artist Pro", icon: MdStars },
    { label: "Tracks", icon: PiWaveformBold },
    { label: "Insights", icon: MdBarChart },
    { label: "Distribute", icon: TbArrowLeftRight },
  ];

  const MORE_MENU = [
    { label: "About us" },
    { label: "Legal" },
    { label: "Copyright", dividerAfter: true },

    { label: "Mobile apps" },
    { label: "Artist Membership" },
    { label: "Jobs" },
    { label: "Developers" },
    { label: "SoundCloud Store", dividerAfter: true },

    { label: "Support" },
    { label: "Keyboard shortcuts", dividerAfter: true },

    { label: "Subscription" },
    { label: "Settings" },
    { label: "Sign out" },
  ];

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-black py-2">
      <div
        ref={menuRef}
        className="max-w-7xl mx-auto flex justify-center items-center gap-8"
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">
          <FaSoundcloud size={48} className="text-white shrink-0" />
          <button
            className="md:hidden text-white"
            onClick={() => toggleMenu("mobile")}
          >
            <FiMenu size={24} />
          </button>

          <div className="hidden md:flex gap-6">
            {LEFT_ROUTES.map((route) => (
              <NavBarItem
                key={route.label}
                label={route.label}
                href={route.href}
              />
            ))}
          </div>
        </div>

        {/* CENTER SECTION */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="bg-neutral-800 text-white text-sm px-4 py-1 rounded-md outline-none
              focus:ring-2 focus:ring-neutral-600
              w-32 sm:w-48 md:w-72 lg:w-96"
          />
          <FiSearch
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            size={18}
          />
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex gap-6">
            {RIGHT_ROUTES.map((route) => (
              <NavBarItem
                key={route.label}
                label={route.label}
                href={route.href}
              />
            ))}
          </div>

          {/* PROFILE */}
          <button
            aria-label="Open profile menu"
            className="relative flex items-center gap-1 cursor-pointer"
            onClick={() => toggleMenu("profile")}
          >
            <img
              src="/images/profile.jpg"
              alt="profile"
              className="w-6 h-6 rounded-full"
            />
            <FiChevronDown className="text-neutral-400" />
            {openMenu === "profile" && <DropdownMenu items={PROFILE_MENU} />}
          </button>

          {/* NOTIFICATIONS */}
          <button
            className="relative cursor-pointer"
            onClick={() => toggleMenu("notifications")}
          >
            <FiBell size={20} className="text-neutral-400 hover:text-white" />
            {openMenu === "notifications" && (
              <div className="absolute top-10 right-0 bg-neutral-900 text-white rounded-md shadow-md w-56 p-3 border border-neutral-700">
                <p className="text-sm text-neutral-400">No new notifications</p>
              </div>
            )}
          </button>

          {/* MESSAGES */}
          <button
            className="relative cursor-pointer"
            onClick={() => toggleMenu("messages")}
          >
            <FiMail size={20} className="text-neutral-400 hover:text-white" />
            {openMenu === "messages" && (
              <div className="absolute top-10 right-0 bg-neutral-900 text-white rounded-md shadow-md w-56 p-3 border border-neutral-700">
                <p className="text-sm text-neutral-400">No messages</p>
              </div>
            )}
          </button>

          {/* MORE MENU */}
          <button
            className="relative cursor-pointer"
            onClick={() => toggleMenu("menu")}
          >
            <FiMoreHorizontal
              size={20}
              className="text-neutral-400 hover:text-white"
            />
            {openMenu === "menu" && <DropdownMenu items={MORE_MENU} />}
          </button>
        </div>
      </div>

      {/* MOBILE */}
      {openMenu === "mobile" && (
        <div className="md:hidden bg-neutral-900 border-t border-neutral-700 p-4">
          <div className="flex flex-col gap-4">
            {LEFT_ROUTES.map((route) => (
              <NavBarItem
                key={route.label}
                label={route.label}
                href={route.href}
              />
            ))}

            {RIGHT_ROUTES.map((route) => (
              <NavBarItem
                key={route.label}
                label={route.label}
                href={route.href}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavBar;
