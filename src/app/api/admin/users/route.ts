import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

export async function GET() {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const [users, imageCounts, quotas] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.image.groupBy({ by: ['userId'], _count: { _all: true } }),
    prisma.quota.findMany(),
  ])

  const imageCountMap = new Map(imageCounts.map((g) => [g.userId, g._count._all]))
  const quotaMap = new Map(quotas.map((q) => [q.userId, q]))

  const result = users.map((u) => ({
    ...u,
    quota: quotaMap.get(u.id) ?? null,
    _count: { images: imageCountMap.get(u.id) ?? 0 },
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
