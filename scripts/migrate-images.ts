import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PUBLIC_DIR = path.join(process.cwd(), 'public', 'generated')
const UPLOAD_DIR = path.join(process.cwd(), 'private', 'uploads')

async function migrate() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  let files: string[]
  try {
    files = await fs.readdir(PUBLIC_DIR)
  } catch {
    console.log('public/generated/ 目录不存在，无需迁移')
    return
  }

  const pngFiles = files.filter(f => f.endsWith('.png') && f !== '.gitkeep')
  if (pngFiles.length === 0) {
    console.log('没有找到旧图片')
    return
  }

  let migrated = 0
  let skipped = 0

  for (const file of pngFiles) {
    const src = path.join(PUBLIC_DIR, file)
    const dest = path.join(UPLOAD_DIR, file)

    try {
      // skip if already exists
      await fs.access(dest)
      skipped++
      continue
    } catch { /* doesn't exist, proceed */ }

    await fs.copyFile(src, dest)

    const image = await prisma.image.findFirst({ where: { filePath: file } })
    if (!image) {
      await prisma.image.create({
        data: {
          userId: '',
          filePath: file,
          prompt: 'migrated',
          createdAt: new Date(),
        },
      })
    }

    migrated++
    console.log(`  migrated: ${file}`)
  }

  console.log(`\n完成: ${migrated} 迁移, ${skipped} 已存在, ${pngFiles.length - migrated - skipped} 失败`)
  await prisma.$disconnect()
}

migrate().catch(console.error)
