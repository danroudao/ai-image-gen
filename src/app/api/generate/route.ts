import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const API_BASE = 'https://api.apib.ai/v1'

const bodySchema = z.object({
  model: z.string().min(1),
  prompt: z.string().min(1).max(2000),
  n: z.number().int().min(1).max(10).default(1),
  size: z.string().optional(),
  resolution: z.enum(['1k', '2k', '4k']).optional(),
  image_urls: z.array(z.string()).max(16).optional(),
  official_fallback: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  const apiKey = process.env.APIB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: 401, message: '服务端未配置 API Key，请在 .env.local 中设置 APIB_API_KEY', type: 'config_error' } },
      { status: 401 }
    )
  }

  try {
    const raw = await request.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 400, message: '请求参数校验失败: ' + parsed.error.issues.map(i => i.message).join('; '), type: 'validation_error' } },
        { status: 400 }
      )
    }

    const res = await fetch(`${API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsed.data),
    })

    const data = await res.json()

    if (res.ok && data.data) {
      for (const task of data.data) {
        await prisma.generationTask.create({
          data: {
            apiTaskId: task.task_id,
            prompt: parsed.data.prompt,
            status: 'running',
          },
        }).catch(() => {})
      }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json(
      { error: { code: 500, message: '请求上游服务失败', type: 'server_error' } },
      { status: 500 }
    )
  }
}
