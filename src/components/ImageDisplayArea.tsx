'use client'

import { useState, useRef, useEffect } from 'react'
import { ImageDown, Loader2, AlertCircle, MoreHorizontal, FileText, ImagePlus, Download, Check } from 'lucide-react'
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
  progress: number
  error: string | null
  cost: number | null
  params: { size: string; resolution: string } | null
  prompt: string
  totalTasks: number
  completedTasks: number
  onReusePrompt: (prompt: string) => void
  onUseAsRef: (url: string) => Promise<void>
}

function ImageMenu({ url, prompt, onReusePrompt, onUseAsRef, onClose }: {
  url: string
  prompt: string
  onReusePrompt: (prompt: string) => void
  onUseAsRef: (url: string) => Promise<void>
  onClose: () => void
}) {
  const [refLoading, setRefLoading] = useState(false)
  const [refDone, setRefDone] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleUseAsRef = async () => {
    setRefLoading(true)
    await onUseAsRef(url)
    setRefLoading(false)
    setRefDone(true)
    setTimeout(onClose, 800)
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-10 right-0 z-30 w-40 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors cursor-pointer"
        onClick={() => { onReusePrompt(prompt); onClose() }}
      >
        <FileText className="h-3.5 w-3.5" />
        复用提示词
      </button>
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
        onClick={handleUseAsRef}
        disabled={refLoading || refDone}
      >
        {refLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : refDone ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5" />
        )}
        {refLoading ? '添加中...' : refDone ? '已添加' : '作为参考图'}
      </button>
      <a
        href={url}
        download
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
        onClick={onClose}
      >
        <Download className="h-3.5 w-3.5" />
        下载
      </a>
    </div>
  )
}

export function ImageDisplayArea({
  images,
  isGenerating,
  progress,
  error,
  cost,
  params,
  prompt,
  totalTasks,
  completedTasks,
  onReusePrompt,
  onUseAsRef,
}: ImageDisplayAreaProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [menuIdx, setMenuIdx] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const renderContent = () => {
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
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {totalTasks > 1
              ? `正在生成... (${completedTasks}/${totalTasks})`
              : '正在生成中...'}
          </p>
          {totalTasks > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: totalTasks }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-1.5 rounded-full transition-colors ${
                    i < completedTasks ? 'bg-primary' : i === completedTasks ? 'bg-primary/50 animate-pulse' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          )}
          {totalTasks <= 1 && (
            <div className="w-64 bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary/70 to-primary h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {totalTasks <= 1 && (
            <span className="text-sm text-muted-foreground">{progress}%</span>
          )}
        </div>
      )
    }

    if (images.length > 0) {
      const singleCol = images.length === 1
      return (
        <div className="space-y-4">
          <div
            className={`grid ${singleCol ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}
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
                  className="w-full object-contain max-h-[55vh] transition-transform duration-300 group-hover:scale-[1.02] bg-muted"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ImageDown className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute top-2 right-2 z-10">
                  <button
                    type="button"
                    className="size-7 rounded-md bg-black/50 text-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setMenuIdx(menuIdx === idx ? null : idx) }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {menuIdx === idx && (
                    <ImageMenu
                      url={url}
                      prompt={prompt}
                      onReusePrompt={onReusePrompt}
                      onUseAsRef={onUseAsRef}
                      onClose={() => setMenuIdx(null)}
                    />
                  )}
                </div>
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
      <Card className="h-full">
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
