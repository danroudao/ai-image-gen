import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const entries = await prisma.historyEntry.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  return NextResponse.json({ data: entries })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const entry = await prisma.historyEntry.create({
    data: {
      params: JSON.stringify(body.params),
      imageIds: JSON.stringify(body.imageIds),
      cost: body.cost ?? 0,
    },
  })
  return NextResponse.json({ data: entry })
}
