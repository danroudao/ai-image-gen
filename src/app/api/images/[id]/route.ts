import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

const UPLOAD_DIR = path.join(process.cwd(), 'private', 'uploads')

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { id } = await params
  const image = await prisma.image.findUnique({
    where: auth.user!.role === 'admin' ? { id } : { id, userId: auth.user!.id },
  })
  if (!image) {
    return NextResponse.json({ error: { code: 404, message: '图片不存在', type: 'not_found' } }, { status: 404 })
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(image.filePath))
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: { code: 404, message: '图片文件不存在', type: 'not_found' } }, { status: 404 })
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const fileBuffer = fs.readFileSync(filePath)

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
