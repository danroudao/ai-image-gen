'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (status === 'authenticated' && session.user.role !== 'admin') router.push('/')
  }, [status, session, router])

  if (status === 'loading' || session?.user?.role !== 'admin') {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">加载中...</div>
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}
