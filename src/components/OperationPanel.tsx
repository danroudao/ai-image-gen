'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, Check, ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUploader } from './ImageUploader'
import { AspectRatio, Resolution, GenerationParams } from '@/lib/types'
import { useFormStore } from '@/stores/form-store'

const ASPECT_RATIOS: { value: AspectRatio | 'auto'; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: '1:1', label: '1:1 方图' },
  { value: '16:9', label: '16:9 横图' },
  { value: '9:16', label: '9:16 竖图' },
  { value: '4:3', label: '4:3 横图' },
  { value: '3:4', label: '3:4 竖图' },
  { value: '3:2', label: '3:2 横图' },
  { value: '2:3', label: '2:3 竖图' },
  { value: '2:1', label: '2:1 横图' },
  { value: '1:2', label: '1:2 竖图' },
  { value: '3:1', label: '3:1 全景横图' },
  { value: '1:3', label: '1:3 全景竖图' },
  { value: '21:9', label: '21:9 宽屏' },
  { value: '9:21', label: '9:21 超长竖图' },
  { value: '5:4', label: '5:4 横图' },
  { value: '4:5', label: '4:5 竖图' },
]

const RESOLUTIONS: Resolution[] = ['1k', '2k', '4k']

interface OperationPanelProps {
  onGenerate: (params: GenerationParams) => void
  isGenerating: boolean
}

export function OperationPanel({ onGenerate, isGenerating }: OperationPanelProps) {
  const { prompt, setPrompt, refImages, setRefImages } = useFormStore()
  const [size, setSize] = useState<string>('1:1')
  const [resolution, setResolution] = useState<Resolution>('1k')
  const [count, setCount] = useState(1)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return
    const params: GenerationParams = {
      model: 'gpt-image-2',
      prompt: prompt.trim(),
      n: count,
      size,
      resolution,
      image_urls: refImages.length > 0 ? refImages.map((img) => img.data) : undefined,
    }
    onGenerate(params)
  }

  const selectedLabel = ASPECT_RATIOS.find((r) => r.value === size)?.label || size

  return (
    <Card className="h-full">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">图片比例</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="flex items-center justify-between w-full h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm shadow-sm transition-colors hover:bg-muted cursor-pointer"
            >
              <span>{selectedLabel}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                {ASPECT_RATIOS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-sm text-left hover:bg-muted transition-colors cursor-pointer ${
                      size === r.value ? 'bg-muted font-medium' : ''
                    }`}
                    onClick={() => { setSize(r.value); setOpen(false) }}
                  >
                    <span>{r.label}</span>
                    {size === r.value && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">分辨率</label>
          <div className="flex gap-2">
            {RESOLUTIONS.map((r) => (
              <button
                key={r}
                type="button"
                className={`flex-1 h-7 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  resolution === r
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-input bg-background hover:bg-muted text-foreground'
                }`}
                onClick={() => setResolution(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            并行任务数: {count}
          </label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        <ImageUploader
          images={refImages}
          onChange={setRefImages}
        />

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="prompt-input">描述词</label>
          <textarea
            id="prompt-input"
            placeholder="描述你想要的画面，支持中英文，越详细效果越好..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
          />
        </div>

        <button
          type="button"
          className={`w-full h-9 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
            !prompt.trim() || isGenerating
              ? 'bg-primary/50 text-primary-foreground/50 pointer-events-none'
              : 'bg-primary text-primary-foreground hover:bg-primary/80'
          }`}
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {count > 1 ? `并行生成 ${count} 张` : '生成图片'}
            </>
          )}
        </button>
      </CardContent>
    </Card>
  )
}
