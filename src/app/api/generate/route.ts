import { NextRequest, NextResponse } from 'next/server'

const API_BASE = 'https://api.apib.ai/v1'

export async function POST(request: NextRequest) {
  const apiKey = process.env.APIB_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: 401, message: '服务端未配置 API Key，请在 .env.local 中设置 APIB_API_KEY', type: 'config_error' } },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const res = await fetch(`${API_BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json(
      { error: { code: 500, message: '请求上游服务失败', type: 'server_error' } },
      { status: 500 }
    )
  }
}
