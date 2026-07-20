import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

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
    prisma.image.aggregate({ _sum: { cost: true } }),
    prisma.image.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { cost: true } }),
    prisma.quota.findMany({
      where: {
        monthlyLimit: { gt: 0 },
        usedThisMonth: { gt: 0 },
      },
      orderBy: { usedThisMonth: 'desc' },
      take: 10,
    }),
    prisma.generationTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, prompt: true, status: true, imageCount: true, cost: true, createdAt: true, userId: true },
    }),
    prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, prompt: true, cost: true, createdAt: true, userId: true },
    }),
    prisma.user.count({ where: { role: 'admin' } }),
    prisma.historyEntry.count(),
    prisma.historyEntry.count({ where: { createdAt: { gte: monthStart } } }),
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
      // Basic stats
      totalUsers,
      totalImages,
      monthImages,
      monthTasks,
      // Today
      todayTasks,
      todayImages,
      // Admin count
      adminCount,
      // Cost
      totalCost: totalCost._sum.cost ?? 0,
      monthCost: monthCost._sum.cost ?? 0,
      // Task status
      taskStatus: {
        queued: statusMap.queued ?? 0,
        running: statusMap.running ?? 0,
        completed: statusMap.completed ?? 0,
        failed: statusMap.failed ?? 0,
      },
      // Active users this month
      activeUsers: activeUsers.length,
      // History
      totalHistory,
      monthHistory,
      // Quota warnings
      quotaWarnings: quotaWarningUsers,
      // Recent
      recentTasks: recentTasks.map(t => ({
        ...t,
        email: userMap.get(t.userId) ?? 'unknown',
        createdAt: t.createdAt.toISOString(),
      })),
      recentImages: recentImages.map(i => ({
        ...i,
        email: userMap.get(i.userId) ?? 'unknown',
        createdAt: i.createdAt.toISOString(),
      })),
    },
  })
}
