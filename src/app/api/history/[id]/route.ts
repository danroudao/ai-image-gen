import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params
  const entry = await prisma.historyEntry.findUnique({ where: { id } })
  if (!entry || entry.userId !== auth.user!.id) {
    return NextResponse.json({ error: { code: 404, message: '记录不存在', type: 'not_found' } }, { status: 404 })
  }

  await prisma.historyEntry.delete({ where: { id } })
  return NextResponse.json({ message: '已删除' })
}
