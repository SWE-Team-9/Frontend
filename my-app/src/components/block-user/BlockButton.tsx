"use client";

import { useState } from "react";

interface Props {
  isBlocked: boolean;
  onClick: () => void;
}

export default function BlockButton({ isBlocked, onClick }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={onClick} className="text-red-500">
        {isBlocked ? "Unblock" : "Block"}
      </button>
    </>
  );
}