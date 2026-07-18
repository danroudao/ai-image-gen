import { create } from 'zustand'
import { GenerationState, TaskStatus } from '@/lib/types'

interface GenerationStore extends GenerationState {
  startGeneration: () => void
  setTaskId: (taskId: string) => void
  setStatus: (status: TaskStatus) => void
  setProgress: (progress: number) => void
  setImages: (images: string[]) => void
  appendImages: (images: string[]) => void
  setError: (error: string | null) => void
  setCost: (cost: number | null) => void
  setTotalTasks: (n: number) => void
  incrementCompleted: () => void
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
  totalTasks: 0,
  completedTasks: 0,
}

export const useGenerationStore = create<GenerationStore>((set) => ({
  ...initialState,
  startGeneration: () => set({ ...initialState, isGenerating: true }),
  setTaskId: (taskId) => set({ taskId }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setImages: (images) => set({ images }),
  appendImages: (images) =>
    set((state) => ({ images: [...state.images, ...images] })),
  setError: (error) => set({ error, isGenerating: false }),
  setCost: (cost) => set({ cost }),
  setTotalTasks: (n) => set({ totalTasks: n, completedTasks: 0 }),
  incrementCompleted: () =>
    set((state) => {
      const completed = state.completedTasks + 1
      return {
        completedTasks: completed,
        isGenerating: completed >= state.totalTasks ? false : state.isGenerating,
      }
    }),
  reset: () => set(initialState),
}))
