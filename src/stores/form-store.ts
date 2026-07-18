import { create } from 'zustand'
import { UploadedImage } from '@/components/ImageUploader'

interface FormStore {
  prompt: string
  setPrompt: (prompt: string) => void
  refImages: UploadedImage[]
  setRefImages: (images: UploadedImage[] | ((prev: UploadedImage[]) => UploadedImage[])) => void
}

export const useFormStore = create<FormStore>((set) => ({
  prompt: '',
  setPrompt: (prompt) => set({ prompt }),
  refImages: [],
  setRefImages: (images) =>
    set((state) => ({
      refImages: typeof images === 'function' ? images(state.refImages) : images,
    })),
}))
