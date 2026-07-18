'use client'

import { useCallback, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Header } from '@/components/Header'
import { OperationPanel } from '@/components/OperationPanel'
import { ImageDisplayArea } from '@/components/ImageDisplayArea'
import { HistoryBar } from '@/components/HistoryBar'
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
          gen.setError(`任务 ${taskId.slice(0, 8)}... 失败: ${task.error?.message || '未知错误'}`)
          return null
        }
        await sleep(2000)
      }
      return null
    },
    [gen]
  )

  const startPolling = useCallback(
    async (taskIds: string[], params: GenerationParams) => {
      gen.setImages([])
      gen.setTotalTasks(taskIds.length)
      let totalCost = 0

      const results = await Promise.allSettled(
        taskIds.map((id) => pollSingle(id))
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          gen.appendImages(result.value.localImages)
          totalCost += result.value.cost
          gen.incrementCompleted()
        } else {
          gen.incrementCompleted()
        }
      }

      gen.setCost(totalCost)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { image_urls, ...cleanParams } = params
      history.addEntry({
        id: uuidv4(),
        task_id: taskIds[0],
        params: cleanParams,
        localImages: gen.images,
        cost: totalCost,
        created_at: Date.now(),
      })
    },
    [gen, history, pollSingle]
  )

  const handleGenerate = useCallback(
    async (params: GenerationParams) => {
      gen.startGeneration()
      setLastParams({ size: params.size, resolution: params.resolution })

      try {
        const count = params.n
        const tasks = Array.from({ length: count }, () => ({
          ...params,
          n: 1,
        }))

        const submissions = await Promise.allSettled(
          tasks.map((task) => submitGeneration(task))
        )

        const taskIds: string[] = []
        for (const sub of submissions) {
          if (sub.status === 'fulfilled' && !sub.value.error && sub.value.data?.[0]?.task_id) {
            taskIds.push(sub.value.data[0].task_id)
          }
        }

        if (taskIds.length === 0) {
          const first = submissions.find((s) => s.status === 'fulfilled')
          gen.setError(first?.status === 'fulfilled' ? (first.value.error?.message || '提交失败') : '网络错误')
          return
        }

        gen.setStatus('submitted')
        startPolling(taskIds, params)
      } catch (err) {
        gen.setError(err instanceof Error ? err.message : '网络错误')
      }
    },
    [gen, startPolling]
  )

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      gen.reset()
      gen.setImages(entry.localImages)
      gen.setCost(entry.cost)
      setLastParams({ size: entry.params.size, resolution: entry.params.resolution })
      if (entry.params.prompt) {
        form.setPrompt(entry.params.prompt)
      }
    },
    [gen, form]
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
      <div className="flex-1 flex flex-col p-4 gap-4 min-h-0">
        <div className="flex-1 flex gap-4 min-h-0">
          <div className="w-80 flex-shrink-0">
            <OperationPanel onGenerate={handleGenerate} isGenerating={gen.isGenerating} />
          </div>
          <div className="flex-1">
            <ImageDisplayArea
              images={gen.images}
              isGenerating={gen.isGenerating}
              progress={gen.progress}
              error={gen.error}
              cost={gen.cost}
              params={lastParams}
              prompt={form.prompt}
              totalTasks={gen.totalTasks}
              completedTasks={gen.completedTasks}
              onReusePrompt={handleReusePrompt}
              onUseAsRef={handleUseAsRef}
            />
          </div>
        </div>
        <div className="flex-shrink-0">
          <HistoryBar onSelect={handleHistorySelect} />
        </div>
        </div>
      </ErrorBoundary>
    </div>
  )
}
