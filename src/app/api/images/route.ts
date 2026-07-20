import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const images = await prisma.image.findMany({
    where: { userId: auth.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ data: images })
}
