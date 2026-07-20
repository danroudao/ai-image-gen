import { NextResponse } from 'next/server'
import { auth } from './auth'

export function apiError(code: number, message: string, type: string) {
  return NextResponse.json({ error: { code, message, type } }, { status: code })
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: apiError(401, '请先登录', 'auth_error'), user: null }
  }
  return { error: null, user: { id: session.user.id, role: session.user.role } }
}

export async function requireAdmin() {
  const result = await requireAuth()
  if (result.error) return result
  if (result.user?.role !== 'admin') {
    return { error: apiError(403, '需要管理员权限', 'auth_error'), user: null }
  }
  return result
}
