'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Users, ImageIcon, Activity, BarChart3,
  Clock, DollarSign, AlertTriangle, List,
  CheckCircle, XCircle, Loader2, Play,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Stats {
  totalUsers: number; totalImages: number; monthImages: number; monthTasks: number
  todayTasks: number; todayImages: number
  adminCount: number; totalCost: number; monthCost: number
  activeUsers: number; totalHistory: number; monthHistory: number
  taskStatus: { queued: number; running: number; completed: number; failed: number }
  quotaWarnings: { userId: string; email: string; usedThisMonth: number; monthlyLimit: number; ratio: number }[]
  recentTasks: { id: string; prompt: string; status: string; imageCount: number; cost: number; createdAt: string; email: string }[]
  recentImages: { id: string; prompt: string; cost: number; createdAt: string; email: string }[]
  dailyTasks: { date: string; value: number }[]
  dailyImages: { date: string; value: number }[]
  dailyCost: { date: string; value: number }[]
  dailyUsers: { date: string; value: number }[]
}

const STATUS_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444']
const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444']

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .catch(() => {})
  }, [])

  const statusIcon: Record<string, typeof CheckCircle> = {
    completed: CheckCircle, running: Loader2, queued: Play, failed: XCircle,
  }
  const statusColor: Record<string, string> = {
    completed: 'text-green-500', running: 'text-blue-500', queued: 'text-yellow-500', failed: 'text-red-500',
  }

  const statusData = stats ? [
    { name: '已完成', value: stats.taskStatus.completed },
    { name: '运行中', value: stats.taskStatus.running },
    { name: '排队中', value: stats.taskStatus.queued },
    { name: '失败', value: stats.taskStatus.failed },
  ].filter(d => d.value > 0) : []

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">管理后台</h1>
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />返回首页
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '总用户', value: stats?.totalUsers ?? '-', icon: Users, color: 'text-blue-500' },
            { label: '总图片', value: stats?.totalImages ?? '-', icon: ImageIcon, color: 'text-green-500' },
            { label: '本月生成', value: stats?.monthImages ?? '-', icon: Activity, color: 'text-purple-500' },
            { label: '本月任务', value: stats?.monthTasks ?? '-', icon: BarChart3, color: 'text-orange-500' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className={`h-4 w-4 ${item.color}`} />{item.label}
              </div>
              <div className="text-2xl font-bold">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1: Daily Tasks Line + Cost Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium">📈 每日生成趋势（近 30 天）</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.dailyTasks ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={false} name="任务数" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium">💰 每日消耗趋势（近 30 天）</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.dailyCost ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} name="消耗" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Bar (Images) + Pie (Status) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium">📊 每日图片量（近 30 天）</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.dailyImages ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} name="图片数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium">🎯 任务状态分布</h2>
            <div className="h-48 flex items-center justify-center">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {statusData.map((_, idx) => (
                        <Cell key={idx} fill={STATUS_COLORS[idx]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">暂无数据</p>
              )}
              <div className="space-y-1 text-xs ml-2">
                {statusData.map((d, idx) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[idx] }} />
                    {d.name}: {d.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '管理员', value: stats?.adminCount ?? '-', icon: Users, color: 'text-amber-500' },
            { label: '本月活跃用户', value: stats?.activeUsers ?? '-', icon: Users, color: 'text-indigo-500' },
            { label: '今日任务', value: stats?.todayTasks ?? '-', icon: Clock, color: 'text-cyan-500' },
            { label: '今日图片', value: stats?.todayImages ?? '-', icon: ImageIcon, color: 'text-emerald-500' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className={`h-4 w-4 ${item.color}`} />{item.label}
              </div>
              <div className="text-2xl font-bold">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Cost + User Growth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-500" />消耗概览
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '总消耗', value: (stats?.totalCost ?? 0).toFixed(4), sub: '' },
                { label: '本月消耗', value: (stats?.monthCost ?? 0).toFixed(4), sub: '' },
              ].map((item) => (
                <div key={item.label} className="p-2 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-lg font-semibold font-mono">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />用户增长（近 30 天）
            </h2>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.dailyUsers ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Area type="monotone" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} name="新用户" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quota Warnings */}
        {stats?.quotaWarnings && stats.quotaWarnings.filter(q => q.ratio >= 80).length > 0 && (
          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />配额告警
            </h2>
            <div className="space-y-1.5">
              {stats.quotaWarnings.filter(q => q.ratio >= 80).map((q) => (
                <div key={q.userId} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                  <span className="truncate">{q.email}</span>
                  <span className={`font-mono text-xs ${q.ratio >= 100 ? 'text-red-500' : 'text-amber-500'}`}>
                    {q.usedThisMonth}/{q.monthlyLimit} ({q.ratio}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/users" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Users className="h-4 w-4" />用户管理
          </Link>
          <Link href="/admin/images" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border bg-card/80 backdrop-blur-sm hover:bg-muted transition-colors">
            <ImageIcon className="h-4 w-4" />图片库
          </Link>
          <Link href="/admin/history" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border bg-card/80 backdrop-blur-sm hover:bg-muted transition-colors">
            <Activity className="h-4 w-4" />历史记录
          </Link>
          <Link href="/admin/settings" className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border bg-card/80 backdrop-blur-sm hover:bg-muted transition-colors">
            <BarChart3 className="h-4 w-4" />系统设置
          </Link>
        </div>

        {/* Recent Tasks */}
        {stats?.recentTasks && stats.recentTasks.length > 0 && (
          <div className="rounded-lg border bg-card/80 backdrop-blur-sm p-4 space-y-3">
            <h2 className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />最近任务
            </h2>
            <div className="space-y-1.5">
              {stats.recentTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={`text-xs ${statusColor[t.status]}`}>
                      {t.status === 'completed' ? '✓' : t.status === 'running' ? '⟳' : t.status === 'failed' ? '✗' : '○'}
                    </span>
                    <span className="truncate">{t.prompt.slice(0, 40)}{t.prompt.length > 40 ? '...' : ''}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{t.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
