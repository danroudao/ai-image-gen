'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Save, User, Shield, ImageIcon, Activity, BarChart3, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface UserSettings {
  email: string
  name: string | null
  role: string
  createdAt: string
  quota: { maxTasks: number; monthlyLimit: number; usedThisMonth: number } | null
  _count: { images: number; tasks: number }
}

export default function SettingsPage() {
  const { update } = useSession()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.data)
        setName(d.data.name ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setMessage('')
    setSaving(true)
    try {
      const body: Record<string, unknown> = { name }
      if (currentPassword && newPassword) {
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }
      if (!currentPassword && newPassword) {
        setMessage('请填写当前密码')
        return
      }

      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('已保存')
        setCurrentPassword('')
        setNewPassword('')
        update()
      } else {
        setMessage(data.error?.message ?? '保存失败')
      }
    } catch {
      setMessage('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">加载中...</div>
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">账号设置</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '角色', value: settings?.role === 'admin' ? '管理员' : '用户', icon: Shield, color: 'text-blue-500' },
            { label: '图片数', value: settings?._count.images ?? 0, icon: ImageIcon, color: 'text-green-500' },
            { label: '任务数', value: settings?._count.tasks ?? 0, icon: Activity, color: 'text-purple-500' },
            { label: '本月已用', value: settings?.quota?.usedThisMonth ?? 0, icon: BarChart3, color: 'text-orange-500' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-card/80 backdrop-blur-sm p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                {item.label}
              </div>
              <p className="text-lg font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-4">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            基本信息
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">邮箱</label>
              <p className="text-sm mt-0.5">{settings?.email}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">昵称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-0.5 flex h-8 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-4">
          <h2 className="text-sm font-medium">修改密码</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-0.5 flex h-8 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-0.5 flex h-8 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
          </div>
        </div>

        {message && (
          <p className={`text-sm ${message.includes('已保存') ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{message}</p>
        )}

        <button
          type="button"
          disabled={saving}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
          onClick={handleSave}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
