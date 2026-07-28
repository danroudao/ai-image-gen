import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: { code: 404, message: '用户不存在', type: 'not_found' } }, { status: 404 })
  }

  const quota = await prisma.quota.findUnique({ where: { userId: id } })
  const [imageCount, taskCount] = await Promise.all([
    prisma.image.count({ where: { userId: id } }),
    prisma.generationTask.count({ where: { userId: id } }),
  ])

  return NextResponse.json({
    data: {
      ...user,
      quota,
      _count: { images: imageCount, tasks: taskCount },
    },
  })
}

const updateUserSchema = z.object({
  name: z.string().max(100).optional(),
  role: z.enum(['user', 'admin']).optional(),
  password: z.string().min(6).max(100).optional(),
  maxTasks: z.number().int().min(0).max(1000).optional(),
  monthlyLimit: z.number().int().min(0).max(100000).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { id } = await params
  const raw = await request.json()
  const parsed = updateUserSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 400, message: '参数校验失败: ' + parsed.error.issues.map(i => i.message).join('; '), type: 'validation_error' } },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role
  if (parsed.data.password) {
    updateData.password = await bcrypt.hash(parsed.data.password, 10)
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id }, data: updateData })
  }

  if (parsed.data.maxTasks !== undefined || parsed.data.monthlyLimit !== undefined) {
    const quotaData: Record<string, unknown> = {}
    if (parsed.data.maxTasks !== undefined) quotaData.maxTasks = parsed.data.maxTasks
    if (parsed.data.monthlyLimit !== undefined) quotaData.monthlyLimit = parsed.data.monthlyLimit
    await prisma.quota.upsert({
      where: { userId: id },
      create: { userId: id, ...quotaData } as { userId: string; maxTasks?: number; monthlyLimit?: number },
      update: quotaData,
    })
  }

  return NextResponse.json({ message: '已更新' })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { id } = await params
  if (id === admin.user!.id) {
    return NextResponse.json({ error: { code: 400, message: '不能删除自己', type: 'validation_error' } }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ message: '已删除' })
}
