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
import { useAuthStore } from "@/src/store/useAuthStore";
import { logoutUser } from "@/src/services/authService";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  dividerAfter?: boolean;
}

interface NavBarProps {
  children?: React.ReactNode;
  LEFT_ROUTES?: NavItem[];
  RIGHT_ROUTES?: NavItem[];
  PROFILE_MENU?: NavItem[];
  MORE_MENU?: NavItem[];

  showNotifications?: boolean;
  showMessages?: boolean;

  notificationsContent?: React.ReactNode;
  messagesContent?: React.ReactNode;

  showSearch?: boolean;
  className?: string;
}

const NavBar: React.FC<NavBarProps> = ({
  LEFT_ROUTES = [
    { label: "Home", href: "/discover" },
    { label: "Feed", href: "/feed" },
    { label: "Library", href: "/library" },
  ],

  RIGHT_ROUTES = [
    { label: "Try ArtistPro", href: "/pro" },
    { label: "For Artists", href: "/artists" },
    { label: "Upload", href: "/upload" },
  ],

  PROFILE_MENU = [
    { label: "Profile", icon: MdPerson, href: "/profile" },
    { label: "Likes", icon: ImHeart },
    { label: "Playlists", icon: FiList },
    { label: "Stations", icon: IoRadio },
    { label: "Following", icon: BsPersonCheckFill },
    { label: "Who to follow", icon: MdPersonAddAlt1 },
    { label: "Try Artist Pro", icon: MdStars },
    { label: "Tracks", icon: PiWaveformBold },
    { label: "Insights", icon: MdBarChart },
    { label: "Distribute", icon: TbArrowLeftRight },
  ],

  MORE_MENU = [
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
  ],

  showSearch = true,

  showNotifications = true,
  showMessages = true,

  notificationsContent = (
    <div className="absolute top-10 right-0 bg-neutral-900 text-white rounded-md shadow-md w-56 p-3 border border-neutral-700">
      <p className="text-sm text-neutral-400">No new notifications</p>
    </div>
  ),

  messagesContent = (
    <div className="absolute top-10 right-0 bg-neutral-900 text-white rounded-md shadow-md w-56 p-3 border border-neutral-700">
      <p className="text-sm text-neutral-400">No messages</p>
    </div>
  ),

  className = "",
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null); // Ref for detecting clicks outside of the menu

  // Read the current logged-in user from the global auth store
  const user = useAuthStore((state) => state.user);
  // Use the user's avatar if available, otherwise a default silhouette
  const avatarSrc = user?.avatarUrl || "/images/profile.jpg";
  // Display name fallback: use handle or the part before "@" in email
  const displayLabel = user
    ? user.displayName || user.handle || user.email.split("@")[0]
    : null;

  const router = useRouter();

  // Sign-out handler — clears cookies on the backend, clears store
  const handleLogout = async () => {
    await logoutUser();
    router.push("/");
  };

  // Inject the logout action into the "Sign out" menu item
  const moreMenuWithLogout = MORE_MENU.map((item) =>
    item.label === "Sign out" ? { ...item, onClick: handleLogout } : item,
  );

  useEffect(() => {
    // Close menus when clicking outside
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
    <div
      ref={menuRef}
      className={`fixed inset-x-0 z-50 bg-[#121212] py-2 ${className || "w-full mx-auto"}`}
    >
      <div className="max-w-7xl mx-auto flex justify-center items-center gap-8">
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
        {showSearch && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="bg-neutral-800 text-white text-sm px-4 py-1 rounded-md outline-none w-32 sm:w-48 md:w-72 lg:w-96"
            />
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              size={18}
            />
          </div>
        )}

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
              src={avatarSrc}
              alt={displayLabel || "Profile"}
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/profile.jpg"; }}
            />
            {/* Show the user's display name (or handle / email prefix) when logged in */}
            {displayLabel && (
              <span className="hidden lg:block text-white text-sm font-medium max-w-24 truncate">
                {displayLabel}
              </span>
            )}
            <FiChevronDown className="text-neutral-400" />
            {openMenu === "profile" && <DropdownMenu items={PROFILE_MENU} />}
          </button>

          {/* NOTIFICATIONS */}
          {showNotifications && (
            <button
              className="relative cursor-pointer"
              onClick={() => toggleMenu("notifications")}
            >
              <FiBell size={20} className="text-neutral-400 hover:text-white" />
              {openMenu === "notifications" && notificationsContent}
            </button>
          )}

          {/* MESSAGES */}
          {showMessages && (
            <button
              className="relative cursor-pointer"
              onClick={() => toggleMenu("messages")}
            >
              <FiMail size={20} className="text-neutral-400 hover:text-white" />
              {openMenu === "messages" && messagesContent}
            </button>
          )}

          {/* MORE MENU */}
          <button
            className="relative cursor-pointer"
            onClick={() => toggleMenu("menu")}
          >
            <FiMoreHorizontal
              size={20}
              className="text-neutral-400 hover:text-white"
            />
            {openMenu === "menu" && <DropdownMenu items={moreMenuWithLogout} />}
          </button>
        </div>
      </div>

      {/* MOBILE */}
      {openMenu === "mobile" && (
        <div className="md:hidden bg-neutral-900 border-t border-neutral-700 p-4 hover:text-white">
          <div className="flex flex-col gap-4">
            {LEFT_ROUTES.map((route) => (
              <NavBarItem
                key={route.label}
                label={route.label}
                href={route.href}
                onClick={() => setOpenMenu(null)}
              />
            ))}

            {RIGHT_ROUTES.map((route) => (
              <NavBarItem
                key={route.label}
                label={route.label}
                href={route.href}
                onClick={() => setOpenMenu(null)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavBar;
