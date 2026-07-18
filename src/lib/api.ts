import { GenerationParams, GenerateResponse, TaskQueryResponse } from './types'

export async function submitGeneration(params: GenerationParams): Promise<GenerateResponse> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return res.json()
}

export async function queryTask(taskId: string): Promise<TaskQueryResponse> {
  const res = await fetch(`/api/tasks/${taskId}`)
  return res.json()
}
