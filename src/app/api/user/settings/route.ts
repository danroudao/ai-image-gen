import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const userId = auth.user!.id
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json(
      { error: { code: 404, message: '用户不存在', type: 'not_found' } },
      { status: 404 }
    )
  }

  const quota = await prisma.quota.findUnique({ where: { userId } })
  const [imageCount, taskCount] = await Promise.all([
    prisma.image.count({ where: { userId } }),
    prisma.generationTask.count({ where: { userId } }),
  ])

  return NextResponse.json({
    data: {
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      quota,
      _count: { images: imageCount, tasks: taskCount },
    },
  })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  const updateData: Record<string, unknown> = {}

  if (body.name !== undefined) updateData.name = body.name

  if (body.currentPassword && body.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: auth.user!.id } })
    if (!user || !(await bcrypt.compare(body.currentPassword, user.password))) {
      return NextResponse.json(
        { error: { code: 400, message: '当前密码错误', type: 'validation_error' } },
        { status: 400 }
      )
    }
    updateData.password = await bcrypt.hash(body.newPassword, 10)
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({ where: { id: auth.user!.id }, data: updateData })
  }

  return NextResponse.json({ message: '已更新' })
}
