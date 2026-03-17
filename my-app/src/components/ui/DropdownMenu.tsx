"use client";

import Link from "next/link";

interface DropdownItem {
  label: string;
  icon?: React.ElementType;      // optional icon
  dividerAfter?: boolean;        // optional divider below the item
  href?: string;                 // optional navigation link
  onClick?: () => void;          // optional custom action
}

interface DropdownMenuProps {
  items: DropdownItem[];
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ items }) => {
  return (
    <div className="absolute top-10 right-0 bg-neutral-900 text-white rounded-md shadow-md w-44 border border-neutral-700">
      {items.map((item, index) => {
        const Icon = item.icon;

        // Prepare the content for icon + label
        const content = (
          <>
            {Icon && <Icon size={18} />}
            {item.label}
          </>
        );

        return (
          <div key={index}>
            {/* If href exists, render as Link for navigation */}
            {item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 cursor-pointer"
              >
                {content}
              </Link>
            ) : (
              // If no href, render as button to allow actions
              <div
                onClick={item.onClick}
                className="flex items-center gap-3 px-3 py-2.5 hover:text-neutral-400 w-full text-left"
              >
                {content}
              </div>
            )}

            {/* Optional divider below the item */}
            {item.dividerAfter && <hr className="border-neutral-700" />}
          </div>
        );
      })}
    </div>
  );
};

export default DropdownMenu;