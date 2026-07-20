import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const config = await prisma.systemConfig.findUnique({ where: { id: 'default' } })
  return NextResponse.json({
    data: config ?? {
      id: 'default',
      defaultMaxTasks: 3,
      defaultMonthlyLimit: 500,
      maxStorageMB: 500,
      allowRegistration: true,
    },
  })
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  try {
    const body = await request.json()

    const data: {
      defaultMaxTasks?: number
      defaultMonthlyLimit?: number
      maxStorageMB?: number
      allowRegistration?: boolean
    } = {}

    if (typeof body.defaultMaxTasks === 'number') data.defaultMaxTasks = body.defaultMaxTasks
    if (typeof body.defaultMonthlyLimit === 'number') data.defaultMonthlyLimit = body.defaultMonthlyLimit
    if (typeof body.maxStorageMB === 'number') data.maxStorageMB = body.maxStorageMB
    if (typeof body.allowRegistration === 'boolean') data.allowRegistration = body.allowRegistration

    const config = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    })

    return NextResponse.json({ data: config })
  } catch (e) {
    console.error('Settings save error:', e)
    return NextResponse.json(
      { error: { code: 500, message: '保存失败: ' + (e instanceof Error ? e.message : '未知错误'), type: 'server_error' } },
      { status: 500 }
    )
  }
}
