import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@ai-image.local' } })
  if (existing) {
    return NextResponse.json({ message: '管理员账号已存在' })
  }

  const password = await bcrypt.hash('admin123456', 10)
  const user = await prisma.user.create({
    data: {
      email: 'admin@ai-image.local',
      password,
      name: '管理员',
      role: 'admin',
    },
  })

  await prisma.quota.create({
    data: { userId: user.id, maxTasks: 10, monthlyLimit: 5000 },
  })

  return NextResponse.json({ message: '管理员账号创建成功', id: user.id })
}
