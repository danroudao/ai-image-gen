import { NextResponse } from 'next/server'

export function apiError(code: number, message: string, type: string) {
  return NextResponse.json({ error: { code, message, type } }, { status: code })
}
