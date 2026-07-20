'use client'

import { useEffect, useState } from 'react'
import { Save, Settings } from 'lucide-react'

interface Config {
  defaultMaxTasks: number
  defaultMonthlyLimit: number
  allowRegistration: boolean
}

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [defaultMaxTasks, setDefaultMaxTasks] = useState(3)
  const [defaultMonthlyLimit, setDefaultMonthlyLimit] = useState(500)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.data)
        setDefaultMaxTasks(d.data.defaultMaxTasks)
        setDefaultMonthlyLimit(d.data.defaultMonthlyLimit)
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setMessage('')
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultMaxTasks, defaultMonthlyLimit }),
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
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          系统设置
        </h1>

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
