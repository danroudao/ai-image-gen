'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToastStore } from '@/stores/toast-store'

interface HistoryItem {
  id: string
  userId: string
  params: { prompt: string; n: number; size?: string; resolution?: string }
  imageIds: string[]
  cost: number
  createdAt: string
  user: { id: string; email: string; name: string | null } | null
}

export default function AdminHistoryPage() {
  const [entries, setEntries] = useState<HistoryItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const toast = useToastStore()

  const load = (p: number) => {
    fetch(`/api/admin/history?page=${p}`)
      .then(r => r.json())
      .then(d => { setEntries(d.data ?? []); setTotal(d.total) })
      .catch(() => {})
  }

  useEffect(() => { load(page) }, [page])

  const handleDelete = async (id: string) => {
    await fetch(`/api/history/${id}`, { method: 'DELETE' })
    toast.addToast({ message: '已删除', type: 'success' })
    load(page)
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />返回
            </Link>
            <h1 className="text-xl font-semibold">全站历史记录</h1>
          </div>
          <span className="text-xs text-muted-foreground">共 {total} 条</span>
        </div>

        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="rounded-lg border bg-card/80 backdrop-blur-sm p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium truncate">{e.params.prompt}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{e.user?.email ?? '未知用户'}</span>
                    <span>{e.params.n} 张</span>
                    {e.params.size && <span>{e.params.size}</span>}
                    {e.params.resolution && <span>{e.params.resolution}</span>}
                    {e.cost > 0 && <span>${e.cost.toFixed(4)}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground/60">{new Date(e.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <button
                  type="button"
                  className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors cursor-pointer shrink-0"
                  onClick={() => handleDelete(e.id)}
                  title="删除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">暂无记录</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              className="size-8 rounded-md border bg-card/80 flex items-center justify-center disabled:opacity-30 cursor-pointer"
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              className="size-8 rounded-md border bg-card/80 flex items-center justify-center disabled:opacity-30 cursor-pointer"
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
