'use client'

import { useCallback, useState, useEffect } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Header } from '@/components/Header'
import { RequireAuth } from '@/components/RequireAuth'
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
import { useToastStore } from '@/stores/toast-store'

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

async function pollSingle(taskId: string): Promise<{ localImages: string[]; imageIds: string[]; cost: number } | null> {
  for (let i = 0; i < 120; i++) {
    const res = await queryTask(taskId)
    const task = res.data
    if (!task) return null
    if (task.status === 'completed') {
      if (task.localImages && task.localImages.length > 0) {
        return { localImages: task.localImages, imageIds: (task as { localImageIds?: string[] }).localImageIds ?? [], cost: task.cost ?? 0 }
      }
      if (task.result?.images) {
        return { localImages: task.result.images.flatMap((img) => img.url), imageIds: [], cost: task.cost ?? 0 }
      }
    }
    if (task.status === 'failed') {
      return null
    }
    await sleep(2000)
  }
  return null
}

export default function Home() {
  const gen = useGenerationStore()
  const history = useHistoryStore()
  const form = useFormStore()
  const toast = useToastStore()
  const [lastParams, setLastParams] = useState<{ size: string; resolution: string } | null>(null)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)

  useEffect(() => {
    history.loadHistory()
  }, [history])

  const handleGenerate = useCallback(
    async (params: GenerationParams) => {
      setSelectedHistoryId(null)
      gen.setViewingHistory(false)
      gen.setError(null)
      gen.setImages([])
      gen.startGeneration()
      setLastParams({ size: params.size, resolution: params.resolution })

      const count = params.n
      const taskCards = Array.from({ length: count }, () => {
        const uid = uuidv4()
        gen.addTask({
          id: uid,
          taskId: '',
          prompt: params.prompt.slice(0, 50),
          status: 'queued',
          images: [],
          cost: 0,
          size: params.size,
          resolution: params.resolution,
          createdAt: Date.now(),
        })
        return uid
      })

      const submissions = await Promise.allSettled(
        Array.from({ length: count }, () =>
          submitGeneration({ ...params, n: 1 })
        )
      )

      const apiIds: { uid: string; apiTaskId: string }[] = []
      for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i]
        if (sub.status === 'fulfilled' && !sub.value.error && sub.value.data?.[0]?.task_id) {
          apiIds.push({ uid: taskCards[i], apiTaskId: sub.value.data[0].task_id })
          gen.updateTask(taskCards[i], { taskId: sub.value.data[0].task_id, status: 'running', startedAt: Date.now() })
        } else {
          gen.updateTask(taskCards[i], { status: 'failed' })
        }
      }

      if (apiIds.length === 0) {
        gen.setError('提交失败')
        toast.addToast({ message: '提交失败，请检查 API Key 是否正确', type: 'error' })
        return
      }

      gen.setStatus('submitted')

      const pollResults = await Promise.allSettled(
        apiIds.map(({ apiTaskId }) => pollSingle(apiTaskId))
      )

      const allImages: string[] = []
      const allImageIds: string[] = []
      let totalCost = 0
      let successCount = 0

      for (let i = 0; i < pollResults.length; i++) {
        const result = pollResults[i]
        const uid = apiIds[i].uid
        if (result.status === 'fulfilled' && result.value) {
          allImages.push(...result.value.localImages)
          allImageIds.push(...result.value.imageIds)
          totalCost += result.value.cost
          gen.appendImages(result.value.localImages)
          gen.updateTask(uid, {
            status: 'completed',
            images: result.value.localImages,
            cost: result.value.cost,
          })
          successCount++
        } else {
          gen.updateTask(uid, { status: 'failed' })
        }
      }

      gen.setCost(totalCost)
      gen.setProgress(100)
      gen.setStatus('completed')

      const cleanParams = {
        model: params.model,
        prompt: params.prompt,
        n: count,
        size: params.size,
        resolution: params.resolution,
        official_fallback: params.official_fallback,
      }
      history.addEntry({
        id: uuidv4(),
        task_id: apiIds[0].apiTaskId,
        params: { ...cleanParams, n: count },
        localImages: allImages,
        imageIds: allImageIds,
        cost: totalCost,
        created_at: Date.now(),
      })

      if (successCount > 0) {
        toast.addToast({ message: `生成完成，共 ${allImages.length} 张图片${totalCost > 0 ? `，费用 $${totalCost.toFixed(4)}` : ''}`, type: 'success' })
      } else {
        toast.addToast({ message: '所有任务均生成失败', type: 'error' })
      }
    },
    [gen, history, toast]
  )

  const handleHistorySelect = useCallback(
    (entry: HistoryEntry) => {
      setSelectedHistoryId(entry.id)
      gen.setError(null)
      gen.setStatus(null)
      gen.setViewingHistory(true)
      const imgs = entry.imageIds && entry.imageIds.length > 0
        ? entry.imageIds.map((id) => `/api/images/${id}`)
        : entry.localImages
      gen.setImages(imgs)
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

  const handleDeleteImage = useCallback(
    (index: number) => {
      const newImages = gen.images.filter((_, i) => i !== index)
      gen.setImages(newImages)
      toast.addToast({ message: '已删除图片', type: 'info' })
    },
    [gen, toast]
  )

  const handleUseAsRef = useCallback(
    async (url: string) => {
      try {
        const data = await urlToBase64(url)
        const id = uuidv4()
        const name = url.split('/').pop() || 'reference'
        form.setRefImages((prev: UploadedImage[]) => [...prev, { id, data, name }])
        toast.addToast({ message: '已添加为参考图', type: 'success' })
      } catch {
        toast.addToast({ message: '添加参考图失败', type: 'error' })
      }
    },
    [form, toast]
  )

  const handleReuseWithFeedback = useCallback(
    (prompt: string) => {
      handleReusePrompt(prompt)
      toast.addToast({ message: '已复用提示词', type: 'info' })
    },
    [handleReusePrompt, toast]
  )

  return (
    <div className="h-full flex flex-col">
      <ErrorBoundary>
      <Header />
      <RequireAuth>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-center px-3 md:px-6 py-3 md:py-6">
          <div className="flex flex-col gap-3 md:gap-4 w-full max-w-6xl">
            <div className="flex flex-col md:flex-row gap-3 md:gap-5">
              <div className="w-full md:w-72 flex-shrink-0">
                <OperationPanel onGenerate={handleGenerate} isGenerating={gen.isGenerating} />
              </div>
              <div className="flex-1 min-h-[200px] md:min-h-0">
                <ImageDisplayArea
                  images={gen.images}
                  isGenerating={gen.isGenerating}
                  error={gen.error}
                  cost={gen.cost}
                  params={lastParams}
                  prompt={form.prompt}
                  onReusePrompt={handleReuseWithFeedback}
                  onUseAsRef={handleUseAsRef}
                  onDeleteImage={handleDeleteImage}
                />
              </div>
            </div>
            <div>
              <TaskFlow />
            </div>
            <div>
              <HistoryBar
                onSelect={handleHistorySelect}
                onRemove={handleHistoryRemove}
                selectedId={selectedHistoryId}
              />
            </div>
          </div>
        </div>
        </div>
      </RequireAuth>
      </ErrorBoundary>
    </div>
  )
}
