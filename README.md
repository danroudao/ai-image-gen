# AI 绘图 - 在线 AI 图像生成工具

基于 [APIB.ai](https://apib.ai) GPT-Image-2 模型的 Web 端 AI 图像生成工具，支持文生图与图生图、并行多任务生成、用户认证、额度管理和管理员后台。

## 功能

- **文生图 / 图生图** — 文字描述或参考图（最多 16 张）生成图片
- **多种比例与分辨率** — 15 种比例 + 自动模式，1K/2K/4K 三档
- **并行生成** — 单次最多 10 个独立任务，完成一个展示一个
- **图片预览与操作** — 灯箱预览，支持复用提示词 / 作为参考图 / 下载
- **图片删除** — 桌面 hover 显示删除按钮，移动端常驻可见
- **历史记录** — 数据库存储最近 10 条，选中高亮，单条删除
- **图片缓存** — 服务端自动缓存（最多 50 张，超限自动清理）
- **用户认证** — 邮箱+密码登录，JWT Session
- **额度管理** — 每用户并行任务数上限 + 月配额，超限 429
- **用户设置** — 修改昵称、修改密码、查看用量统计
- **管理员后台** — 仪表盘、用户管理、系统配置
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
# - 如有反代，设置 NEXTAUTH_URL=https://你的域名.com

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
│   ├── admin/             # 管理后台 (仪表盘/用户管理/系统设置)
│   └── api/
│       ├── auth/          # NextAuth + 种子脚本
│       ├── generate/      # POST 提交生成任务 (zod + 额度检查 + DB 记录)
│       ├── tasks/[id]/    # GET 轮询任务 + 私有存储
│       ├── images/        # 图片列表/文件/缩略图 (鉴权)
│       ├── history/       # 历史记录 CRUD
│       ├── admin/         # 管理员 API (users/settings/stats)
│       └── user/          # 用户设置 API
├── components/
│   ├── Header.tsx         # 顶栏 + 主题切换 + 登录态
│   ├── AuthStatus.tsx     # 登录态组件 (邮箱/退出/设置/管理入口)
│   ├── RequireAuth.tsx    # 登录拦截守卫
│   ├── SessionProvider.tsx
│   ├── OperationPanel.tsx # 操作面板
│   ├── ImageDisplayArea.tsx # 图片展示区
│   ├── HistoryBar.tsx     # 历史记录栏
│   ├── ImageUploader.tsx  # 图片上传
│   ├── Lightbox.tsx       # 灯箱预览
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
```

## 管理员后台

| 路径 | 功能 |
|------|------|
| `/admin` | 仪表盘：总览/任务状态/消耗/配额告警/最近任务 |
| `/admin/users` | 用户列表 + 创建用户 |
| `/admin/users/[id]` | 用户详情 + 额度配置（滑块） |
| `/admin/settings` | 系统设置（新用户默认额度） |

## API

所有 API 路由均需认证（`/api/auth/seed` 除外）。

### 用户认证

```
POST /api/auth/seed              # 初始化管理员账号
```

### 生成

```
POST /api/generate               # 提交生成任务（额度检查 + DB 记录）
  Body: { model, prompt, n, size?, resolution?, image_urls? }

GET  /api/tasks/{taskId}         # 查询任务状态（结果自动下载到私有存储）
```

### 图片

```
GET  /api/images                 # 当前用户图片列表
GET  /api/images/{id}            # 图片文件（支持浏览器直接访问）
GET  /api/images/{id}/thumbnail  # 缩略图
```

### 历史记录

```
GET  /api/history                # 最近 10 条
POST /api/history                # 添加记录
DELETE /api/history/{id}         # 删除
```

### 管理员

```
GET    /api/admin/stats          # 仪表盘统计（20+ 维度）
GET    /api/admin/users          # 用户列表
POST   /api/admin/users          # 创建用户
GET    /api/admin/users/{id}     # 用户详情
PUT    /api/admin/users/{id}     # 更新用户/配额
DELETE /api/admin/users/{id}     # 删除用户
GET    /api/admin/settings       # 系统设置
PUT    /api/admin/settings       # 更新系统设置
```

### 用户设置

```
GET  /api/user/settings          # 查看个人信息/用量
PUT  /api/user/settings          # 更新昵称/修改密码
```

## 部署

### 构建生产版本

```bash
npm run build
npm run start
```

默认监听 `http://localhost:3000`，生产环境建议使用反向代理（如 Nginx）。

### systemd 服务

```ini
# /etc/systemd/system/ai-image-gen.service
[Unit]
Description=AI Image Generator
After=network.target

[Service]
Type=simple
User=你的用户名
WorkingDirectory=/path/to/ai-image-gen
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ai-image-gen
```

### 更新

```bash
git pull
npm install
npx prisma migrate dev
npm run build
sudo systemctl restart ai-image-gen
```

### 反向代理配置

使用 Nginx 反代时，确保转发以下头部并设置环境变量：

```nginx
server {
    listen 443 ssl;
    server_name 你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

`.env.local` 中必须设置：
```
NEXTAUTH_URL=https://你的域名.com
```

## 安全

- API Key 存储在 `.env.local`（已加入 `.gitignore`）
- 生成图片存储在 `private/uploads/`，通过 `/api/images/{id}` 鉴权访问
- 数据库 `prisma/dev.db` 已加入 `.gitignore`
- 所有 API 路由（除 seed 外）均要求认证
- 管理员操作要求额外 `role === 'admin'` 校验
- 建议定期轮换 API Key
- `AUTH_SECRET` 应使用强随机字符串

## License

MIT
