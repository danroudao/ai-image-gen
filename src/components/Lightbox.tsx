'use client'

import { useEffect, useCallback, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Download, FileText, ImagePlus, Check, Loader2 } from 'lucide-react'

interface LightboxProps {
  images: string[]
  currentIndex: number
  prompt: string
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onReusePrompt: (prompt: string) => void
  onUseAsRef: (url: string) => Promise<void>
}

export function Lightbox({ images, currentIndex, prompt, onClose, onPrev, onNext, onReusePrompt, onUseAsRef }: LightboxProps) {
  const [refLoading, setRefLoading] = useState(false)
  const [refDone, setRefDone] = useState(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    },
    [onClose, onPrev, onNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  const currentUrl = images[currentIndex]
  if (!currentUrl) return null

  const handleUseAsRef = async () => {
    setRefLoading(true)
    await onUseAsRef(currentUrl)
    setRefLoading(false)
    setRefDone(true)
    setTimeout(() => setRefDone(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        className="absolute top-2 md:top-4 right-2 md:right-4 text-white/80 hover:text-white z-10 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
        onClick={onClose}
      >
        <X className="h-6 md:h-8 w-6 md:w-8" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); onPrev() }}
          >
            <ChevronLeft className="h-8 md:h-10 w-8 md:w-10" />
          </button>
          <button
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); onNext() }}
          >
            <ChevronRight className="h-8 md:h-10 w-8 md:w-10" />
          </button>
        </>
      )}

      <div className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={currentUrl}
          alt={`生成图片 ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg"
        />

        <div className="flex items-center justify-center gap-1 md:gap-3 flex-nowrap">
          <button
            type="button"
            className="inline-flex items-center gap-1 md:gap-1.5 px-1.5 md:px-3 h-6 md:h-8 rounded-md bg-white/15 text-white/90 text-[11px] md:text-sm hover:bg-white/25 transition-colors cursor-pointer"
            onClick={() => { onReusePrompt(prompt); onClose() }}
          >
            <FileText className="h-3 md:h-4 w-3 md:w-4" />
            复用提示词
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 md:gap-1.5 px-1.5 md:px-3 h-6 md:h-8 rounded-md bg-white/15 text-white/90 text-[11px] md:text-sm hover:bg-white/25 transition-colors cursor-pointer disabled:opacity-50"
            onClick={handleUseAsRef}
            disabled={refLoading || refDone}
          >
            {refLoading ? (
              <Loader2 className="h-3 md:h-4 w-3 md:w-4 animate-spin" />
            ) : refDone ? (
              <Check className="h-3 md:h-4 w-3 md:w-4 text-green-400" />
            ) : (
              <ImagePlus className="h-3 md:h-4 w-3 md:w-4" />
            )}
            {refLoading ? '添加中...' : refDone ? '已添加' : '作为参考图'}
          </button>
          <a
            href={currentUrl}
            download
            className="inline-flex items-center gap-1 md:gap-1.5 px-1.5 md:px-3 h-6 md:h-8 rounded-md bg-white/15 text-white/90 text-[11px] md:text-sm hover:bg-white/25 transition-colors"
          >
            <Download className="h-3 md:h-4 w-3 md:w-4" />
            下载
          </a>
        </div>
      </div>

      <div className="absolute bottom-4 text-white/60 text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
