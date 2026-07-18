'use client'

import { useCallback, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { X, Upload } from 'lucide-react'

export interface UploadedImage {
  id: string
  data: string
  name: string
}

interface ImageUploaderProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxCount?: number
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function ImageUploader({ images, onChange, maxCount = 16 }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const addFiles = useCallback(async (files: FileList) => {
    const remaining = maxCount - images.length
    if (remaining <= 0) return
    const fileArray = Array.from(files).slice(0, remaining)

    const results: UploadedImage[] = []
    for (const f of fileArray) {
      try {
        const data = await toBase64(f)
        results.push({ id: uuidv4(), data, name: f.name })
      } catch {
        // skip files that fail to read
      }
    }
    if (results.length > 0) {
      onChange([...images, ...results])
    }
  }, [images, onChange, maxCount])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      addFiles(files)
    }
    e.target.value = ''
  }

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = () => setIsDragOver(false)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        参考图{images.length > 0 && ` (${images.length}/${maxCount})`}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          拖拽或点击上传参考图（最多 {maxCount} 张）
        </p>
      </div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group w-16 h-16 rounded-md overflow-hidden border">
              <img
                src={img.data}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
