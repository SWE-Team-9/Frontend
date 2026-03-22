'use client'
import { useState, useRef, useEffect } from 'react'

// Main component for Cover Photo functionality
export function CoverPhoto() {
  // -----------------------------
  // State variables
  // -----------------------------
  const [tempImage, setTempImage] = useState<string | null>(null) // Temporary image for preview
  const [finalImage, setFinalImage] = useState<string | null>(null) // Final saved image
  const [showPopup, setShowPopup] = useState(false) // Controls preview popup visibility
  const [showDropdown, setShowDropdown] = useState(false) // Controls dropdown menu visibility
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false) // Controls delete confirmation modal

  const [pos, setPos] = useState({ x: 0, y: 0 }) // Position of the draggable image
  const [dragging, setDragging] = useState(false) // Is user dragging the image
  const [offset, setOffset] = useState({ x: 0, y: 0 }) // Mouse offset while dragging
  const [scaledSize, setScaledSize] = useState({ width: 0, height: 0 }) // Scaled size of image inside container

  const [zoom, setZoom] = useState(1) // Zoom level for image
  const [isValidImage, setIsValidImage] = useState(false) // Checks if image meets size requirements

  // -----------------------------
  // Refs for DOM elements
  // -----------------------------
  const containerRef = useRef<HTMLDivElement>(null) // Container for the image
  const imageRef = useRef<HTMLImageElement>(null) // Image element
  const fileInputRef = useRef<HTMLInputElement>(null) // Hidden file input

  // -----------------------------
  // Constants for validation
  // -----------------------------
  const MIN_WIDTH = 1200
  const MIN_HEIGHT = 520
  const MAX_SIZE = 2 * 1024 * 1024 // 2MB

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleUploadClick = () => {
    // If image exists, toggle dropdown, else open file picker
    if (finalImage) {
      setShowDropdown(!showDropdown)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleReplaceImage = () => {
    // Open file picker for replacing image
    fileInputRef.current?.click()
    setShowDropdown(false)
  }

  const handleDeleteImage = () => {
    // Show delete confirmation modal
    setShowDeleteConfirm(true)
    setShowDropdown(false)
  }

  const handleDelete = () => {
    // Delete the final image
    setFinalImage(null)
    setShowDeleteConfirm(false)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Handle file selection
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const isTooSmall = img.width < MIN_WIDTH || img.height < MIN_HEIGHT
          const isTooLarge = file.size > MAX_SIZE
          const valid = !isTooSmall && !isTooLarge
          setIsValidImage(valid)
          setTempImage(reader.result as string)
          setPos({ x: 0, y: 0 })
          setZoom(1)
          setShowPopup(true)
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Start dragging image
    setDragging(true)
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
  }

  // -----------------------------
  // Effect: Handle dragging
  // -----------------------------
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!dragging || !containerRef.current || !imageRef.current) return
      const newX = e.clientX - offset.x
      const newY = e.clientY - offset.y
      const containerWidth = containerRef.current.offsetWidth
      const containerHeight = containerRef.current.offsetHeight
      const imageWidth = scaledSize.width
      const imageHeight = scaledSize.height
      if (!imageWidth || !imageHeight) return
      const minX = containerWidth - imageWidth
      const minY = containerHeight - imageHeight
      const clampedX = Math.max(minX, Math.min(0, newX))
      const clampedY = Math.max(minY, Math.min(0, newY))
      setPos({ x: clampedX, y: clampedY })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, offset, scaledSize])

  // -----------------------------
  // Effect: Set image scaled size when loaded
  // -----------------------------
  useEffect(() => {
    if (containerRef.current && imageRef.current) {
      const container = containerRef.current
      const image = imageRef.current
      const scale = Math.max(
        container.offsetWidth / image.naturalWidth,
        container.offsetHeight / image.naturalHeight
      )
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale
      setScaledSize({ width, height })
      setPos({
        x: (container.offsetWidth - width) / 2,
        y: (container.offsetHeight - height) / 2
      })
    }
  }, [tempImage])

  const handleSave = () => {
    // Save the cropped image as final image
    if (!tempImage || !containerRef.current || !imageRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = imageRef.current
    const scale = Math.max(
      canvas.width / img.naturalWidth,
      canvas.height / img.naturalHeight
    )
    const width = img.naturalWidth * scale
    const height = img.naturalHeight * scale
    ctx.drawImage(img, pos.x, pos.y, width, height)
    const croppedData = canvas.toDataURL('image/png')
    setFinalImage(croppedData)
    setShowPopup(false)
    setTempImage(null)
  }

  const handleCancel = () => {
    // Cancel preview and discard temp image
    setTempImage(null)
    setShowPopup(false)
  }

  // -----------------------------
  // JSX Rendering
  // -----------------------------
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Render final image if exists */}
      {finalImage && (
        <img 
          src={finalImage} 
          className="w-full h-full object-cover absolute"
        />
      )}
      
      {/* Dropdown and update button */}
      <div className="absolute top-8 right-5 flex flex-col items-end gap-2 z-10">
        <button
          onClick={handleUploadClick}
          className={`bg-zinc-800 px-4 py-2 text-sm rounded cursor-pointer hover:bg-zinc-700 transition-colors
          ${showDropdown ? 'text-orange-500' : 'text-white'}`}
        >
          {finalImage ? 'Update image' : 'Update image'}
        </button>
        
        {/* Dropdown options */}
        {finalImage && showDropdown && (
          <div className="bg-zinc-950 border border-zinc-800 shadow-lg flex flex-col gap-1 min-w-[100px] animate-slideDown">
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {/* Popup for positioning and zooming */}
      {showPopup && tempImage && (
        <div className="fixed inset-0 bg-white/35 flex justify-center items-start pt-20 z-50">
          <div className="bg-[#1E1E1E] p-5 rounded-sm shadow-lg w-full max-w-[850px] text-left animate-slideDown">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">
                Position and resize your profile header
              </h2>
              <button onClick={handleCancel} className="text-gray-400 hover:text-white">✕</button>
            </div>
            {/* Info text */}
            <p className="text-white text-sm mb-2 leading-snug">
              For best results, upload PNG or JPG images of at least 2480x520 pixels. 
              2MB file-size limit. Avoid using text within your header image, as it 
              will be cropped on smaller screens.
            </p>
            {/* Image container */}
            <div 
              ref={containerRef}
              className="w-full h-[220px] mb-2 overflow-hidden rounded-none border border-gray-700 relative"
            >
              {/* Draggable image */}
              <img 
                ref={imageRef}
                src={tempImage} 
                onMouseDown={handleMouseDown}
                style={{ 
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
                  position: 'absolute',
                  width: `${scaledSize.width}px`,
                  height: `${scaledSize.height}px`,
                  objectFit: 'cover'
                }}
                className="cursor-grab active:cursor-grabbing select-none will-change-transform"
              />
              {/* Avatar overlay */}
              <img
                src="/path-to-avatar.png"
                className="absolute bottom-4 left-4 w-16 h-16 rounded-full border-2 border-white"
              />
            </div>
            {/* Controls */}
            <div className="flex justify-between items-center gap-3 mt-4">
              {isValidImage && (
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
                    className="w-[300px] appearance-none h-2 rounded-lg cursor-pointer bg-zinc-800 accent-white"
                  />
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                    className="text-white bg-[#404040] px-2 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              )} 
              {!isValidImage && (
                <p className="text-white text-sm ">
                  ⚠️ The image is small and may appear blurry.
                </p>
              )}
              {/* Save & Cancel buttons */}
              <div className="flex justify-end gap-3">
                <button onClick={handleCancel} className="bg-[#3A3A3A] text-white px-4 py-2 rounded-md hover:bg-[#2e2e2e] text-sm">
                  Cancel
                </button>
                <button onClick={handleSave} className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 text-sm">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-white/25 flex justify-center items-start z-50 ">
          <div 
            className="bg-black p-3 rounded-lg shadow-xl w-[350px] text-left animate-slideDown mt-[10vh] h-[160px]"
          >
            <h2 className="text-xl font-bold mb-2 text-white">Are you sure?</h2>
            <p className="text-sm text-zinc-100 mb-4">
              Please confirm that you want to delete this image.<br/>
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
  )
}