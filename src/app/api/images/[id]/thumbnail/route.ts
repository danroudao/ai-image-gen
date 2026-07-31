import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

const UPLOAD_DIR = path.join(process.cwd(), 'private', 'uploads')
const THUMB_DIR = path.join(process.cwd(), 'private', 'thumbs')
const THUMB_WIDTH = 256

const CACHE_HEADERS = {
  'Content-Type': 'image/webp',
  'Cache-Control': 'public, max-age=31536000, immutable',
} as const

/** Zero-copy view of a Node Buffer as a typed body (avoids BodyInit type mismatch). */
function toBody(buf: Buffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(buf.buffer as ArrayBuffer, buf.byteOffset, buf.byteLength)
}

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

  // Serve cached thumbnail (lazy-generated, immutable since file names are uuid-based)
  const thumbPath = path.join(THUMB_DIR, `${id}.webp`)
  try {
    const thumb = await fs.readFile(thumbPath)
    return new NextResponse(toBody(thumb), { headers: CACHE_HEADERS })
  } catch {
    // not cached yet — generate below
  }

  // Generate thumbnail from the full image on first request
  try {
    const filePath = path.join(UPLOAD_DIR, path.basename(image.filePath))
    const full = await fs.readFile(filePath)
    const thumb = await sharp(full)
      .resize(THUMB_WIDTH, THUMB_WIDTH, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    await fs.mkdir(THUMB_DIR, { recursive: true })
    await fs.writeFile(thumbPath, thumb)

    return new NextResponse(toBody(thumb), { headers: CACHE_HEADERS })
  } catch {
    return NextResponse.json(
      { error: { code: 404, message: '图片文件不存在', type: 'not_found' } },
      { status: 404 }
    )
  }
}
