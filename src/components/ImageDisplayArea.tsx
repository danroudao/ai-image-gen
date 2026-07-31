'use client'

import { useState, useEffect } from 'react'
import { ImageDown, AlertCircle, FileText, Check, Loader2, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbox } from './Lightbox'
import { SafeImage } from './SafeImage'

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
  progress?: number | null
  error: string | null
  cost: number | null
  model?: string
  params: { size: string; resolution: string } | null
  prompt: string
  onReusePrompt: (prompt: string) => void
  onUseAsRef: (url: string) => Promise<void>
  onDeleteImage?: (index: number) => void
  failedTasks?: { prompt: string; error?: string }[]
}

export function ImageDisplayArea({
  images,
  isGenerating,
  progress,
  error,
  cost,
  model,
  params,
  prompt,
  onReusePrompt,
  onUseAsRef,
  onDeleteImage,
  failedTasks,
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
          {isGenerating && (
            <div className="flex items-center gap-2.5 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <span className="text-xs text-muted-foreground shrink-0">
                正在生成 {progress ?? 0}% · 已有 {images.length} 张
              </span>
              <div className="flex-1 h-1.5 min-w-0 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.max(4, progress ?? 0)}%` }}
                />
              </div>
            </div>
          )}
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
                <SafeImage
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
            {model && (
              <span className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium ${
                model === 'gpt-image-2-official'
                  ? 'border-blue-500/30 bg-blue-500/10 text-blue-600'
                  : 'border-muted-foreground/20 bg-muted-foreground/10 text-muted-foreground'
              }`}>
                {model === 'gpt-image-2-official' ? 'Official' : 'APIB'}
              </span>
            )}
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
          {failedTasks && failedTasks.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {failedTasks.map((t, i) => (
                <p key={i} className="text-xs text-destructive/80">
                  {t.prompt}: {t.error || '未知错误'}
                </p>
              ))}
            </div>
          )}
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
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">正在生成图片，请稍候...</p>
          <div className="w-full max-w-xs space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(4, progress ?? 0)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center tabular-nums">
              进度 {progress ?? 0}%
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <ImageDown className="h-10 w-10" />
        </div>
        <p className="font-medium">等待生成</p>
        <p className="text-sm">输入描述词，点击生成按钮开始创作</p>
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
