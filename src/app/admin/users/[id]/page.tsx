'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, KeyRound, ShieldCheck } from 'lucide-react'
import { useToastStore } from '@/stores/toast-store'

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
  const toast = useToastStore()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [maxTasks, setMaxTasks] = useState(3)
  const [monthlyLimit, setMonthlyLimit] = useState(500)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)

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

  const handleSave = async (withPassword: boolean) => {
    if (withPassword && !newPassword) {
      toast.addToast({ message: '请先输入新密码', type: 'info' })
      return
    }
    if (withPassword && newPassword.length < 6) {
      toast.addToast({ message: '密码至少 6 位', type: 'error' })
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { maxTasks, monthlyLimit }
      if (withPassword) body.password = newPassword
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        toast.addToast({
          message: withPassword ? '密码已重置' : '已保存',
          type: 'success',
        })
        if (withPassword) setNewPassword('')
      } else {
        toast.addToast({ message: data.error?.message ?? '保存失败', type: 'error' })
      }
    } catch {
      toast.addToast({ message: '保存失败', type: 'error' })
    } finally {
      setSaving(false)
    }
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
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
            onClick={() => handleSave(false)}
          >
            <Save className="h-4 w-4" />
            保存额度配置
          </button>
        </div>

        <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-4">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-amber-500" />
            重置密码
          </h2>
          <p className="text-xs text-muted-foreground">
            用户忘记密码时，在此设置新密码（至少 6 位）
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码"
              className="flex-1 min-w-[180px] h-8 rounded-md border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <button
              type="button"
              disabled={saving}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium border border-amber-500/40 text-amber-600 hover:bg-amber-500/10 transition-colors cursor-pointer disabled:opacity-50"
              onClick={() => handleSave(true)}
            >
              <ShieldCheck className="h-4 w-4" />
              重置密码
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
