"use client";

import Link from "next/link";
import { twMerge } from "tailwind-merge";

interface SideBarItemProps {
  label: string;
  href: string;
}

const SideBarItem: React.FC<SideBarItemProps> = ({ label, href }) => {
  return (
    <Link
      href={href}
      className={twMerge(
        "flex flex-row h-auto items-center w-full gap-x-4 text-md cursor-pointer font-bold text-white hover:text-neutral-400 transition",
      )}
    >
      {label}
    </Link>
  );
};

export default SideBarItem;
