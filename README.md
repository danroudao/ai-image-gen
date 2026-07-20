# AI 绘图 - 在线 AI 图像生成工具

基于 [APIB.ai](https://apib.ai) GPT-Image-2 模型的 Web 端 AI 图像生成工具，支持文生图与图生图，并行多任务生成。

## 功能

- **文生图** - 输入文字描述，AI 生成图片
- **图生图** - 上传参考图，基于参考图生成新图片（最多 16 张）
- **多种比例** - 支持 15 种图片比例 + 自动模式
- **分辨率选择** - 1K / 2K / 4K 三档可选
- **并行生成** - 单次最多并行 10 个独立任务，完成一个展示一个
- **图片预览** - 点击图片全屏灯箱预览，支持复用提示词 / 作为参考图 / 下载
- **图片删除** - 图片网格支持单张删除（桌面 hover 显示，移动端常驻显示）
- **操作反馈** - 右下角 Toast 通知（生成成功/失败/删除/复制等）
- **历史记录** - 数据库存储最近 10 条记录，选中高亮，支持单条删除
- **图片缓存** - 服务端自动缓存生成图片（最多 50 张，超限自动清理）
- **暗色模式** - 支持亮色 / 暗色 / 跟随系统，持久化选择
- **移动端适配** - 自动响应式布局

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS v4 + shadcn/ui
- **状态管理**: Zustand（含 persist 中间件）
- **数据库**: Prisma + SQLite（可迁移至 PostgreSQL）
- **认证**: NextAuth.js v5
- **图片存储**: 本地文件系统 (private/uploads) + 数据库元数据
- **API 校验**: Zod

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
# 复制 .env.local.example 为 .env.local，填入配置
# APIB_API_KEY=你的密钥（获取地址：https://apib.ai）
# DATABASE_URL="file:./dev.db"
# AUTH_SECRET=生成一个随机字符串

# 初始化数据库
npx prisma migrate dev

# 创建管理员账号
curl -X POST http://localhost:3000/api/auth/seed

# 构建生产版本
npm run build

# 启动服务
npm run start
```

打开 http://localhost:3000 即可使用。

## 项目结构

```
prisma/
└── schema.prisma          # 数据库模型（User / Image / GenerationTask / HistoryEntry / Quota）
src/
├── app/
│   ├── layout.tsx          # 根布局（含 Toast 容器）
│   ├── page.tsx            # 主页面
│   ├── globals.css         # 全局样式（渐变背景、暗色变量）
│   └── api/
│       ├── auth/           # NextAuth.js API
│       ├── generate/route.ts    # POST - 提交生成任务（zod 校验 + DB 记录）
│       ├── tasks/[taskId]/route.ts # GET - 查询任务状态 + 私有图片存储
│       ├── images/         # GET - 图片列表 / 图片文件服务
│       └── history/        # GET/POST/DELETE - 历史记录
├── components/
│   ├── Header.tsx          # 顶栏 + 暗色模式切换
│   ├── OperationPanel.tsx  # 操作面板（比例/分辨率/数量/参考图/提示词）
│   ├── ImageDisplayArea.tsx # 图片展示区（含悬停删除按钮）
│   ├── HistoryBar.tsx      # 历史记录栏（选中高亮、单条删除）
│   ├── ImageUploader.tsx   # 图片上传组件
│   ├── Lightbox.tsx        # 图片灯箱预览（复用提示词/作为参考图/下载）
│   ├── Toast.tsx           # Toast 通知组件
│   ├── ErrorBoundary.tsx   # 错误边界
│   └── ThemeProvider.tsx   # 主题切换
├── stores/
│   ├── generation-store.ts # 生成状态（含并行任务）
│   ├── form-store.ts       # 表单状态（提示词/参考图）
│   ├── history-store.ts    # 历史记录（DB 持久化）
│   ├── toast-store.ts      # Toast 通知状态
│   └── settings-store.ts   # 主题设置（持久化）
├── lib/
│   ├── prisma.ts           # Prisma Client 单例
│   ├── auth.ts             # NextAuth 配置
│   ├── api-utils.ts        # API 工具函数
│   ├── types.ts            # 类型定义
│   └── api.ts              # API 客户端封装
└── types/
    └── next-auth.d.ts      # NextAuth 类型扩展
```

## 部署与运维

### 使用 systemd 服务（推荐）

创建系统服务，实现开机自启、崩溃自动重启。

```ini
# /etc/systemd/system/ai-image-gen.service
[Unit]
Description=AI Image Generator (Next.js)
After=network.target

[Service]
Type=simple
User=你的用户名
WorkingDirectory=/path/to/ai-image-gen
ExecStart=/usr/bin/npm run start -- -H 0.0.0.0
Restart=always
RestartSec=5
Environment=APIB_API_KEY=你的密钥
Environment=DATABASE_URL="file:./dev.db"
Environment=AUTH_SECRET=生成的密钥
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start ai-image-gen

# 设置开机自启
sudo systemctl enable ai-image-gen

# 查看运行状态
systemctl status ai-image-gen

# 实时查看日志
journalctl -u ai-image-gen -f

# 停止服务
sudo systemctl stop ai-image-gen

# 重启服务
sudo systemctl restart ai-image-gen
```

### 更新部署

```bash
git pull
npm install
npx prisma migrate dev    # 数据库迁移
npm run build
sudo systemctl restart ai-image-gen
```

## API 对接

本项目通过 Next.js API Routes 代理 APIB.ai 接口，API Key 仅在服务端使用。

### 提交生成任务

```
POST /api/generate

Body:
{
  "model": "gpt-image-2",
  "prompt": "描述文字",
  "n": 1,
  "size": "16:9",
  "resolution": "2k",
  "image_urls": ["data:image/png;base64,..."]
}
```

### 查询任务

```
GET /api/tasks/{taskId}
```

### 图片服务

```
GET /api/images                    # 图片列表
GET /api/images/{id}               # 图片文件（支持浏览器直接访问）
GET /api/images/{id}/thumbnail     # 缩略图
```

### 历史记录

```
GET  /api/history                  # 获取历史列表
POST /api/history                  # 添加历史记录
DELETE /api/history/{id}           # 删除单条记录
```

## 安全注意事项

- **API Key** 存储在 `.env.local`，该文件已在 `.gitignore` 中排除，不会进入版本控制
- 生成图片存储在 `private/uploads/`，不对外直接暴露，通过 `/api/images/{id}` 鉴权后访问
- 数据库文件 `prisma/dev.db` 已在 `.gitignore` 中排除
- 生产环境部署前建议添加用户认证与速率限制（Stage 2 实现）
- 建议定期轮换 API Key（在 [apib.ai](https://apib.ai) 后台重新生成）

## License

MIT
