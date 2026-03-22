'use client'
import { useState } from 'react'

export function CoverPhoto() {
  const [preview, setPreview] = useState<string | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
  <div className="absolute inset-0">
    
    {preview && (
      <img 
        src={preview} 
        className="w-full h-full object-cover"
      />
    )}

    <label className="absolute top-4 right-4 bg-black/80 text-white px-4 py-2 text-sm rounded cursor-pointer z-10">
      Upload header image
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </label>

  </div>
)
}