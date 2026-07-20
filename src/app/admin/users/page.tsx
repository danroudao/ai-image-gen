'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  _count: { images: number }
  quota: { maxTasks: number; monthlyLimit: number } | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const loadUsers = () => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .catch(() => {})
  }

  useEffect(() => { loadUsers() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    setShowCreate(false)
    setEmail('')
    setPassword('')
    setName('')
    loadUsers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此用户？')) return
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    loadUsers()
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
            <h1 className="text-xl font-semibold">用户管理</h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4" />
            创建用户
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="email"
                placeholder="邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <input
                type="text"
                placeholder="昵称（可选）"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="h-7 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">创建</button>
              <button type="button" className="h-7 px-3 rounded-md text-xs font-medium border hover:bg-muted cursor-pointer" onClick={() => setShowCreate(false)}>取消</button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-lg border bg-card/80 backdrop-blur-sm p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link href={`/admin/users/${u.id}`} className="text-sm font-medium hover:underline truncate">
                    {u.name || u.email}
                  </Link>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {u.role === 'admin' ? '管理员' : '用户'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                <p className="text-xs text-muted-foreground/60">
                  图片: {u._count.images} | 并发: {u.quota?.maxTasks ?? 3} | 月配额: {u.quota?.monthlyLimit ?? 500}
                </p>
              </div>
              <button
                type="button"
                className="size-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                onClick={() => handleDelete(u.id)}
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
