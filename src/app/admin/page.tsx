'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, ImageIcon, Activity, BarChart3, Settings } from 'lucide-react'

interface Stats {
  totalUsers: number
  totalImages: number
  monthImages: number
  monthTasks: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .catch(() => {})
  }, [])

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold">管理后台</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '总用户', value: stats?.totalUsers ?? '-', icon: Users, color: 'text-blue-500' },
            { label: '总图片', value: stats?.totalImages ?? '-', icon: ImageIcon, color: 'text-green-500' },
            { label: '本月生成', value: stats?.monthImages ?? '-', icon: Activity, color: 'text-purple-500' },
            { label: '本月任务', value: stats?.monthTasks ?? '-', icon: BarChart3, color: 'text-orange-500' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className={`h-4 w-4 ${item.color}`} />
                {item.label}
              </div>
              <div className="text-2xl font-bold">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Users className="h-4 w-4" />
            用户管理
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border bg-card/80 backdrop-blur-sm hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4" />
            系统设置
          </Link>
        </div>
      </div>
    </div>
  )
}
