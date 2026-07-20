import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalUsers, totalImages, monthImages, monthTasks] = await Promise.all([
    prisma.user.count(),
    prisma.image.count(),
    prisma.image.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.generationTask.count({ where: { createdAt: { gte: monthStart } } }),
  ])

  return NextResponse.json({
    data: {
      totalUsers,
      totalImages,
      monthImages,
      monthTasks,
    },
  })
}
