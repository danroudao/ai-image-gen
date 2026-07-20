import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const result = await Promise.all(users.map(async (u) => {
    const [quota, imageCount] = await Promise.all([
      prisma.quota.findUnique({ where: { userId: u.id } }),
      prisma.image.count({ where: { userId: u.id } }),
    ])
    return { ...u, quota, _count: { images: imageCount } }
  }))

  return NextResponse.json({ data: result })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const body = await request.json()
  if (!body.email || !body.password) {
    return NextResponse.json({ error: { code: 400, message: '邮箱和密码不能为空', type: 'validation_error' } }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    return NextResponse.json({ error: { code: 409, message: '邮箱已存在', type: 'conflict' } }, { status: 409 })
  }

  const password = await bcrypt.hash(body.password, 10)
  const user = await prisma.user.create({
    data: {
      email: body.email,
      password,
      name: body.name ?? '',
      role: body.role ?? 'user',
    },
  })

  await prisma.quota.create({
    data: { userId: user.id },
  })

  return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
