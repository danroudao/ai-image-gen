'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, ChevronLeft, ChevronRight, Filter, X, Download } from 'lucide-react'
import { useToastStore } from '@/stores/toast-store'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { SafeImage } from '@/components/SafeImage'

interface AdminImage {
  id: string
  userId: string
  filePath: string
  prompt: string
  cost: number
  model: string
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
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const toast = useToastStore()

  const load = useCallback((p: number) => {
    const params = new URLSearchParams({ page: String(p) })
    if (filterUser) params.set('userId', filterUser)
    fetch(`/api/admin/images?${params}`)
      .then(r => r.json())
      .then(d => { setImages(d.data ?? []); setTotal(d.total); setUsers(d.users ?? []) })
      .catch(() => {})
  }, [filterUser])

  useEffect(() => { load(page) }, [load, page])

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/images?id=${id}`, { method: 'DELETE' })
    toast.addToast({ message: '已删除', type: 'success' })
    setDeleteTarget(null)
    load(page)
  }

  const handleLightboxKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIdx(null)
    if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? Math.max(0, i - 1) : null)
    if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? Math.min(images.length - 1, i + 1) : null)
  }, [images.length])

  useEffect(() => {
    window.addEventListener('keydown', handleLightboxKey)
    return () => window.removeEventListener('keydown', handleLightboxKey)
  }, [handleLightboxKey])

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
          {images.map((img, idx) => (
            <div key={img.id} className="group relative rounded-lg border bg-card/80 backdrop-blur-sm overflow-hidden">
              <button
                type="button"
                className="block w-full aspect-square bg-muted cursor-pointer"
                onClick={() => setLightboxIdx(idx)}
              >
                <SafeImage src={img.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              </button>
              <button
                type="button"
                className="absolute inset-0 cursor-pointer"
                onClick={() => setLightboxIdx(idx)}
              />
              <div className="p-2 space-y-1 relative z-10 bg-card/80">
                <p className="text-xs truncate text-muted-foreground">{img.user?.email ?? '未知'}</p>
                <p className="text-xs truncate">{img.prompt || '无提示词'}</p>
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] px-1 rounded ${
                    img.model === 'gpt-image-2-official'
                      ? 'bg-blue-500/20 text-blue-600'
                      : 'bg-muted-foreground/10 text-muted-foreground'
                  }`}>
                    {img.model === 'gpt-image-2-official' ? 'Official' : 'APIB'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">{new Date(img.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              <button
                type="button"
                className="absolute top-1.5 right-1.5 size-10 rounded-md bg-black/40 text-white flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer z-20 md:opacity-0"
                onClick={() => { setDeleteTarget(img.id); }}
                title="删除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {img.cost > 0 && (
                <span className="absolute bottom-1.5 right-1.5 text-[10px] bg-black/40 text-white px-1 rounded z-20">
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

      {lightboxIdx !== null && images[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10 cursor-pointer"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="h-8 w-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => Math.max(0, i! - 1)) }}
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white z-10 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => Math.min(images.length - 1, i! + 1)) }}
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}

          <div className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <SafeImage
              src={images[lightboxIdx].url}
              alt=""
              className="max-h-[65vh] max-w-[90vw] object-contain rounded-lg"
            />
            <div className="text-center space-y-1 max-w-lg">
              <p className="text-sm text-white/90">{images[lightboxIdx].prompt || '无提示词'}</p>
              <p className="text-xs text-white/60">
                <span className={images[lightboxIdx].model === 'gpt-image-2-official' ? 'text-blue-300' : ''}>
                  {images[lightboxIdx].model === 'gpt-image-2-official' ? 'Official' : 'APIB'}
                </span>
                {' · '}{images[lightboxIdx].user?.email ?? '未知用户'}
                {images[lightboxIdx].cost > 0 ? ` · $${images[lightboxIdx].cost.toFixed(4)}` : ''}
                {' · '}{new Date(images[lightboxIdx].createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <a
              href={images[lightboxIdx].url}
              download
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-white/15 text-white/90 text-sm hover:bg-white/25 transition-colors"
            >
              <Download className="h-4 w-4" />下载
            </a>
          </div>

          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除图片"
        message="确定要删除此图片吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="destructive"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
