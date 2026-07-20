import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/api-utils'

const UPLOAD_DIR = path.join(process.cwd(), 'private', 'uploads')

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = 30

  const where: Record<string, unknown> = {}
  if (userId) where.userId = userId

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.image.count({ where }),
  ])

  const userIds = [...new Set(images.map(i => i.userId).filter(Boolean))]
  const users = userIds.length > 0
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true, name: true } })
    : []
  const userMap = new Map(users.map(u => [u.id, u]))

  const data = images.map(i => ({
    ...i,
    user: userMap.get(i.userId) ?? null,
    url: `/api/images/${i.id}`,
    thumbnailUrl: `/api/images/${i.id}/thumbnail`,
  }))

  // get all user list for filter dropdown
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true }, orderBy: { createdAt: 'desc' } })

  return NextResponse.json({ data, total, page, pageSize, users: allUsers })
}

export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin.error) return admin.error

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: { code: 400, message: '缺少图片 ID', type: 'validation_error' } }, { status: 400 })
  }

  const image = await prisma.image.findUnique({ where: { id } })
  if (!image) {
    return NextResponse.json({ error: { code: 404, message: '图片不存在', type: 'not_found' } }, { status: 404 })
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(image.filePath))
  try { fs.unlinkSync(filePath) } catch { /* file may not exist */ }
  await prisma.image.delete({ where: { id } })

  return NextResponse.json({ message: '已删除' })
}
