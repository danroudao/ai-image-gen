'use client'

import { useEffect, useCallback } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    },
    [onCancel]
  )

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-card border rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${variant === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          <button
            type="button"
            className="size-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] px-4 rounded-lg text-sm font-medium border border-input bg-background hover:bg-muted transition-colors cursor-pointer"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`min-h-[44px] min-w-[44px] px-4 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer ${
              variant === 'destructive'
                ? 'bg-destructive hover:bg-destructive/90'
                : 'bg-primary hover:bg-primary/90'
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
