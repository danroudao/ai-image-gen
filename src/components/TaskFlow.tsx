'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useGenerationStore } from '@/stores/generation-store'

export function TaskFlow() {
  const tasks = useGenerationStore((s) => s.tasks)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (tasks.length === 0) return null

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {tasks.map((task) => {
            const isRunning = task.status === 'running'
            const isQueued = task.status === 'queued'
            const isCompleted = task.status === 'completed'
            const isFailed = task.status === 'failed'
            const elapsed = isRunning && task.startedAt
              ? Math.floor((now - task.startedAt) / 1000)
              : null

            return (
              <div
                key={task.id}
                className={`flex-shrink-0 w-56 min-w-[70vw] md:min-w-0 rounded-lg border p-2.5 transition-all ${
                  isFailed
                    ? 'border-destructive/30 bg-destructive/5'
                    : isCompleted
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border bg-muted/30'
                }`}
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

                <div className="flex items-center gap-1 mt-1">
                  {isFailed ? (
                    <span className="text-[10px] text-destructive/80">失败</span>
                  ) : isCompleted ? (
                    <span className="text-[10px] text-green-600">
                      {task.images.length} 张
                      {task.cost ? ` · $${task.cost.toFixed(4)}` : ''}
                    </span>
                  ) : isQueued ? (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">排队中</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary/70" />
                      <span className="text-[10px] text-primary/70 tabular-nums">
                        {elapsed ?? 0}s
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
