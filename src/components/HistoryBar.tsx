'use client'

import { useSyncExternalStore, useState } from 'react'
import { Trash2, Clock, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useHistoryStore } from '@/stores/history-store'
import { HistoryEntry } from '@/lib/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface HistoryBarProps {
  onSelect: (entry: HistoryEntry) => void
  onRemove?: (id: string) => void
  selectedId?: string | null
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function getThumbUrl(entry: HistoryEntry): string | undefined {
  if (entry.imageIds && entry.imageIds.length > 0) return `/api/images/${entry.imageIds[0]}`
  return entry.localImages[0]
}

function getImageCount(entry: HistoryEntry): number {
  if (entry.imageIds && entry.imageIds.length > 0) return entry.imageIds.length
  return entry.localImages.length
}

export function HistoryBar({ onSelect, onRemove, selectedId }: HistoryBarProps) {
  const { entries, loaded, clearAll } = useHistoryStore()
  const mounted = useMounted()
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            生成历史
          </div>
          {mounted && entries.length > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="h-3 w-3" />
              清空
            </button>
          )}
        </div>
        {!mounted || (!loaded && entries.length === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            加载中...
          </p>
        ) : mounted && entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            还没有生成记录
          </p>
        ) : (
          <div className="flex gap-3 pb-1 overflow-x-auto">
            {entries.map((entry) => {
              const isSelected = selectedId === entry.id
              return (
                <div key={entry.id} className="flex-shrink-0 w-36 group relative">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => onSelect(entry)}
                  >
                    <div className={`aspect-square rounded-lg overflow-hidden border bg-muted mb-1 transition-all relative ${
                      isSelected
                        ? 'ring-2 ring-primary'
                        : 'group-hover:ring-1 group-hover:ring-primary/30'
                    }`}>
                      {entry.localImages[0] || (entry.imageIds && entry.imageIds[0]) ? (
                        <>
                          <img
                            src={getThumbUrl(entry)}
                            alt=""
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {getImageCount(entry) > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] leading-tight px-1 rounded-sm">
                              ×{getImageCount(entry)}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          无预览
                        </div>
                      )}
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      {entry.params.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      {formatTime(entry.created_at)}
                    </p>
                  </button>
                  {onRemove && (
                    <button
                      type="button"
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/50 text-white/80 flex items-center justify-center cursor-pointer md:opacity-0 md:group-hover:opacity-100 md:transition-opacity hover:bg-black/70"
                      onClick={(e) => { e.stopPropagation(); onRemove(entry.id) }}
                      title="删除"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={showClearConfirm}
        title="清空历史"
        message="确定要删除所有生成记录吗？此操作不可撤销。"
        confirmLabel="清空"
        variant="destructive"
        onConfirm={() => { clearAll(); setShowClearConfirm(false) }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </Card>
  )
}
