# AI 绘图 - 在线 AI 图像生成工具

基于 [APIB.ai](https://apib.ai) GPT-Image-2 模型的 Web 端 AI 图像生成工具，支持文生图与图生图、并行多任务生成、用户认证、额度管理和管理员后台。

## 功能

- **文生图 / 图生图** — 文字描述或参考图（最多 16 张）生成图片
- **双模型支持** — 一键切换 `GPT-Image-2`（APIB）/ `Official`（OpenAI 官方）
- **Official 高级参数** — 质量、审核强度、输出格式、压缩率可调
- **多种比例与分辨率** — 15 种比例 + 自动模式，1K/2K/4K 三档
- **并行生成** — 单次最多 10 个独立任务（Official 最多 4 个），完成一个展示一个
- **多批次并行提交** — 生成中可再次提交，新旧批次并行运行、结果累积，不中断旧任务
- **生成进度条** — 实时显示生成百分比与已完成图片数
- **快捷生成** — 描述词框内按 `Ctrl+Enter` 直接提交，实时字数统计
- **任务持久化** — 刷新页面后任务状态不丢失，自动恢复轮询（幂等，不重复下载）
- **图片预览与操作** — 灯箱预览，支持复用提示词 / 作为参考图 / 下载
- **图片删除** — 桌面 hover 显示删除按钮，移动端常驻可见
- **历史记录** — 数据库存储最近 10 条，选中高亮，单条删除 + 清空确认（同步服务器）
- **图片缓存** — 服务端自动缓存（WebP 转码，超限自动清理），缩略图 256px WebP 磁盘缓存
- **用户认证** — 邮箱+密码登录（支持显示/隐藏），JWT Session
- **额度管理** — 每用户并行任务数上限 + 月配额，超限 429
- **用户设置** — 修改昵称、修改密码、查看用量统计
- **管理员后台** — 仪表盘（含图表）、用户管理（可重置密码）、图片库、系统配置
- **操作反馈** — Toast 通知（生成/删除/复用提示词等）
- **暗色模式** — 亮色 / 暗色 / 跟随系统，持久化
- **移动端适配** — 自动响应式布局

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS v4 + shadcn/ui
- **状态管理**: Zustand（含 persist 中间件）
- **数据库**: Prisma + SQLite（可迁移至 PostgreSQL）
- **认证**: NextAuth.js v5（Credentials + JWT）
- **校验**: Zod
- **图表**: Recharts
- **图片处理**: Sharp（PNG → WebP 转码）
- **图片存储**: 私有文件系统 (`private/uploads/`) + 数据库元数据

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env .env.local
# 填写：
# - APIB_API_KEY（获取：https://apib.ai）
# - AUTH_SECRET（生成：openssl rand -hex 32）
# - 如有反代，设置 NEXTAUTH_URL=https://你的域名.com:你的端口

# 初始化数据库
npx prisma migrate dev

# 创建管理员账号
curl -X POST http://localhost:3000/api/auth/seed

# 启动开发服务
npm run dev
```

打开 http://localhost:3000 使用。管理员：`admin@ai-image.local` / `admin123456`

## 项目结构

```
prisma/
└── schema.prisma          # 6 个模型 (User/Image/GenerationTask/HistoryEntry/Quota/SystemConfig)
src/
├── app/
│   ├── layout.tsx         # 根布局 (ThemeProvider + SessionProvider + Toast)
│   ├── page.tsx           # 主页面 (RequireAuth 包裹)
│   ├── login/             # 登录页
│   ├── settings/          # 用户设置页 (昵称/密码/用量)
│   ├── admin/             # 管理后台 (仪表盘/用户管理/图片库/历史/系统设置)
│   └── api/
│       ├── auth/          # NextAuth + 种子脚本
│       ├── generate/      # POST 提交生成任务 (zod + 额度检查 + DB 记录)
│       ├── tasks/[id]/    # GET 轮询任务 + 私有存储
│       ├── images/        # 图片列表/文件/缩略图 (鉴权)
│       ├── history/       # 历史记录 CRUD
│       ├── admin/         # 管理员 API (users/images/history/settings/stats)
│       └── user/          # 用户设置 API
├── components/
│   ├── ConfirmDialog.tsx  # 确认弹窗（替代 confirm()）
│   ├── Header.tsx         # 顶栏 + 主题切换 + 登录态
│   ├── AuthStatus.tsx     # 登录态组件 (邮箱/退出/设置/管理入口)
│   ├── RequireAuth.tsx    # 登录拦截守卫
│   ├── OperationPanel.tsx # 操作面板（快捷生成/字数统计）
│   ├── ImageDisplayArea.tsx # 图片展示区（进度条）
│   ├── HistoryBar.tsx     # 历史记录栏（骨架屏）
│   ├── ImageUploader.tsx  # 图片上传
│   ├── Lightbox.tsx       # 灯箱预览
│   ├── SafeImage.tsx      # 懒加载图片组件（认证图片路由专用）
│   ├── Toast.tsx          # Toast 通知
│   ├── ErrorBoundary.tsx  # 错误边界
│   └── ThemeProvider.tsx  # 主题切换
├── stores/                # Zustand stores
│   ├── generation-store.ts
│   ├── form-store.ts
│   ├── history-store.ts
│   ├── toast-store.ts
│   └── settings-store.ts
└── lib/
    ├── prisma.ts          # Prisma 单例
    ├── auth.ts            # NextAuth 配置
    ├── api-utils.ts       # requireAuth/requireAdmin/apiError
    ├── types.ts
    └── api.ts             # 客户端 API 封装
scripts/
└── migrate-images.ts      # 旧图片迁移脚本（public/generated → private/uploads）
deploy/
├── DEPLOY.md              # 运维手册
├── ecosystem.config.cjs   # PM2 配置
└── nginx/                 # Nginx 模块化配置
    ├── ai-image-gen.conf
    └── conf.d/
```

## 管理员后台

| 路径 | 功能 |
|------|------|
| `/admin` | 仪表盘：图表/总览/任务状态/消耗/配额告警/最近任务 |
| `/admin/users` | 用户列表 + 创建用户 |
| `/admin/users/[id]` | 用户详情 + 额度配置（滑块） |
| `/admin/images` | 全站图片库（缩略图网格/用户筛选/删除） |
| `/admin/history` | 全站历史记录（分页/删除） |
| `/admin/settings` | 系统设置（默认额度/存储上限） |

## API

所有 API 路由均需认证（`/api/auth/seed` 除外）。

### 用户认证

```
POST /api/auth/seed              # 初始化管理员账号
```

### 生成

```
POST /api/generate               # 提交生成任务（额度检查 + DB 记录）
  Body: { model ('gpt-image-2'|'gpt-image-2-official'), prompt, n, size?, resolution?,
          image_urls?, quality?, moderation?, output_format?, output_compression? }

GET  /api/tasks/{taskId}         # 查询任务状态（结果自动下载到私有存储）
```

### 图片

```
GET  /api/images                 # 当前用户图片列表
GET  /api/images/{id}            # 图片文件
GET  /api/images/{id}/thumbnail  # 缩略图
```

### 历史记录

```
GET    /api/history               # 最近 10 条
POST   /api/history               # 添加记录
DELETE /api/history               # 清空当前用户全部记录
DELETE /api/history/{id}          # 删除单条
```

### 管理员

```
GET    /api/admin/stats          # 仪表盘统计（含每日趋势数据）
GET    /api/admin/users          # 用户列表
POST   /api/admin/users          # 创建用户
GET    /api/admin/users/{id}     # 用户详情
PUT    /api/admin/users/{id}     # 更新用户/配额
DELETE /api/admin/users/{id}     # 删除用户
GET    /api/admin/images         # 全站图片（分页/按用户筛选）
DELETE /api/admin/images?id=     # 删除任意图片
GET    /api/admin/history        # 全站历史（分页/按用户筛选）
GET    /api/admin/settings       # 系统设置
PUT    /api/admin/settings       # 更新系统设置
```

### 用户设置

```
GET  /api/user/settings          # 查看个人信息/用量
PUT  /api/user/settings          # 更新昵称/修改密码
```

## License

MIT
