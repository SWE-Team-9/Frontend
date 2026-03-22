"use client";
import { useState } from "react";
import Cropper from "react-easy-crop";

// Component for uploading and editing avatar image
export function AvatarUpload({
  onUpload,
  username,
  location,
}: {
  onUpload?: (url: string) => void;
  username: string;
  location: string;
}) {
  // -----------------------------
  // State variables
  // -----------------------------
  const [preview, setPreview] = useState<string | null>(null); // Final preview image
  const [showEditor, setShowEditor] = useState(false); // Toggle Cropper editor
  const [tempImage, setTempImage] = useState<string | null>(null); // Temporary image for editing

  const [zoom, setZoom] = useState(1); // Zoom level in cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 }); // Crop position

  const [showOptions, setShowOptions] = useState(false); // Show dropdown options
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show delete confirmation

  // -----------------------------
  // Added state for validation
  // -----------------------------
  const [isValidImage, setIsValidImage] = useState(true); // Check if image is large enough

  // -----------------------------
  // NEW: store cropped area
  // -----------------------------
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle image selection
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          // -----------------------------
          // Check image size
          // -----------------------------
          const isTooSmall = img.width < 1000 || img.height < 1000;
          setIsValidImage(!isTooSmall);

          // -----------------------------
          // Always allow image
          // -----------------------------
          const url = reader.result as string;
          setTempImage(url);
          setShowEditor(true); // Open editor

          // -----------------------------
          // Force minimum zoom to cover circle
          // -----------------------------

          const minZoom = Math.max(1, 480 / Math.min(img.width, img.height));
          setZoom(minZoom);
        };

        img.src = reader.result as string;
      };

      reader.readAsDataURL(file);
    }
  };
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createCroppedImage = async () => {
    if (!tempImage || !croppedAreaPixels) return null;

    const image = new Image();
    image.src = tempImage;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
    );

    return canvas.toDataURL("image/png");
  };

  const handleSave = async () => {
    // Save edited image
    const croppedImage = await createCroppedImage();

    if (croppedImage) {
      setPreview(croppedImage);
      onUpload?.(croppedImage);
    }
    setShowEditor(false);
  };

  const handleDelete = () => {
    // Delete preview image
    setPreview(null);
    setShowDeleteConfirm(false);
  };

  // -----------------------------
  // JSX Rendering
  // -----------------------------
  return (
    <>
      {/* Avatar container */}
      <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full bg-zinc-400/30 flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group">
        {/* Show preview if exists */}
        {preview ? (
          <img
            src={preview}
            className="w-full h-full rounded-full object-cover"
            alt="Avatar"
          />
        ) : (
          <span className="text-[10px] md:text-xs font-bold">Upload image</span>
        )}

        {/* Hover overlay for updating image */}
        {preview ? (
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
          >
            Update image
          </button>
        ) : (
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
            Upload image
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Dropdown options for preview */}
      {showOptions && preview && (
        <div className="absolute mt-50 left-[11.5%] -translate-x-1/2 w-40">
          <div className="mb-2">
            <label
              className="cursor-pointer block w-full"
              onClick={() => setShowOptions(!showOptions)}
            >
              <div className="bg-zinc-800 text-orange-500 text-xs font-bold text-center uppercase tracking-wider p-2 shadow-lg border border-zinc-700/50 hover:bg-zinc-700 w-30">
                Update Image
              </div>
            </label>
          </div>

          <div className="bg-zinc-950 text-white  shadow-lg p-2 flex flex-col gap-2 w-30 border border-zinc-700/50">
            {/* Replace image option */}
            <label className="cursor-pointer hover:text-slate-500 px-2 py-1 rounded text-xs block w-full text-left transition-colors">
              Replace image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleUpload(e);
                  setShowOptions(false);
                }}
                className="hidden"
              />
            </label>
            {/* Delete image option */}
            <button
              onClick={() => {
                setShowOptions(false);
                setShowDeleteConfirm(true);
              }}
              className="cursor-pointer hover:text-slate-500 px-2 py-1 rounded text-xs block w-full text-left transition-colors"
            >
              Delete image
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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

      {/* Cropper editor popup */}
      {showEditor && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          {/* Close button */}
          <button
            onClick={() => setShowEditor(false)}
            className="absolute top-6 right-6 text-black text-2xl font-bold hover:text-zinc-700"
          >
            ×
          </button>

          <div className="bg-zinc-900 p-5 rounded-xl flex flex-col items-center gap-4 w-125 shadow-2xl">
            {/* User info */}
            <h2 className="text-white font-bold text-2xl">{username}</h2>
            <p className="text-zinc-400 text-sm">{location}</p>
            <p className="text-zinc-300 text-xs">
              For best results, upload images of at least{" "}
              <strong>1000×1000 pixels</strong>. 2MB file-size limit.
            </p>

            {/* Cropper container */}
            <div className="relative w-120 h-120 rounded-full overflow-hidden bg-transparent shadow-lg">
              <Cropper
                image={tempImage!}
                crop={crop}
                zoom={Math.max(zoom, isValidImage ? 1 : 1)}
                aspect={1}
                cropShape="round"
                objectFit="cover"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                restrictPosition={true} // Prevent image from going out of frame
              />
            </div>

            {/* Zoom & action buttons */}
            <div className="flex items-center justify-between w-full mt-6">
              {isValidImage ? (
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(1, z - 0.1))}
                    className="bg-zinc-800 text-white px-3 py-2 rounded hover:bg-zinc-700 transition"
                  >
                    -
                  </button>

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 appearance-none h-2 rounded-lg cursor-pointer bg-zinc-800 accent-zinc-800"
                  />

                  <button
                    onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
                    className="bg-zinc-800 text-white px-3 py-2 rounded hover:bg-zinc-700 transition"
                  >
                    +
                  </button>
                </div>
              ) : (
                <p className="text-zinc-400 text-sm flex-1">
                  ⚠️ Image is too small and may appear blurry
                </p>
              )}

              <div className="flex gap-3 ml-6">
                <button
                  onClick={() => setShowEditor(false)}
                  className="bg-zinc-800 text-white px-2 py-2 rounded text-sm hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-white text-black px-2 py-2 rounded font-bold text-sm hover:bg-gray-200 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
