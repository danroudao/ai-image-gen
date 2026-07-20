import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId

  const [entries, total] = await Promise.all([
    prisma.historyEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.historyEntry.count({ where }),
  ])

  const userIds = [...new Set(entries.map(e => e.userId).filter(Boolean))]
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } })
    : []
  const userMap = new Map(users.map(u => [u.id, u]))

  const data = entries.map(e => ({
    ...e,
    params: JSON.parse(e.params),
    imageIds: JSON.parse(e.imageIds),
    user: userMap.get(e.userId) ?? null,
  }))

  return NextResponse.json({ data, total, page, pageSize })
}
