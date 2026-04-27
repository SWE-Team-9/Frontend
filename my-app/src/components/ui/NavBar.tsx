"use client";
import Image from "next/image";
import DropdownMenu from "@/src/components/ui/DropdownMenu";
import NavBarItem from "@/src/components/ui/NavBarItem";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { MdPerson, MdPersonAddAlt1, MdStars, MdBarChart } from "react-icons/md";
import { BsPersonCheckFill } from "react-icons/bs";
import { ImHeart } from "react-icons/im";
import { PiWaveformBold } from "react-icons/pi";
import SearchBar from "@/src/components/search/SearchBar";
import { IoRadio } from "react-icons/io5";
import { TbArrowLeftRight } from "react-icons/tb";
import {
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
// --- NEW IMPORTS ---
import { useLikeStore } from "@/src/store/likeStore";
import { useRepostStore } from "@/src/store/repostStore";
import MessagesDropdown from "@/src/components/messages/MessagesDropdown";
import { useMessageStore } from "@/src/store/messageStore";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType;
  dividerAfter?: boolean;
}

interface NavBarProps {
  children?: React.ReactNode;
  leftRoutes?: NavItem[];
  rightRoutes?: NavItem[];
  profileMenu?: NavItem[];
  moreMenu?: NavItem[];

  showNotifications?: boolean;
  showMessages?: boolean;
  showProfile?: boolean;
  showMoreMenu?: boolean;
  showSearch?: boolean;

  notificationsContent?: React.ReactNode;
  messagesContent?: React.ReactNode;

  className?: string;
}

const NavBar: React.FC<NavBarProps> = ({
  leftRoutes = [
    { label: "Home", href: "/discover" },
    { label: "Feed", href: "/feed" },
    { label: "Library", href: "/library/overview" },
  ],

  rightRoutes = [
    { label: "Try ArtistPro", href: "/pro" },
    { label: "For Artists", href: "/artists" },
    { label: "Upload", href: "/upload" },
  ],

  profileMenu = [
    { label: "Profile", icon: MdPerson, href: "/profiles" },
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

  moreMenu = [
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
    { label: "Settings", href: "/settings" },
    { label: "Sign out" },
  ],

  showSearch = true,
  showNotifications = true,
  showMessages = true,
  showProfile = true,
  showMoreMenu = true,

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
  const syncLikes = useLikeStore((state) => state.syncWithServer);
  const syncReposts = useRepostStore((state) => state.syncWithServer);
  // Use the user's avatar if available, otherwise a default silhouette
  const [profileImageSrc, setProfileImageSrc] = useState(
    user?.avatarUrl || "/images/profile.png",
  );
  // Display name fallback: use handle or the part before "@" in email
  const displayLabel = user
    ? user.displayName || user.handle || user.email.split("@")[0]
    : null;

  const unreadMessageCount = useMessageStore((state) => state.unreadCount);
  const loadUnreadCount = useMessageStore((state) => state.loadUnreadCount);

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();
    }
  }, [user?.id, loadUnreadCount]);

  // --- SYNC INTERACTIONS ON LOAD ---
  useEffect(() => {
    if (user?.id) {
      // Fetch user's likes and reposts from API to populate local stores
      syncLikes(user.id);
      syncReposts(user.id);
    }
  }, [user?.id, syncLikes, syncReposts]);
  const router = useRouter();

  useEffect(() => {
    setProfileImageSrc(user?.avatarUrl || "/images/profile.png");
  }, [user]);

  // Sign-out handler — clears cookies on the backend, clears store
  const handleLogout = useCallback(async () => {
    await logoutUser();
    router.push("/");
  }, [router]);

  // Update Profile Menu to use the handle
  const dynamicProfileMenu = useMemo(() => {
    return profileMenu.map((item) => {
      if (item.label === "Profile" && user?.handle) {
        return { ...item, href: `/profiles/${user.handle}` };
      }
      return item;
    });
  }, [profileMenu, user?.handle]);

  // Inject Logout handler
  const moreMenuWithLogout = useMemo(() => {
    return moreMenu.map((item) =>
      item.label === "Sign out" ? { ...item, onClick: handleLogout } : item,
    );
  }, [moreMenu, handleLogout]);

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
          <div className="flex items-center pt-2">
            <Image
              src="/logo.png"
              alt="Logo"
              width={100}
              height={100}
              className="object-contain "
            />
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => toggleMenu("mobile")}
          >
            <FiMenu size={24} />
          </button>

          {leftRoutes.length > 0 && (
            <div className="hidden md:flex gap-6">
              {leftRoutes.map((route) => (
                <NavBarItem
                  key={route.label}
                  label={route.label}
                  href={route.href}
                />
              ))}
            </div>
          )}
        </div>

        {/* CENTER SECTION */}
        {showSearch && (
          <div className="w-32 sm:w-48 md:w-72 lg:w-86">
            <SearchBar />
          </div>
        )}

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-4">
          {rightRoutes.length > 0 && (
            <div className="hidden lg:flex gap-6">
              {rightRoutes.map((route) => (
                <NavBarItem
                  key={route.label}
                  label={route.label}
                  href={route.href}
                />
              ))}
            </div>
          )}

          {/* PROFILE */}
          {showProfile && (
            <button
              aria-label="Open profile menu"
              className="relative flex items-center gap-1 cursor-pointer"
              onClick={() => toggleMenu("profile")}
            >
              <Image
                src={profileImageSrc}
                width={24}
                height={24}
                alt={displayLabel || "Profile"}
                className="w-6 h-6 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/images/profile.png";
                }}
              />
              {/* Show the user's display name (or handle / email prefix) when logged in */}
              {displayLabel && (
                <span className="hidden lg:block text-white text-sm font-medium max-w-24 truncate">
                  {displayLabel}
                </span>
              )}
              <FiChevronDown className="text-neutral-400" />
              {openMenu === "profile" && (
                <DropdownMenu items={dynamicProfileMenu} />
              )}
            </button>
          )}

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

              {unreadMessageCount > 0 && (
                <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#ff5500] px-1 text-[10px] font-bold leading-none text-white">
                  {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                </span>
              )}

              {openMenu === "messages" && <MessagesDropdown />}
            </button>
          )}

          {/* MORE MENU */}
          {showMoreMenu && (
            <button
              className="relative cursor-pointer"
              onClick={() => toggleMenu("menu")}
            >
              <FiMoreHorizontal
                size={20}
                className="text-neutral-400 hover:text-white"
              />
              {openMenu === "menu" && (
                <DropdownMenu items={moreMenuWithLogout} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE */}
      {openMenu === "mobile" && (
        <div className="md:hidden bg-neutral-900 border-t border-neutral-700 p-4 hover:text-white">
          <div className="flex flex-col gap-4">
            {[...leftRoutes, ...rightRoutes].length > 0 &&
              [...leftRoutes, ...rightRoutes].map((route) => (
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
