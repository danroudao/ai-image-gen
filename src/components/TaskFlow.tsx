'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useGenerationStore } from '@/stores/generation-store'

export function TaskFlow() {
  const tasks = useGenerationStore((s) => s.tasks)
  const removeRecentCompleted = useGenerationStore((s) => s.removeRecentCompleted)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const hasRecent = tasks.some(
      (t) => t.status === 'completed' && now - t.createdAt < 5000
    )
    if (!hasRecent) return
    const timer = setInterval(removeRecentCompleted, 1000)
    return () => clearInterval(timer)
  }, [tasks, now, removeRecentCompleted])

  const visible = tasks.filter(
    (t) => t.status !== 'completed' || now - t.createdAt < 5000
  )

  if (visible.length === 0) return null

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {visible.map((task) => {
            const isCompleted = task.status === 'completed'
            const isFailed = task.status === 'failed'
            const isRecent = isCompleted && now - task.createdAt < 5000

            return (
              <div
                key={task.id}
                className={`flex-shrink-0 w-56 rounded-lg border p-2.5 transition-all ${
                  isFailed
                    ? 'border-destructive/30 bg-destructive/5'
                    : isCompleted
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border bg-muted/30'
                } ${isRecent ? 'animate-out fade-out duration-1000' : ''}`}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {isFailed ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">
                    {task.prompt}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFailed
                          ? 'bg-destructive'
                          : isCompleted
                            ? 'bg-green-500'
                            : 'bg-primary'
                      }`}
                      style={{
                        width: isCompleted ? '100%' : `${task.progress}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-8 text-right">
                    {isCompleted ? '100' : task.progress}
                  </span>
                </div>

                <div className="flex items-center gap-1 mt-1">
                  {isFailed ? (
                    <span className="text-[10px] text-destructive/80">失败</span>
                  ) : isCompleted ? (
                    <span className="text-[10px] text-green-600">
                      {task.images.length} 张
                      {task.cost ? ` · $${task.cost.toFixed(4)}` : ''}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {task.status === 'queued' ? '排队中' : '生成中'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
