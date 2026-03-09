"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { twMerge } from "tailwind-merge";

interface NavBarItemProps {
  label: string;
  href: string;
}

const NavBarItem: React.FC<NavBarItemProps> = ({ label, href }) => {
  const pathname = usePathname();

  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={twMerge(
        "relative text-sm font-bold transition",
        isActive ? "text-white" : "text-neutral-400 hover:text-white"
      )}
    >
      {label}

      {isActive && (
        <span className="absolute left-0 -bottom-3 w-full h-1 bg-white ransition-all duration-200"></span>
      )}
    </Link>
  );
};

export default NavBarItem;