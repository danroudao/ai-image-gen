'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Save, Settings, HardDrive } from 'lucide-react'
import Link from 'next/link'

interface Config {
  defaultMaxTasks: number
  defaultMonthlyLimit: number
  maxStorageMB: number
  allowRegistration: boolean
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [defaultMaxTasks, setDefaultMaxTasks] = useState(3)
  const [defaultMonthlyLimit, setDefaultMonthlyLimit] = useState(500)
  const [maxStorageMB, setMaxStorageMB] = useState(500)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.data)
        setDefaultMaxTasks(d.data.defaultMaxTasks)
        setDefaultMonthlyLimit(d.data.defaultMonthlyLimit)
        setMaxStorageMB(d.data.maxStorageMB ?? 500)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setMessage('')
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultMaxTasks, defaultMonthlyLimit, maxStorageMB }),
    })
    if (res.ok) {
      setMessage('已保存')
    } else {
      setMessage('保存失败')
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            系统设置
          </h1>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回管理后台
          </Link>
        </div>

        <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-4">
          <h2 className="text-sm font-medium">默认额度（新用户）</h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">默认最大并行任务数: {defaultMaxTasks}</label>
              <input
                type="range"
                min={1}
                max={20}
                value={defaultMaxTasks}
                onChange={(e) => setDefaultMaxTasks(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">默认月配额: {defaultMonthlyLimit}</label>
              <input
                type="range"
                min={10}
                max={10000}
                step={10}
                value={defaultMonthlyLimit}
                onChange={(e) => setDefaultMonthlyLimit(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-4">
          <h2 className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-blue-500" />
            存储管理
          </h2>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              全局存储上限: {maxStorageMB} MB
              {maxStorageMB < 100 && <span className="text-amber-500 ml-2">⚠ 过低</span>}
            </label>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={maxStorageMB}
              onChange={(e) => setMaxStorageMB(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-[11px] text-muted-foreground/60">
              超出上限时自动删除最旧的图片，始终保留至少 200MB 空闲空间
            </p>
          </div>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          保存设置
        </button>
      </div>
    </div>
  )
}
