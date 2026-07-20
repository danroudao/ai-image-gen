'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'

interface UserDetail {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  quota: { maxTasks: number; monthlyLimit: number; usedThisMonth: number } | null
  _count: { images: number; tasks: number }
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [maxTasks, setMaxTasks] = useState(3)
  const [monthlyLimit, setMonthlyLimit] = useState(500)

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setUser(d.data)
        setMaxTasks(d.data.quota?.maxTasks ?? 3)
        setMonthlyLimit(d.data.quota?.monthlyLimit ?? 500)
      })
      .catch(() => {})
  }, [id])

  const handleSave = async () => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxTasks, monthlyLimit }),
    })
    router.push('/admin/users')
  }

  if (!user) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={() => router.push('/admin/users')}
        >
          <ArrowLeft className="h-4 w-4" />
          返回用户列表
        </button>

        <h1 className="text-xl font-semibold">{user.name || user.email}</h1>

        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '邮箱', value: user.email },
            { label: '角色', value: user.role === 'admin' ? '管理员' : '用户' },
            { label: '图片数', value: user._count.images },
            { label: '任务数', value: user._count.tasks },
            { label: '本月已用', value: user.quota?.usedThisMonth ?? 0 },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-card/80 backdrop-blur-sm p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-lg font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-4">
          <h2 className="text-sm font-medium">额度配置</h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">最大并行任务数: {maxTasks}</label>
              <input
                type="range"
                min={1}
                max={10}
                value={maxTasks}
                onChange={(e) => setMaxTasks(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">月配额（图片数）: {monthlyLimit}</label>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
