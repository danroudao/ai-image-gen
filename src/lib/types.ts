export type AspectRatio =
  | 'auto' | '1:1' | '3:2' | '2:3' | '4:3' | '3:4'
  | '5:4' | '4:5' | '16:9' | '9:16' | '2:1' | '1:2'
  | '3:1' | '1:3' | '21:9' | '9:21'

export type Resolution = '1k' | '2k' | '4k'

export type TaskStatus =
  | 'pending'
  | 'submitted'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface GenerationParams {
  model: string
  prompt: string
  n: number
  size: string
  resolution: Resolution
  image_urls?: string[]
  official_fallback?: boolean
}

export interface ApiError {
  code: number
  message: string
  type: string
}

export interface GenerateResponse {
  code: number
  data: { status: string; task_id: string }[]
  error?: ApiError
}

export interface TaskImage {
  url: string[]
  expires_at: number
}

export interface TaskResult {
  images?: TaskImage[]
}

export interface TaskData {
  id: string
  status: TaskStatus
  progress: number
  cost?: number
  credits_cost?: number
  created: number
  completed?: number
  estimated_time?: number
  actual_time?: number
  result?: TaskResult
  error?: ApiError
  localImages?: string[]
}

export interface TaskQueryResponse {
  code: number
  data: TaskData
  error?: ApiError
}

export interface HistoryEntry {
  id: string
  task_id: string
  params: GenerationParams
  localImages: string[]
  cost: number
  created_at: number
}

export interface TaskItem {
  id: string
  taskId: string
  prompt: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  images: string[]
  cost: number
  size: string
  resolution: string
  createdAt: number
}

export interface GenerationState {
  isGenerating: boolean
  taskId: string | null
  status: TaskStatus | null
  progress: number
  images: string[]
  error: string | null
  cost: number | null
  viewingHistory: boolean
  tasks: TaskItem[]
}
