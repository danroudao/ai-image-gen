'use client'

import { useState, useEffect } from 'react'
import { Trash2, Clock, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useHistoryStore } from '@/stores/history-store'
import { HistoryEntry } from '@/lib/types'

interface HistoryBarProps {
  onSelect: (entry: HistoryEntry) => void
  onRemove?: (id: string) => void
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

export function HistoryBar({ onSelect, onRemove }: HistoryBarProps) {
  const { entries, clearAll } = useHistoryStore()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            生成历史
          </div>
          {mounted && entries.length > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={clearAll}
            >
              <Trash2 className="h-3 w-3" />
              清空
            </button>
          )}
        </div>
        {!mounted || entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            还没有生成记录
          </p>
        ) : (
          <div className="flex gap-3 pb-1 overflow-x-auto">
            {entries.map((entry) => (
              <div key={entry.id} className="flex-shrink-0 w-36 group relative">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onSelect(entry)}
                >
                  <div className="aspect-square rounded-lg overflow-hidden border bg-muted mb-1 group-hover:ring-1 group-hover:ring-primary/30 transition-all relative">
                    {entry.localImages[0] ? (
                      <img
                        src={entry.localImages[0]}
                        alt=""
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
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
                    className="absolute top-1 right-1 size-5 rounded-full bg-black/50 text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onRemove(entry.id) }}
                    title="删除"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
