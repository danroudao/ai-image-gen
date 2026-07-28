import { GenerationParams, GenerateResponse, TaskQueryResponse } from './types'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body?.error?.message ?? `请求失败 (${res.status})`, res.status)
  }
  return res.json()
}

export async function submitGeneration(params: GenerationParams): Promise<GenerateResponse> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse<GenerateResponse>(res)
}

export async function queryTask(taskId: string): Promise<TaskQueryResponse> {
  const res = await fetch(`/api/tasks/${taskId}`)
  return handleResponse<TaskQueryResponse>(res)
}
