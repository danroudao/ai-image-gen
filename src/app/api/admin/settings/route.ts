import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const config = await prisma.systemConfig.findUnique({ where: { id: 'default' } })
  return NextResponse.json({ data: config ?? { defaultMaxTasks: 3, defaultMonthlyLimit: 500, allowRegistration: true } })
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const body = await request.json()
  const updateData: Record<string, unknown> = {}
  if (body.defaultMaxTasks !== undefined) updateData.defaultMaxTasks = body.defaultMaxTasks
  if (body.defaultMonthlyLimit !== undefined) updateData.defaultMonthlyLimit = body.defaultMonthlyLimit
  if (body.maxStorageMB !== undefined) updateData.maxStorageMB = body.maxStorageMB
  if (body.allowRegistration !== undefined) updateData.allowRegistration = body.allowRegistration

  const config = await prisma.systemConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', ...updateData } as Record<string, unknown>,
    update: updateData,
  })

  return NextResponse.json({ data: config })
}
