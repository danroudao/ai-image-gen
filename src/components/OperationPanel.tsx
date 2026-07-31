'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Check, ChevronDown, Cpu, Sliders, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ImageUploader } from './ImageUploader'
import { AspectRatio, Resolution, GenerationParams, ModelName } from '@/lib/types'
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
  isGenerating?: boolean
}

const MODELS: { value: ModelName; label: string; desc: string }[] = [
  { value: 'gpt-image-2', label: 'GPT-Image-2', desc: 'APIB 渠道' },
  { value: 'gpt-image-2-official', label: 'Official', desc: 'OpenAI 官方' },
]

const QUALITY_OPTS = ['auto', 'low', 'medium', 'high'] as const
const FORMAT_OPTS = ['png', 'jpeg', 'webp'] as const

export function OperationPanel({ onGenerate, isGenerating }: OperationPanelProps) {
  const { prompt, setPrompt, refImages, setRefImages } = useFormStore()
  const [model, setModel] = useState<ModelName>('gpt-image-2')
  const [size, setSize] = useState<string>('1:1')
  const [resolution, setResolution] = useState<Resolution>('1k')
  const [count, setCount] = useState(1)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isOfficial = model === 'gpt-image-2-official'
  const [quality, setQuality] = useState<string>('auto')
  const [moderation, setModeration] = useState<string>('auto')
  const [outputFormat, setOutputFormat] = useState<string>('png')
  const [outputCompression, setOutputCompression] = useState(80)

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
    if (!prompt.trim()) return
    const params: GenerationParams = {
      model,
      prompt: prompt.trim(),
      n: count,
      size,
      resolution,
      image_urls: refImages.length > 0 ? refImages.map((img) => img.data) : undefined,
      ...(isOfficial ? {
        quality: quality as 'auto' | 'low' | 'medium' | 'high',
        moderation: moderation as 'auto' | 'low',
        output_format: outputFormat as 'png' | 'jpeg' | 'webp',
        ...(outputFormat !== 'png' ? { output_compression: outputCompression } : {}),
      } : {}),
    }
    onGenerate(params)
  }

  const selectedLabel = ASPECT_RATIOS.find((r) => r.value === size)?.label || size

  return (
    <Card className="h-full bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">生成模型</label>
          <div className="flex gap-2">
            {MODELS.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`flex-1 h-8 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  model === m.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'border border-input bg-background hover:bg-muted text-foreground'
                }`}
                onClick={() => {
                  setModel(m.value)
                  if (m.value === 'gpt-image-2-official' && count > 4) setCount(4)
                  if (m.value === 'gpt-image-2' && count < 1) setCount(1)
                }}
              >
                <Cpu className="h-3.5 w-3.5" />
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            {MODELS.find(m => m.value === model)?.desc}
          </p>
        </div>

        {isOfficial && (
          <div className="space-y-3 border border-dashed border-muted-foreground/20 rounded-lg p-3 bg-muted/20">
            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sliders className="h-3 w-3" />
              高级参数
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">图片质量</label>
              <div className="flex gap-1.5">
                {QUALITY_OPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={`flex-1 h-7 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      quality === q
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-input bg-background hover:bg-muted text-foreground'
                    }`}
                    onClick={() => setQuality(q)}
                  >
                    {q === 'auto' ? '自动' : q.charAt(0).toUpperCase() + q.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">审核强度</label>
              <div className="flex gap-1.5">
                {['auto', 'low'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`flex-1 h-7 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      moderation === v
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-input bg-background hover:bg-muted text-foreground'
                    }`}
                    onClick={() => setModeration(v)}
                  >
                    {v === 'auto' ? '默认' : '宽松'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">输出格式</label>
              <div className="flex gap-1.5">
                {FORMAT_OPTS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`flex-1 h-7 rounded-md text-xs font-medium transition-all cursor-pointer ${
                      outputFormat === f
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'border border-input bg-background hover:bg-muted text-foreground'
                    }`}
                    onClick={() => setOutputFormat(f)}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {outputFormat !== 'png' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-muted-foreground">
                  压缩率: {outputCompression}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={outputCompression}
                  onChange={(e) => setOutputCompression(Number(e.target.value))}
                  className="w-full accent-primary h-1.5"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/60">
                  <span>无损</span>
                  <span>高压缩</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">图片比例</label>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">分辨率</label>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            图片数量: {count}
          </label>
          <input
            type="range"
            min={1}
            max={isOfficial ? 4 : 10}
            step={1}
            value={count}
            onChange={(e) => {
              const v = Number(e.target.value)
              setCount(v)
            }}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span>{isOfficial ? '4' : '10'}</span>
          </div>
        </div>

        <ImageUploader
          images={refImages}
          onChange={setRefImages}
        />

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="prompt-input">描述词</label>
          <textarea
            id="prompt-input"
            placeholder="描述你想要的画面，支持中英文，越详细效果越好..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                handleGenerate()
              }
            }}
            rows={5}
            maxLength={2000}
            className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none resize-none"
          />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
            <span>Ctrl + Enter 快捷生成</span>
            <span className={`tabular-nums ${prompt.length > 2000 ? 'text-destructive' : ''}`}>
              {prompt.length}/2000
            </span>
          </div>
        </div>

        {isGenerating && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
            <span className="text-xs text-primary/90">生成进行中，可继续提交新批次</span>
          </div>
        )}

        <button
          type="button"
          className={`w-full h-9 rounded-lg text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer ${
            !prompt.trim()
              ? 'bg-primary/50 text-primary-foreground/50 pointer-events-none'
              : 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-sm'
          }`}
          onClick={handleGenerate}
          disabled={!prompt.trim()}
        >
          <Sparkles className="h-4 w-4" />
          {count > 1 ? `生成 ${count} 张` : '生成图片'}
        </button>
      </CardContent>
    </Card>
  )
}
