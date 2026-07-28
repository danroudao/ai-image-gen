'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings-store'
import { AuthStatus } from './AuthStatus'

export function Header() {
  const { theme, setTheme } = useSettingsStore()

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const iconMap = { light: Moon, dark: Sun, system: Monitor }
  const titleMap = { light: '切换到暗色', dark: '跟随系统', system: '切换到亮色' }
  const Icon = iconMap[theme]
  const title = titleMap[theme]

  return (
    <header className="flex items-center justify-between border-b px-3 md:px-4 py-2 md:py-3 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="size-7 md:size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs md:text-sm">
          AI
        </div>
        <span className="font-semibold text-base md:text-lg">AI 绘图</span>
      </div>
      <div className="flex items-center gap-2">
        <AuthStatus />
        <button
          type="button"
          className="inline-flex items-center justify-center size-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
          onClick={toggleTheme}
          title={title}
        >
          <Icon className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
