import { create } from 'zustand'
import { HistoryEntry } from '@/lib/types'

const MAX_HISTORY = 10

async function fetchHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch('/api/history')
    const json = await res.json()
    if (!json.data) return []
    return json.data.map((e: Record<string, unknown>) => ({
      id: e.id as string,
      task_id: '',
      params: JSON.parse(e.params as string),
      localImages: [],
      imageIds: JSON.parse(e.imageIds as string) as string[],
      cost: (e.cost as number) ?? 0,
      created_at: new Date(e.createdAt as string).getTime(),
    }))
  } catch {
    return []
  }
}

async function saveEntry(entry: HistoryEntry) {
  try {
    await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        params: entry.params,
        imageIds: entry.imageIds ?? [],
        cost: entry.cost,
      }),
    })
  } catch { /* silently fail */ }
}

async function removeEntryFromApi(id: string) {
  try {
    await fetch(`/api/history/${id}`, { method: 'DELETE' })
  } catch { /* silently fail */ }
}

interface HistoryStore {
  entries: HistoryEntry[]
  loaded: boolean
  loadHistory: () => Promise<void>
  addEntry: (entry: HistoryEntry) => void
  removeEntry: (id: string) => void
  clearAll: () => void
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  entries: [],
  loaded: false,
  loadHistory: async () => {
    const entries = await fetchHistory()
    set({ entries, loaded: true })
  },
  addEntry: (entry) => {
    saveEntry(entry)
    set((state) => ({
      entries: [entry, ...state.entries].slice(0, MAX_HISTORY),
    }))
  },
  removeEntry: (id) => {
    removeEntryFromApi(id)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))
  },
  clearAll: () => {
    set({ entries: [] })
  },
}))
