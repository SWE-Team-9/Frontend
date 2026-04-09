"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface CoverPhotoProps {
  isOwner?: boolean;
  onUpload?: (file: File) => Promise<string | undefined>;
  coverUrl?: string | null;
}

export function CoverPhoto({
  isOwner,
  onUpload,
  coverUrl,
}: CoverPhotoProps = {}) {
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(coverUrl ?? null);
  const [showPopup, setShowPopup] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scaledSize, setScaledSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [isValidImage, setIsValidImage] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MIN_WIDTH = 1200;
  const MIN_HEIGHT = 520;
  const MAX_SIZE = 2 * 1024 * 1024;
  
  const handleUploadClick = () => {
    if (finalImage) {
      setShowDropdown(!showDropdown);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleReplaceImage = () => {
    fileInputRef.current?.click();
    setShowDropdown(false);
  };

  const handleDeleteImage = () => {
    setShowDeleteConfirm(true);
    setShowDropdown(false);
  };

  const handleDelete = () => {
    setFinalImage(null);
    setShowDeleteConfirm(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.onload = () => {
          const isTooSmall = img.width < MIN_WIDTH || img.height < MIN_HEIGHT;
          const isTooLarge = file.size > MAX_SIZE;
          const valid = !isTooSmall && !isTooLarge;
          setIsValidImage(valid);
          setTempImage(reader.result as string);
          setPos({ x: 0, y: 0 });
          setZoom(1);
          setShowPopup(true);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging || !containerRef.current || !imageRef.current) return;
      const newX = e.clientX - offset.x;
      const newY = e.clientY - offset.y;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      const imageWidth = scaledSize.width;
      const imageHeight = scaledSize.height;
      if (!imageWidth || !imageHeight) return;
      const minX = containerWidth - imageWidth;
      const minY = containerHeight - imageHeight;
      const clampedX = Math.max(minX, Math.min(0, newX));
      const clampedY = Math.max(minY, Math.min(0, newY));
      setPos({ x: clampedX, y: clampedY });
    };
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, offset, scaledSize]);

  useEffect(() => {
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current;
      const image = imageRef.current;
      const scale = Math.max(
        container.offsetWidth / image.naturalWidth,
        container.offsetHeight / image.naturalHeight,
      );
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      setScaledSize({ width, height });
      setPos({
        x: (container.offsetWidth - width) / 2,
        y: (container.offsetHeight - height) / 2,
      });
    }
  }, [tempImage]);

  const handleSave = async () => {
    if (!tempImage || !containerRef.current || !imageRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = imageRef.current;
    const scale = Math.max(
      canvas.width / img.naturalWidth,
      canvas.height / img.naturalHeight,
    );
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    ctx.drawImage(img, pos.x, pos.y, width, height);
    const croppedData = canvas.toDataURL("image/png");
    setFinalImage(croppedData);
    setShowPopup(false);
    setTempImage(null);
    // Upload to backend so it persists
    if (onUpload) {
      const blob = await fetch(croppedData).then((r) => r.blob());
      const file = new File([blob], "cover.png", { type: "image/png" });
      await onUpload(file);
    }
  };

  const handleCancel = () => {
    setTempImage(null);
    setShowPopup(false);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {finalImage && (
        <Image
          src={finalImage}
          alt="Cover photo"
          fill
          className="object-cover absolute"
          unoptimized
        />
      )}

      {isOwner && (
        <div className="absolute top-8 right-5 flex flex-col items-end gap-2 z-10">
          <button
            onClick={handleUploadClick}
            className={`bg-zinc-800 px-4 py-2 text-sm rounded cursor-pointer hover:bg-zinc-700 transition-colors
            ${showDropdown ? "text-orange-500" : "text-white"}`}
          >
            {finalImage ? "Update image" : "Update image"}
          </button>

          {finalImage && showDropdown && (
            <div className="bg-zinc-950 border border-zinc-800 shadow-lg flex flex-col gap-1 min-w-25 animate-slideDown">
              <button
                onClick={handleReplaceImage}
                className="text-white text-sm px-3 py-2 rounded hover:text-slate-300 transition-colors text-left"
              >
                Replace image
              </button>
              <button
                onClick={handleDeleteImage}
                className="text-white text-sm px-3 py-2 rounded hover:text-slate-300 transition-colors text-left"
              >
                Delete image
              </button>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {showPopup && tempImage && (
        <div className="fixed inset-0 bg-white/35 z-50 flex justify-center items-start overflow-y-auto pt-20">
          <div className="bg-[#1E1E1E] p-5 rounded-sm shadow-lg w-full max-w-212.5 text-left animate-slideDown max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Position and resize your profile header
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-white text-sm mb-2 leading-snug">
              For best results, upload PNG or JPG images of at least 2480x520
              pixels. 2MB file-size limit. Avoid using text within your header
              image, as it will be cropped on smaller screens.
            </p>
            <div
              ref={containerRef}
              className="w-full h-55 mb-2 overflow-hidden rounded-none border border-gray-700 relative"
            >
              <Image
                ref={imageRef}
                src={tempImage}
                alt="Cover photo preview"
                onMouseDown={handleMouseDown}
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                  position: "absolute",
                  width: `${scaledSize.width}px`,
                  height: `${scaledSize.height}px`,
                  objectFit: "cover",
                }}
                className="cursor-grab active:cursor-grabbing select-none will-change-transform"
              />
              <div className="absolute bottom-4 left-4 w-16 h-16">
                <Image
                  src="/images/profile.png"
                  alt="Avatar overlay"
                  fill
                  className="rounded-full border-2 border-white object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-4">
              {isValidImage ? (
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                    className="text-white bg-[#404040] px-2 py-1 rounded"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-75 appearance-none h-2 rounded-lg cursor-pointer bg-zinc-800 accent-white"
                  />
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="text-white bg-[#404040] px-2 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              ) : (
                <p className="text-white text-sm">
                  ⚠️ The image is small and may appear blurry.
                </p>
              )}
              <div className="flex justify-end gap-3 mt-2 sm:mt-0">
                <button
                  onClick={handleCancel}
                  className="bg-[#3A3A3A] text-white px-4 py-2 rounded-md hover:bg-[#2e2e2e] text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-white/25 flex justify-center items-start z-50">
          <div className="bg-black p-3 rounded-lg shadow-xl w-87.5 text-left animate-slideDown mt-[10vh] h-40">
            <h2 className="text-xl font-bold mb-2 text-white">Are you sure?</h2>
            <p className="text-sm text-zinc-100 mb-4">
              Please confirm that you want to delete this image.
              <br />
              This action cannot be reversed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-[#333333] text-white px-3 py-1 rounded hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-white text-black px-3 py-1 rounded hover:bg-gray-600 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
