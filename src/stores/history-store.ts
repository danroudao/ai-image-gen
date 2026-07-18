import { create } from 'zustand'
import { HistoryEntry } from '@/lib/types'

const MAX_HISTORY = 10
const STORAGE_KEY = 'ai-image-history'

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* quota exceeded, silently fail */ }
}

interface HistoryStore {
  entries: HistoryEntry[]
  addEntry: (entry: HistoryEntry) => void
  removeEntry: (id: string) => void
  clearAll: () => void
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  entries: loadHistory(),
  addEntry: (entry) =>
    set((state) => {
      const next = [entry, ...state.entries].slice(0, MAX_HISTORY)
      saveHistory(next)
      return { entries: next }
    }),
  removeEntry: (id) =>
    set((state) => {
      const next = state.entries.filter((e) => e.id !== id)
      saveHistory(next)
      return { entries: next }
    }),
  clearAll: () => {
    saveHistory([])
    return { entries: [] }
  },
}))
