"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useNotificationStore } from "@/src/store/notificationsStore";
import { NotificationType } from "@/src/types/notifications";

const typeOptions: Array<{ value: NotificationType | "all"; label: string }> = [
  { value: "all", label: "All notifications" },
  { value: "like", label: "Likes" },
  { value: "repost", label: "Reposts" },
  { value: "follow", label: "Follows" },
  { value: "comment", label: "Comments" },
];

export function NotificationTypeDropdown() {
  const selectedType = useNotificationStore((state) => state.selectedType);
  const setSelectedType = useNotificationStore(
    (state) => state.setSelectedType,
  );

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    typeOptions.find((option) => option.value === selectedType)?.label ??
    "All notifications";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-52" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-md bg-neutral-700 px-3 py-1 text-sm font-bold text-white hover:bg-neutral-800"
      >
        <span>{selectedLabel}</span>
        {isOpen ? (
          <FiChevronUp className="text-neutral-300" size={28} />
        ) : (
          <FiChevronDown className="text-neutral-300" size={28} />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-md border border-neutral-600 bg-[#1a1a1a] py-2 shadow-2xl">
          {typeOptions.map((option) => {
            const isActive = selectedType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSelectedType(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm font-bold transition ${
                  isActive
                    ? "font-bold text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
