import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import sharp from 'sharp'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

const API_BASE = 'https://api.apib.ai/v1'
const UPLOAD_DIR = path.join(process.cwd(), 'private', 'uploads')
const MIN_FREE_BYTES = 200 * 1024 * 1024 // keep at least 200MB free after cleanup

async function getMaxStorageMB(): Promise<number> {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { id: 'default' } })
    return config?.maxStorageMB ?? 500
  } catch {
    return 500
  }
}

async function downloadImage(url: string, userId: string, cost: number, model: string): Promise<{ localPath: string; imageId: string }> {
  const res = await fetch(url)
  const buffer = Buffer.from(await res.arrayBuffer())

  // convert to WebP via sharp
  const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer()
  const name = `${uuidv4()}.webp`
  const filePath = path.join(UPLOAD_DIR, name)
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(filePath, webpBuffer)

  const image = await prisma.image.create({
    data: {
      userId,
      filePath: name,
      prompt: '',
      size: `${buffer.length}B->${webpBuffer.length}B`,
      cost,
      model,
    },
  })

  return { localPath: name, imageId: image.id }
}

async function getDirSize(dir: string): Promise<number> {
  const files = await fs.readdir(dir)
  let total = 0
  for (const f of files) {
    try {
      const stat = await fs.stat(path.join(dir, f))
      total += stat.size
    } catch { /* skip */ }
  }
  return total
}

async function cleanupOldImages() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {})
    const maxStorageMB = await getMaxStorageMB()
    const maxBytes = maxStorageMB * 1024 * 1024

    // delete DB records with no corresponding file
    const allImages = await prisma.image.findMany({ select: { id: true, filePath: true } })
    for (const img of allImages) {
      try {
        await fs.access(path.join(UPLOAD_DIR, img.filePath))
      } catch {
        await prisma.image.delete({ where: { id: img.id } }).catch(() => {})
      }
    }

    // check total size
    const totalBytes = await getDirSize(UPLOAD_DIR)
    if (totalBytes <= maxBytes) return

    // read files sorted by mtime ascending (oldest first)
    const files = await fs.readdir(UPLOAD_DIR)
    const stats = await Promise.all(
      files.map(async (f) => {
        try {
          const s = await fs.stat(path.join(UPLOAD_DIR, f))
          return { name: f, mtimeMs: s.mtimeMs, size: s.size }
        } catch {
          return null
        }
      })
    )
    const valid = stats.filter(Boolean) as { name: string; mtimeMs: number; size: number }[]
    valid.sort((a, b) => a.mtimeMs - b.mtimeMs)

    let deleted = 0
    let freed = 0
    const targetBytes = maxBytes - MIN_FREE_BYTES

    for (const f of valid) {
      if (totalBytes - freed <= targetBytes) break
      await fs.unlink(path.join(UPLOAD_DIR, f.name)).catch(() => {})
      await prisma.image.deleteMany({ where: { filePath: f.name } }).catch(() => {})
      freed += f.size
      deleted++
    }

    if (deleted > 0) {
      console.log(`cleanup: deleted ${deleted} files, freed ${(freed / 1024 / 1024).toFixed(1)}MB`)
    }
  } catch { /* directory might not exist */ }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const apiKey = process.env.APIB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: 401, message: '服务端未配置 API Key，请在 .env.local 中设置 APIB_API_KEY', type: 'config_error' } },
      { status: 401 }
    )
  }

  const { taskId } = await params

  // verify task ownership if it exists in our DB
  const existingTask = await prisma.generationTask.findFirst({ where: { apiTaskId: taskId } })
  if (existingTask && existingTask.userId !== auth.user!.id && auth.user!.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 403, message: '无权访问该任务', type: 'forbidden' } },
      { status: 403 }
    )
  }

  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const data = await res.json()

    if (res.ok && data.data?.status === 'completed' && data.data?.result?.images) {
      const imageIds: string[] = []
      const localPaths: string[] = []

      // calculate cost per image
      const totalImages = data.data.result.images.reduce((sum: number, img: { url: string[] }) => sum + img.url.length, 0)
      const costPerImage = totalImages > 0 ? (data.data.cost ?? 0) / totalImages : 0

      const taskModel = existingTask?.model ?? 'gpt-image-2'

      for (const img of data.data.result.images) {
        for (const url of img.url) {
          const result = await downloadImage(url, auth.user!.id, costPerImage, taskModel)
          imageIds.push(result.imageId)
          localPaths.push(`/api/images/${result.imageId}`)
        }
      }

      await cleanupOldImages()

      await prisma.generationTask.updateMany({
        where: { apiTaskId: taskId },
        data: {
          status: 'completed',
          cost: data.data.cost ?? 0,
          imageCount: imageIds.length,
          completedAt: new Date(),
        },
      }).catch(() => {})

      await prisma.quota.updateMany({
        where: { userId: auth.user!.id },
        data: { usedThisMonth: { increment: imageIds.length } },
      }).catch(() => {})

      return NextResponse.json({
        ...data,
        data: {
          ...data.data,
          localImages: localPaths,
          localImageIds: imageIds,
        },
      })
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Task query error:', err)
    return NextResponse.json(
      { error: { code: 500, message: '查询任务状态失败', type: 'server_error' } },
      { status: 500 }
    )
  }
}
