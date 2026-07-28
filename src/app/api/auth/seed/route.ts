import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    return NextResponse.json({ message: '已有用户存在，种子脚本仅限空数据库使用' }, { status: 403 })
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
