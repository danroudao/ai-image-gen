'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight, ExternalLink, Filter } from 'lucide-react'
import { useToastStore } from '@/stores/toast-store'

interface AdminImage {
  id: string
  userId: string
  filePath: string
  prompt: string
  cost: number
  createdAt: string
  user: { id: string; email: string; name: string | null } | null
  url: string
  thumbnailUrl: string
}

interface UserSummary {
  id: string
  email: string
  name: string | null
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<AdminImage[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterUser, setFilterUser] = useState('')
  const toast = useToastStore()

  const load = (p: number) => {
    const params = new URLSearchParams({ page: String(p) })
    if (filterUser) params.set('userId', filterUser)
    fetch(`/api/admin/images?${params}`)
      .then(r => r.json())
      .then(d => { setImages(d.data ?? []); setTotal(d.total); setUsers(d.users ?? []) })
      .catch(() => {})
  }

  useEffect(() => { load(page) }, [page, filterUser])

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此图片？')) return
    await fetch(`/api/admin/images?id=${id}`, { method: 'DELETE' })
    toast.addToast({ message: '已删除', type: 'success' })
    load(page)
  }

  const totalPages = Math.ceil(total / 30)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />返回
            </Link>
            <h1 className="text-xl font-semibold">全站图片库</h1>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterUser}
              onChange={(e) => { setFilterUser(e.target.value); setPage(1) }}
              className="h-8 rounded-md border bg-background px-2 text-sm outline-none"
            >
              <option value="">全部用户</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">{total} 张</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative rounded-lg border bg-card/80 backdrop-blur-sm overflow-hidden">
              <a href={img.url} target="_blank" rel="noreferrer" className="block aspect-square bg-muted">
                <img src={img.thumbnailUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
              </a>
              <div className="p-2 space-y-1">
                <p className="text-xs truncate text-muted-foreground">{img.user?.email ?? '未知'}</p>
                <p className="text-xs truncate">{img.prompt || '无提示词'}</p>
                <p className="text-[10px] text-muted-foreground/60">{new Date(img.createdAt).toLocaleDateString('zh-CN')}</p>
              </div>
              <button
                type="button"
                className="absolute top-1.5 right-1.5 size-7 rounded-md bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => handleDelete(img.id)}
                title="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <a
                href={img.url}
                target="_blank"
                rel="noreferrer"
                className="absolute top-1.5 left-1.5 size-7 rounded-md bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="查看原图"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {img.cost > 0 && (
                <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/40 text-white px-1 rounded">
                  ${img.cost.toFixed(4)}
                </span>
              )}
            </div>
          ))}
          {images.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground text-center py-12">暂无图片</div>
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
