import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GenerationState, TaskStatus, TaskItem } from '@/lib/types'

interface GenerationStore extends GenerationState {
  startGeneration: () => void
  setGenerating: (generating: boolean) => void
  setStatus: (status: TaskStatus | null) => void
  setProgress: (progress: number) => void
  setImages: (images: string[]) => void
  appendImages: (images: string[]) => void
  setError: (error: string | null) => void
  setCost: (cost: number | null) => void
  setViewingHistory: (v: boolean) => void
  addTask: (task: TaskItem) => void
  updateTask: (id: string, partial: Partial<TaskItem>) => void
  clearCompletedTasks: () => void
  reset: () => void
}

const initialState: GenerationState = {
  isGenerating: false,
  taskId: null,
  status: null,
  progress: 0,
  images: [],
  error: null,
  cost: null,
  viewingHistory: false,
  tasks: [],
}

export const useGenerationStore = create<GenerationStore>()(
  persist(
    (set) => ({
      ...initialState,
      startGeneration: () => set({ isGenerating: true, error: null }),
      setGenerating: (generating) => set({ isGenerating: generating }),
      setStatus: (status) => set({ status }),
      setProgress: (progress) => set({ progress }),
      setImages: (images) => set({ images }),
      appendImages: (images) =>
        set((state) => {
          // de-duplicate: the same image URL must never appear twice
          const seen = new Set(state.images)
          const unique = images.filter((img) => !seen.has(img))
          return { images: [...state.images, ...unique].slice(-100) }
        }),
      setError: (error) => set({ error, isGenerating: false }),
      setCost: (cost) => set({ cost }),
      setViewingHistory: (v) => set({ viewingHistory: v }),
      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, partial) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...partial } : t)),
        })),
      clearCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.status === 'running' || t.status === 'queued'),
        })),
      reset: () => set(initialState),
    }),
    {
      name: 'ai-image-generation',
      partialize: (state) => ({
        tasks: state.tasks,
        isGenerating: state.isGenerating,
        images: state.images,
        status: state.status,
        progress: state.progress,
        cost: state.cost,
        error: state.error,
        viewingHistory: state.viewingHistory,
      }),
      onRehydrateStorage: () => (state) => {
        // Guard against stale persisted state: cap images to the latest 100
        // unique URLs (the duplicate-download bug could accumulate thousands).
        if (state) {
          const unique = [...new Set(state.images)]
          if (unique.length !== state.images.length || unique.length > 100) {
            useGenerationStore.setState({ images: unique.slice(-100) })
          }
          // Fix leaked isGenerating: without any running/queued task there is
          // nothing to generate, so the spinner/progress must not stay visible.
          const hasActive = (state.tasks ?? []).some(
            (t) => t.status === 'running' || t.status === 'queued'
          )
          if (state.isGenerating && !hasActive) {
            useGenerationStore.setState({ isGenerating: false })
          }
        }
      },
    }
  )
)
