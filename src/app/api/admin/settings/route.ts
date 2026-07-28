import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

const settingsSchema = z.object({
  defaultMaxTasks: z.number().int().min(1).max(1000).optional(),
  defaultMonthlyLimit: z.number().int().min(1).max(100000).optional(),
  maxStorageMB: z.number().int().min(50).max(100000).optional(),
  allowRegistration: z.boolean().optional(),
})

export async function PUT(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  try {
    const raw = await request.json()
    const parsed = settingsSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 400, message: '参数校验失败: ' + parsed.error.issues.map(i => i.message).join('; '), type: 'validation_error' } },
        { status: 400 }
      )
    }

    const config = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...parsed.data },
      update: parsed.data,
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
