import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GenerationState, TaskStatus, TaskItem } from '@/lib/types'

interface GenerationStore extends GenerationState {
  startGeneration: () => void
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
      setStatus: (status) => set({ status }),
      setProgress: (progress) => set({ progress }),
      setImages: (images) => set({ images }),
      appendImages: (images) =>
        set((state) => ({ images: [...state.images, ...images] })),
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
    }
  )
)
