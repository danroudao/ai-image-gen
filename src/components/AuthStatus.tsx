'use client'

import { useSession, signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import Link from 'next/link'

export function AuthStatus() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center justify-center h-7 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        登录
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {session.user.email}
      </span>
      {session.user.role === 'admin' && (
        <Link
          href="/admin"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          管理
        </Link>
      )}
      <button
        type="button"
        className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={() => signOut()}
        title="退出登录"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
