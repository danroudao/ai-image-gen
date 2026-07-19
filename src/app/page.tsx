'use client'

import { useCallback, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Header } from '@/components/Header'
import { OperationPanel } from '@/components/OperationPanel'
import { ImageDisplayArea } from '@/components/ImageDisplayArea'
import { HistoryBar } from '@/components/HistoryBar'
import { TaskFlow } from '@/components/TaskFlow'
import { useGenerationStore } from '@/stores/generation-store'
import { useHistoryStore } from '@/stores/history-store'
import { useFormStore } from '@/stores/form-store'
import { v4 as uuidv4 } from 'uuid'
import { submitGeneration, queryTask } from '@/lib/api'
import { GenerationParams, HistoryEntry } from '@/lib/types'
import { UploadedImage } from '@/components/ImageUploader'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function urlToBase64(url: string): Promise<string> {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function Home() {
  const gen = useGenerationStore()
  const history = useHistoryStore()
  const form = useFormStore()
  const [lastParams, setLastParams] = useState<{ size: string; resolution: string } | null>(null)

  const pollSingle = useCallback(
    async (taskId: string): Promise<{ localImages: string[]; cost: number } | null> => {
      for (let i = 0; i < 120; i++) {
        const res = await queryTask(taskId)
        const task = res.data
        if (!task) return null
        if (task.status === 'completed') {
          if (task.localImages && task.localImages.length > 0) {
            return { localImages: task.localImages, cost: task.cost ?? 0 }
          }
          if (task.result?.images) {
            return { localImages: task.result.images.flatMap((img) => img.url), cost: task.cost ?? 0 }
          }
        }
        if (task.status === 'failed') {
          return null
        }
        await sleep(2000)
      }
      return null
    },
    []
  )

  const handleGenerate = useCallback(
    async (params: GenerationParams) => {
      gen.startGeneration()
      setLastParams({ size: params.size, resolution: params.resolution })

      const taskUid = uuidv4()
      const taskId = uuidv4()

      gen.addTask({
        id: taskUid,
        taskId,
        prompt: params.prompt.slice(0, 50),
        status: 'queued',
        progress: 0,
        images: [],
        cost: 0,
        size: params.size,
        resolution: params.resolution,
        createdAt: Date.now(),
      })

      try {
        const res = await submitGeneration(params)
        if (res.error) {
          gen.updateTask(taskUid, { status: 'failed' })
          gen.setError(res.error.message)
          return
        }

        const apiTask = res.data?.[0]
        if (!apiTask?.task_id) {
          gen.updateTask(taskUid, { status: 'failed' })
          gen.setError('提交失败：未获取到任务 ID')
          return
        }

        gen.updateTask(taskUid, { taskId: apiTask.task_id, status: 'running' })
        gen.setTaskId(apiTask.task_id)
        gen.setStatus('submitted')
        gen.setProgress(5)

        const result = await pollSingle(apiTask.task_id)
        if (result) {
          gen.appendImages(result.localImages)
          gen.updateTask(taskUid, {
            status: 'completed',
            images: result.localImages,
            cost: result.cost,
            progress: 100,
          })
          gen.setCost(result.cost)
          gen.setProgress(100)
          gen.setStatus('completed')

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { image_urls, ...cleanParams } = params
          history.addEntry({
            id: uuidv4(),
            task_id: apiTask.task_id,
            params: cleanParams,
            localImages: result.localImages,
            cost: result.cost,
            created_at: Date.now(),
          })
        } else {
          gen.updateTask(taskUid, { status: 'failed' })
          gen.setError('生成超时或失败')
        }
      } catch (err) {
        gen.updateTask(taskUid, { status: 'failed' })
        gen.setError(err instanceof Error ? err.message : '网络错误')
      }
    },
    [gen, history, pollSingle]
  )

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      gen.setError(null)
      gen.setStatus(null)
      gen.setViewingHistory(true)
      gen.setImages(entry.localImages)
      gen.setCost(entry.cost)
      setLastParams({ size: entry.params.size, resolution: entry.params.resolution })
      if (entry.params.prompt) {
        form.setPrompt(entry.params.prompt)
      }
    },
    [gen, form]
  )

  const handleHistoryRemove = useCallback(
    (id: string) => {
      history.removeEntry(id)
    },
    [history]
  )

  const handleReusePrompt = useCallback(
    (prompt: string) => {
      form.setPrompt(prompt)
    },
    [form]
  )

  const handleUseAsRef = useCallback(
    async (url: string) => {
      try {
        const data = await urlToBase64(url)
        const id = uuidv4()
        const name = url.split('/').pop() || 'reference'
        form.setRefImages((prev: UploadedImage[]) => [...prev, { id, data, name }])
      } catch {
        // silently fail
      }
    },
    [form]
  )

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary>
      <Header />
      <div className="flex-1 flex flex-col items-center px-6 py-6 min-h-0">
        <div className="flex-1 flex flex-col gap-4 min-h-0 w-full max-w-6xl">
          <div className="flex-1 flex gap-5 min-h-0">
            <div className="w-72 flex-shrink-0">
              <OperationPanel onGenerate={handleGenerate} isGenerating={gen.isGenerating} />
            </div>
            <div className="flex-1 min-h-0">
              <ImageDisplayArea
                images={gen.images}
                isGenerating={gen.isGenerating}
                error={gen.error}
                cost={gen.cost}
                params={lastParams}
                prompt={form.prompt}
                onReusePrompt={handleReusePrompt}
                onUseAsRef={handleUseAsRef}
              />
            </div>
          </div>
          <div className="flex-shrink-0">
            <TaskFlow />
          </div>
          <div className="flex-shrink-0">
            <HistoryBar
              onSelect={handleHistorySelect}
              onRemove={handleHistoryRemove}
            />
          </div>
        </div>
        </div>
      </ErrorBoundary>
    </div>
  )
}
