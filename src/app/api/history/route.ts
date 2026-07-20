import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const entries = await prisma.historyEntry.findMany({
    where: { userId: auth.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  return NextResponse.json({ data: entries })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  const entry = await prisma.historyEntry.create({
    data: {
      userId: auth.user!.id,
      params: JSON.stringify(body.params),
      imageIds: JSON.stringify(body.imageIds ?? []),
      cost: body.cost ?? 0,
    },
  })
  return NextResponse.json({ data: entry })
}
