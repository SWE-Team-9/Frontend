"use client";

import Link from "next/link";
import { twMerge } from "tailwind-merge";

interface SideBarItemProps {
  label: string;
  href: string;
  className?: string;
}

const SideBarItem: React.FC<SideBarItemProps> = ({ label, href, className }) => {
  return (
    <Link
      href={href}
      className={twMerge(
        "flex flex-row h-auto items-center w-full gap-x-4 text-md font-bold text-white ",
        className
      )}
    >
      {label}
    </Link>
  );
};

export default SideBarItem;
