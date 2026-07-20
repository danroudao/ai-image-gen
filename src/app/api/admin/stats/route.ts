import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

function getDailyBuckets<T extends { createdAt: Date }>(
  items: T[],
  days: number,
  extract: (item: T) => number = () => 1,
): { date: string; value: number }[] {
  const map = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    map.set(d.toISOString().slice(0, 10), 0)
  }
  for (const item of items) {
    const key = item.createdAt.toISOString().slice(0, 10)
    if (map.has(key)) {
      map.set(key, map.get(key)! + extract(item))
    }
  }
  return Array.from(map.entries()).map(([date, value]) => ({ date, value }))
}

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalImages,
    monthImages,
    monthTasks,
    taskStatusBreakdown,
    todayTasks,
    todayImages,
    activeUsers,
    totalCost,
    monthCost,
    quotaWarnings,
    recentTasks,
    recentImages,
    adminCount,
    totalHistory,
    monthHistory,
    dailyTasks,
    dailyImages,
    dailyCost,
    dailyUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.image.count(),
    prisma.image.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.generationTask.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.generationTask.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.generationTask.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.image.count({ where: { createdAt: { gte: dayStart } } }),
    prisma.generationTask.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthStart } },
      _count: { id: true },
    }),
    prisma.generationTask.aggregate({ _sum: { cost: true } }),
    prisma.generationTask.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { cost: true } }),
    prisma.quota.findMany({
      where: { monthlyLimit: { gt: 0 }, usedThisMonth: { gt: 0 } },
      orderBy: { usedThisMonth: 'desc' },
      take: 10,
    }),
    prisma.generationTask.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, prompt: true, status: true, imageCount: true, cost: true, createdAt: true, userId: true },
    }),
    prisma.image.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, prompt: true, cost: true, createdAt: true, userId: true },
    }),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.historyEntry.count(),
    prisma.historyEntry.count({ where: { createdAt: { gte: monthStart } } }),
    // daily trends (last 30 days)
    prisma.generationTask.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true, cost: true } }),
    prisma.image.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
    prisma.generationTask.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true, cost: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: thirtyDaysAgo } }, select: { createdAt: true } }),
  ])

  const userIds = [...new Set([
    ...recentTasks.map(t => t.userId),
    ...recentImages.map(i => i.userId),
    ...quotaWarnings.map(q => q.userId),
  ])].filter(Boolean)

  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } })
    : []
  const userMap = new Map(users.map(u => [u.id, u.email]))

  const statusMap: Record<string, number> = {}
  for (const row of taskStatusBreakdown) {
    statusMap[row.status] = row._count
  }

  const quotaWarningUsers = await Promise.all(quotaWarnings.map(async (q) => {
    const u = userMap.get(q.userId)
    return {
      userId: q.userId,
      email: u ?? 'unknown',
      usedThisMonth: q.usedThisMonth,
      monthlyLimit: q.monthlyLimit,
      ratio: q.monthlyLimit > 0 ? Math.round((q.usedThisMonth / q.monthlyLimit) * 100) : 0,
    }
  }))

  return NextResponse.json({
    data: {
      totalUsers, totalImages, monthImages, monthTasks,
      todayTasks, todayImages,
      adminCount,
      totalCost: totalCost._sum.cost ?? 0,
      monthCost: monthCost._sum.cost ?? 0,
      taskStatus: {
        queued: statusMap.queued ?? 0,
        running: statusMap.running ?? 0,
        completed: statusMap.completed ?? 0,
        failed: statusMap.failed ?? 0,
      },
      activeUsers: activeUsers.length,
      totalHistory, monthHistory,
      quotaWarnings: quotaWarningUsers,
      recentTasks: recentTasks.map(t => ({ ...t, email: userMap.get(t.userId) ?? 'unknown', createdAt: t.createdAt.toISOString() })),
      recentImages: recentImages.map(i => ({ ...i, email: userMap.get(i.userId) ?? 'unknown', createdAt: i.createdAt.toISOString() })),
      // Daily trends for charts
      dailyTasks: getDailyBuckets(dailyTasks, 30),
      dailyImages: getDailyBuckets(dailyImages, 30),
      dailyCost: getDailyBuckets(dailyCost, 30, (t) => (t as { cost: number }).cost ?? 0),
      dailyUsers: getDailyBuckets(dailyUsers, 30),
    },
  })
}
