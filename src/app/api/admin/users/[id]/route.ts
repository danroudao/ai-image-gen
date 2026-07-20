import { NextRequest, NextResponse } from 'next/server'
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { id } = await params
  const body = await request.json()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.role !== undefined) updateData.role = body.role
  if (body.password) {
    updateData.password = await bcrypt.hash(body.password, 10)
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id }, data: updateData })
  }

  if (body.maxTasks !== undefined || body.monthlyLimit !== undefined) {
    const quotaData: Record<string, unknown> = {}
    if (body.maxTasks !== undefined) quotaData.maxTasks = body.maxTasks
    if (body.monthlyLimit !== undefined) quotaData.monthlyLimit = body.monthlyLimit
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
