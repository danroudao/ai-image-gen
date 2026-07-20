'use client'

import { useState, useEffect } from 'react'
import { ImageDown, AlertCircle, FileText, Check, Loader2, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbox } from './Lightbox'

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
  } else {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}

interface ImageDisplayAreaProps {
  images: string[]
  isGenerating: boolean
  error: string | null
  cost: number | null
  params: { size: string; resolution: string } | null
  prompt: string
  onReusePrompt: (prompt: string) => void
  onUseAsRef: (url: string) => Promise<void>
  onDeleteImage?: (index: number) => void
}

export function ImageDisplayArea({
  images,
  isGenerating,
  error,
  cost,
  params,
  prompt,
  onReusePrompt,
  onUseAsRef,
  onDeleteImage,
}: ImageDisplayAreaProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const renderContent = () => {
    if (images.length > 0) {
      const singleCol = images.length === 1
      return (
        <div className="space-y-3 overflow-y-auto min-h-0 max-h-full">
          <div
            className={`grid ${singleCol ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}
            style={singleCol ? { maxWidth: '70%', margin: '0 auto' } : undefined}
          >
            {images.map((url, idx) => (
              <div
                key={idx}
                className="relative group rounded-lg overflow-hidden border bg-muted cursor-pointer"
                onClick={() => setLightboxIndex(idx)}
              >
                <img
                  src={url}
                  alt={`生成图片 ${idx + 1}`}
                  className="w-full object-contain max-h-[45vh] transition-transform duration-300 group-hover:scale-[1.02] bg-muted"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ImageDown className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {onDeleteImage && (
                  <button
                    type="button"
                    className="absolute top-2 right-2 size-7 rounded-md bg-black/50 text-white/90 flex items-center justify-center cursor-pointer z-10 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity hover:bg-black/70"
                    onClick={(e) => { e.stopPropagation(); onDeleteImage(idx) }}
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {params && (
              <>
                <span className="inline-flex h-5 items-center rounded-full border border-transparent bg-secondary px-2 text-xs font-medium text-secondary-foreground">
                  {params.size}
                </span>
                <span className="inline-flex h-5 items-center rounded-full border border-transparent bg-secondary px-2 text-xs font-medium text-secondary-foreground">
                  {params.resolution.toUpperCase()}
                </span>
              </>
            )}
            {cost !== null && (
              <span className="inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium text-muted-foreground">
                费用: ${cost.toFixed(4)}
              </span>
            )}
            {prompt && (
              <button
                type="button"
                className="inline-flex h-5 items-center gap-1 rounded-full border px-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                onClick={() => { copyToClipboard(prompt); setCopied(true) }}
              >
                {copied ? (
                  <><Check className="h-3 w-3" /> 已复制</>
                ) : (
                  <><FileText className="h-3 w-3" /> 复制提示词</>
                )}
              </button>
            )}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">生成失败</p>
          <p className="text-sm max-w-md text-center">{error}</p>
        </div>
      )
    }

    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">正在生成...</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <ImageDown className="h-10 w-10" />
        </div>
        <p className="font-medium">等待生成</p>
        <p className="text-sm">在左侧输入描述词，点击生成按钮开始创作</p>
      </div>
    )
  }

  return (
    <>
      <Card className="h-full bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4 h-full">
          {renderContent()}
        </CardContent>
      </Card>
      {lightboxIndex !== null && (
        <Lightbox
          key={lightboxIndex}
          images={images}
          currentIndex={lightboxIndex}
          prompt={prompt}
          onClose={() => setLightboxIndex(null)}
          onPrev={() =>
            setLightboxIndex(
              lightboxIndex === 0 ? images.length - 1 : lightboxIndex - 1
            )
          }
          onNext={() =>
            setLightboxIndex(
              lightboxIndex === images.length - 1 ? 0 : lightboxIndex + 1
            )
          }
          onReusePrompt={onReusePrompt}
          onUseAsRef={onUseAsRef}
        />
      )}
    </>
  )
}
