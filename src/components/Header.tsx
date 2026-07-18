'use client'

import { Moon, Sun } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'

export function Header() {
  const { theme, setTheme } = useSettingsStore()

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const Icon = theme === 'dark' ? Sun : Moon

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 bg-background">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          AI
        </div>
        <span className="font-semibold text-lg">AI 绘图</span>
      </div>
      <button
        type="button"
        className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        onClick={toggleTheme}
        title="切换主题"
      >
        <Icon className="h-5 w-5" />
      </button>
    </header>
  )
}
