import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const API_BASE = 'https://api.apib.ai/v1'
const GENERATED_DIR = path.join(process.cwd(), 'public', 'generated')
const MAX_IMAGES = 50

async function downloadImage(url: string): Promise<string> {
  const res = await fetch(url)
  const buffer = Buffer.from(await res.arrayBuffer())
  const name = `${crypto.randomUUID()}.png`
  const filePath = path.join(GENERATED_DIR, name)
  await fs.mkdir(GENERATED_DIR, { recursive: true })
  await fs.writeFile(filePath, buffer)
  return `/generated/${name}`
}

async function cleanupOldImages() {
  try {
    const files = await fs.readdir(GENERATED_DIR)
    if (files.length <= MAX_IMAGES) return
    const sorted = files
      .map((f) => ({ name: f, time: fs.stat(path.join(GENERATED_DIR, f)).then((s) => s.mtimeMs) }))
    const stats = await Promise.all(sorted.map((s) => s.time.then((t) => ({ name: s.name, mtimeMs: t }))))
    stats.sort((a, b) => b.mtimeMs - a.mtimeMs)
    const toDelete = stats.slice(MAX_IMAGES)
    for (const f of toDelete) {
      await fs.unlink(path.join(GENERATED_DIR, f.name)).catch(() => {})
    }
  } catch { /* directory might not exist */ }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
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
      const localUrls: string[] = []
      for (const img of data.data.result.images) {
        for (const url of img.url) {
          const localUrl = await downloadImage(url)
          localUrls.push(localUrl)
        }
      }
      await cleanupOldImages()
      return NextResponse.json({
        ...data,
        data: { ...data.data, localImages: localUrls },
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
