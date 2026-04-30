"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";

interface NavBarItemProps {
  label: string;
  href: string;
  onClick?: () => void; // Optional onClick handler for hamburger menu items
}

const NavBarItem: React.FC<NavBarItemProps> = ({ label, href, onClick }) => {
  const pathname = usePathname();

  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={twMerge(
        "relative text-sm font-bold transition",
        isActive ? "text-white" : "text-neutral-400 hover:text-white"
      )}
    >
      {label}

      {isActive && (
        <span className="absolute left-0 -bottom-3 w-full h-1 bg-white transition-all duration-200"></span>
      )}
    </Link>
  );
};

export default NavBarItem;