'use client'

import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { useToastStore } from '@/stores/toast-store'

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
}

const colors = {
  success: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border shadow-lg backdrop-blur-sm text-sm animate-in slide-in-from-right ${colors[t.type]}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              className="shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
              onClick={() => removeToast(t.id)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
