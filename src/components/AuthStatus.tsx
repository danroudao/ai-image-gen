'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'

export function AuthStatus() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        登录
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {session.user.email}
      </span>
      <Link
        href="/settings"
        className="inline-flex items-center justify-center size-10 rounded-md hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
        title="设置"
      >
        <Settings className="h-4 w-4" />
      </Link>
      {session.user.role === 'admin' && (
        <Link
          href="/admin"
          className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors px-3"
        >
          管理
        </Link>
      )}
      <button
        type="button"
        className="inline-flex items-center justify-center size-10 rounded-md hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={() => signOut()}
        title="退出登录"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
