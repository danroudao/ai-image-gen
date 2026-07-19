import { create } from 'zustand'
import { GenerationState, TaskStatus, TaskItem } from '@/lib/types'

interface GenerationStore extends GenerationState {
  startGeneration: () => void
  setTaskId: (taskId: string) => void
  setStatus: (status: TaskStatus | null) => void
  setProgress: (progress: number) => void
  setImages: (images: string[]) => void
  appendImages: (images: string[]) => void
  setError: (error: string | null) => void
  setCost: (cost: number | null) => void
  setViewingHistory: (v: boolean) => void
  addTask: (task: TaskItem) => void
  updateTask: (id: string, partial: Partial<TaskItem>) => void
  removeTask: (id: string) => void
  removeRecentCompleted: () => void
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

export const useGenerationStore = create<GenerationStore>((set) => ({
  ...initialState,
  startGeneration: () => set({ isGenerating: true, error: null }),
  setTaskId: (taskId) => set({ taskId }),
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
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  removeRecentCompleted: () =>
    set((state) => ({
      tasks: state.tasks.filter(
        (t) => t.status !== 'completed' || Date.now() - t.createdAt < 5000
      ),
    })),
  reset: () => set(initialState),
}))
