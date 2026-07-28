import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

const createUserSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少 6 位').max(100),
  name: z.string().max(100).optional(),
  role: z.enum(['user', 'admin']).optional(),
})

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const raw = await request.json()
  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 400, message: '参数校验失败: ' + parsed.error.issues.map(i => i.message).join('; '), type: 'validation_error' } },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return NextResponse.json({ error: { code: 409, message: '邮箱已存在', type: 'conflict' } }, { status: 409 })
  }

  const password = await bcrypt.hash(parsed.data.password, 10)
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password,
      name: parsed.data.name ?? '',
      role: parsed.data.role ?? 'user',
    },
  })

  const sysConfig = await prisma.systemConfig.findUnique({ where: { id: 'default' } })

  await prisma.quota.create({
    data: {
      userId: user.id,
      maxTasks: sysConfig?.defaultMaxTasks ?? 3,
      monthlyLimit: sysConfig?.defaultMonthlyLimit ?? 500,
    },
  })

  return NextResponse.json({ data: { id: user.id, email: user.email, name: user.name, role: user.role } })
}
