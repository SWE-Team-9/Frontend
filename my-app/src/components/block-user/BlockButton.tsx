"use client";
interface Props {
  isBlocked: boolean;
  onClick: () => void;
}

export default function BlockButton({ isBlocked, onClick }: Props) {

  return (
    <>
      <button onClick={onClick} className="text-red-500">
        {isBlocked ? "Unblock" : "Block"}
      </button>
    </>
  );
}