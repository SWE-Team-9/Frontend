"use client";

import React, { useEffect, useState } from "react";

interface Props {
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "DONE" | "ERROR";
}

const FileStatusBadge: React.FC<Props> = ({ status }) => {
  const [dots, setDots] = useState("");

  // Animate dots for UPLOADING
  useEffect(() => {
    if (status !== "UPLOADING") return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 5 ? "" : prev + " ."));
    }, 500);

    return () => clearInterval(interval);
  }, [status]);

  const baseStyle = "px-4 py-2 rounded-full border text-lg font-semibold flex items-center gap-2";

const statusStyles = {
    PENDING: "border-gray-400 text-gray-500",
    UPLOADING: "border-blue-500 text-blue-500",
    PROCESSING: "border-yellow-500 text-yellow-600",
    DONE: "border-green-500 text-green-600",
    ERROR: "border-red-500 text-red-600",
  };

  if (status === "UPLOADING") {
    return (
      <span className={`${baseStyle} ${statusStyles.UPLOADING}`}>
        Uploading{dots}
      </span>
    );
  }

  if (status === "PROCESSING") {
    return (
      <span className={`${baseStyle} ${statusStyles.PROCESSING}`}>
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
        Processing
      </span>
    );
  }

  return (
    <span className={`${baseStyle} ${statusStyles[status]}`}>
      {status}
    </span>
  );
};

export default FileStatusBadge;