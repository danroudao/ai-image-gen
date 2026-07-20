import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const images = await prisma.image.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ data: images })
}
