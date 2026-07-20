import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils'

const API_BASE = 'https://api.apib.ai/v1'
const UPLOAD_DIR = path.join(process.cwd(), 'private', 'uploads')
const MAX_IMAGES = 50

async function downloadImage(url: string, userId: string): Promise<{ localPath: string; imageId: string }> {
  const res = await fetch(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  const name = `${uuidv4()}.png`
  const filePath = path.join(UPLOAD_DIR, name)
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(filePath, buffer)

  const image = await prisma.image.create({
    data: {
      userId,
      filePath: name,
      prompt: '',
    },
  })

  return { localPath: name, imageId: image.id }
}

async function cleanupOldImages() {
  try {
    const files = await fs.readdir(UPLOAD_DIR)
    if (files.length <= MAX_IMAGES) return
    const sorted = files
      .map((f) => ({ name: f, time: fs.stat(path.join(UPLOAD_DIR, f)).then((s) => s.mtimeMs) }))
    const stats = await Promise.all(sorted.map((s) => s.time.then((t) => ({ name: s.name, mtimeMs: t }))))
    stats.sort((a, b) => b.mtimeMs - a.mtimeMs)
    const toDelete = stats.slice(MAX_IMAGES)
    for (const f of toDelete) {
      await fs.unlink(path.join(UPLOAD_DIR, f.name)).catch(() => {})
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

  try {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const data = await res.json()

    if (res.ok && data.data?.status === 'completed' && data.data?.result?.images) {
      const imageIds: string[] = []
      const localPaths: string[] = []

      for (const img of data.data.result.images) {
        for (const url of img.url) {
          const result = await downloadImage(url, auth.user!.id)
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

      // update quota usage
      const cost = data.data.cost ?? 0
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
