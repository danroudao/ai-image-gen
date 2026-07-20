# 更新日志

## v0.9.0 (2026-07-20) — 管理后台全面升级 + 图表 + 图片库 + 消耗修复

### 新增
- **📊 仪表盘图表**：引入 recharts，新增每日生成趋势折线图、每日消耗面积图、每日图片柱状图、用户增长趋势图、任务状态环形图
- **🖼️ 全站图片库** `/admin/images`：缩略图网格、按用户筛选、分页、管理员可删除任意图片
- **📋 全站历史记录** `/admin/history`：所有用户历史列表、分页、删除
- **💰 消耗金额修复**：任务总消耗均摊到每张 Image 记录（`costPerImage`），admin/stats 从 `GenerationTask` 聚合消耗

### API 新增
- `GET /api/admin/history?page=&userId=` — 管理员查看全站历史
- `GET /api/admin/images?page=&userId=` — 管理员查看全站图片（分页+筛选）
- `DELETE /api/admin/images?id=` — 管理员删除任意图片
- `/api/admin/stats` 新增 `dailyTasks`、`dailyImages`、`dailyCost`、`dailyUsers` 每日趋势数据

### 修复
- `Image.cost` 现在正确写入（之前始终为 0）
- 管理后台消耗数据现在读取 `GenerationTask._sum.cost`（之前读 `Image._sum.cost`）

## v0.8.0 (2026-07-20) — 图片迁移 + 存储管理 + WebP 转码

### 新增
- **旧图片迁移脚本** `scripts/migrate-images.ts`：将 22 张旧 PNG 从 `public/generated/` 迁移到 `private/uploads/` 并创建 DB 记录
- **WebP 自动转码**：下载图片时通过 `sharp` 转为 WebP（质量 85），体积减少 60-80%
- **存储容量管理**：全局存储上限（默认 500MB），超限自动删除最旧图片
- **孤立记录清理**：自动删除文件已不存在的 DB 记录
- **存储配置**：系统设置新增"存储上限"滑块（50MB–5GB）

### 架构
- `SystemConfig` 新增 `maxStorageMB` 字段 + Prisma 迁移
- `cleanupOldImages()` 重写：按字节计算容量，同步清理 DB 记录
- `downloadImage()` 接入 sharp.webp() 转换

### 清理
- `public/generated/` 中已迁移的 PNG 已删除

## v0.7.0 (2026-07-20) — Bug 修复 + 仪表盘增强

### Bug 修复
- **无限 API 请求**：修复 `page.tsx` useEffect 依赖 `[history]` 导致的无限轮询 `/api/history`
- **缺失返回导航**：管理员后台 `/admin`、`/admin/settings`、`/admin/users`、用户设置 `/settings` 增加返回按钮

### 仪表盘增强
- **任务状态分布**：已完成/运行中/排队中/失败 四色标签
- **今日概况**：今日任务数、今日图片数
- **消耗概览**：总消耗、本月消耗
- **配额告警**：用量超过 80% 的用户列表（含百分比）
- **最近任务**：最近 5 条任务记录
- **额外统计**：管理员数、本月活跃用户数、历史记录数

### 架构
- `/api/admin/stats` 大幅扩展，返回 20+ 维度数据

## v0.6.0 (2026-07-20) — 用户设置 + 系统配置 + 配额管理

### 新增
- **用户设置页** `/settings`：修改昵称、修改密码、查看用量统计
- **系统设置页** `/admin/settings`：配置新用户默认额度（并行数 + 月配额）
- **SystemConfig 模型** + Prisma 迁移，存储全局配置
- **月配额自动重置**：跨月首次请求时清零 `usedThisMonth`

### 架构
- 新增 `/api/user/settings` 用户设置 API（GET 查看 / PUT 更新）
- 新增 `/api/admin/settings` 系统配置 API（管理员）
- `POST /api/admin/users` 创建用户时按系统默认值设置配额
- Header 增加设置按钮（齿轮图标）

## v0.5.0 (2026-07-20) — 用户系统 + 后台管理

### 新增
- **用户认证**：登录页面 `/login`，未登录时自动拦截跳转
- **登录态组件**：Header 显示邮箱/退出/管理入口
- **管理员后台**：`/admin` 仪表盘（总用户/总图片/本月数据）
- **用户管理**：`/admin/users` 列表 + 创建用户 + `/admin/users/[id]` 详情/额度配置
- **额度/并发控制**：每用户并行任务上限 + 月配额，超限返回 429
- **权限体系**：普通用户 / 管理员角色，API 路由按角色鉴权

### 架构
- 新增 `SessionProvider` / `RequireAuth` / `AuthStatus` 组件
- 新增 `/api/admin/*` 全套管理 API
- 新增 `/admin/*` 管理页面（含管理员鉴权 layout）
- 所有 API 路由接入 auth 中间件

## v0.4.0 (2026-07-20) — 数据库基础设施

### 新增
- **Prisma + SQLite 数据库**：User、Image、GenerationTask、HistoryEntry、Quota 五表
- **NextAuth.js v5 认证框架**：Credentials 邮箱密码登录，JWT Session，预留后续升级
- **私有图片存储**：图片从 `public/generated/` 迁移到 `private/uploads/`，通过 `/api/images/[id]` 鉴权后访问
- **图片 API 服务**：`GET /api/images`（列表）、`GET /api/images/[id]`（文件）、`GET /api/images/[id]/thumbnail`（缩略图）
- **历史记录 API**：`GET/POST /api/history`、`DELETE /api/history/[id]`，替代 localStorage
- **种子脚本**：`POST /api/auth/seed` 初始化管理员账号（admin@ai-image.local / admin123456）
- **auth-utils**：标准化 API 错误响应工具函数

### 优化
- 生成/任务路由接入数据库记录（`GenerationTask` + `Image`）
- 历史记录加载从 localStorage 迁移到 DB API
- `HistoryBar` 支持 `imageIds` 和 `localImages` 双模式兼容

### 架构
- 新增 `src/lib/prisma.ts` — Prisma Client 单例
- 新增 `src/lib/auth.ts` — NextAuth 配置
- 新增 `src/lib/api-utils.ts` — API 工具函数
- 新增 `src/types/next-auth.d.ts` — 类型扩展
- 新增 `prisma/` 目录 — Schema + 迁移文件

### 安全
- 图片不再对外公开（`private/uploads/` 不通过静态服务暴露）
- 数据库文件 `prisma/dev.db` 加入 `.gitignore`

## v0.3.0 (2026-07-19)

### 新增
- 图片单个删除（桌面 hover 显示，移动端常驻显示）
- Toast 操作反馈（生成成功/失败/删除/复用提示词/添加参考图）
- 历史记录选中高亮（蓝色 ring 指示当前浏览的条目）
- 移动端响应式布局（flex-col 堆叠 + 全页滚动）
- 灯箱快捷操作移动端适配（缩紧字号间距但不换行）

### 优化
- 主题设置持久化至 localStorage（zustand persist 中间件）
- 全端统一视觉：所有 Card/Header 使用半透明毛玻璃背景，全局径向渐变透出
- 删除按钮桌面 hover 显示、移动端常驻可见
- Header 移动端紧凑样式
- 操作面板标题标签统一大写字母间距样式

### 修复
- 移动端页面超出视口不可滚动（添加 overflow-y-auto 容器）
- 浏览历史后空状态无法重置（setViewingHistory + setSelectedHistoryId）
- 灯箱按钮在窄屏换行溢出
- 清理 @base-ui/react 残留依赖
- 任务路由 crypto.randomUUID 改为 uuid v4 保持全项目一致

### 技术债务
- 引入 zod 对 /api/generate 做入参校验（model/prompt/n/size/resolution）
- shadcn 从 dependencies 移至 devDependencies
- 替换两处 eslint-disable 坏味道（解构省略 → 显式 pick；useEffect mounted → useSyncExternalStore）

### 安全
- 生成的 PNG 图片移出版本控制，加入 .gitignore
- 保留 public/generated/.gitkeep 确保目录存在

## v0.2.0 (2026-07-19)

### 新增
- 并行多任务生成：生图数量 > 1 时拆为独立并行任务，完成一个展示一个
- 图片快捷菜单：图片 hover 时显示"复用提示词 / 作为参考图 / 下载"
- 灯箱快捷操作：预览图片时可直接复用提示词、作为参考图、下载
- 背景渐变色：亮色/暗色双主题动态渐变背景
- 自定义滚动条样式
- 生成进度条渐变效果

### 优化
- 暗色模式修复：原生 `<select>` 替换为自定义下拉组件，暗色下选项文字正常可见
- 分辨率按钮暗色对比度优化
- 图片尺寸调整为 `object-contain max-h-[55vh]`，自适应比例
- 状态管理重构：prompt/refImages 提升至 zustand store，组件间数据互通
- 生成过程进度条增加 `animate-pulse` 动效
- 历史缩略图 hover 增加发光边框

### 修复
- `crypto.randomUUID is not a function` 错误，替换为 `uuid.v4()`
- 历史记录中 `image_urls`（base64）导致 localStorage 超限静默失败
- 历史记录刷新后丢失（因上述 localStorage 写入失败）
- 主题切换需要点两次才到亮色（调整循环顺序为 system → light → dark）

## v0.1.0 (2026-07-18)

### 初始版本
- 文生图与图生图
- 15 种图片比例 + 自动模式
- 1K/2K/4K 分辨率
- 最多 10 张批量生成
- 参考图最多 16 张
- 本地历史记录（最近 10 条）
- 服务端图片缓存（最多 50 张）
- 亮色/暗色/跟随系统主题
