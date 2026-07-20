'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') {
      const timer = setTimeout(() => router.push('/login'), 3000)
      return () => clearTimeout(timer)
    }
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex size-16 rounded-2xl bg-muted items-center justify-center">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">请先登录</h2>
          <p className="text-sm text-muted-foreground">
            使用管理员分配的账号登录后即可使用 AI 绘图功能
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-sm transition-all active:scale-[0.98]"
          >
            去登录
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
