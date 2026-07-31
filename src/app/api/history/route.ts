import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

const historyPostSchema = z.object({
  params: z.any().optional(),
  imageIds: z.array(z.string()).optional(),
  cost: z.number().min(0).optional(),
})

export async function DELETE() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  await prisma.historyEntry.deleteMany({ where: { userId: auth.user!.id } })
  return NextResponse.json({ message: '已清空' })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const raw = await request.json()
  const parsed = historyPostSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 400, message: '参数校验失败: ' + parsed.error.issues.map(i => i.message).join('; '), type: 'validation_error' } },
      { status: 400 }
    )
  }

  const entry = await prisma.historyEntry.create({
    data: {
      userId: auth.user!.id,
      params: JSON.stringify(parsed.data.params ?? {}),
      imageIds: JSON.stringify(parsed.data.imageIds ?? []),
      cost: parsed.data.cost ?? 0,
    },
  })
  return NextResponse.json({ data: entry })
}
