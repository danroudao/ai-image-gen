# 更新日志

## v1.1.0 (2026-07-31) — 性能优化 + UI/UX 升级 + 关键 Bug 修复

### 新增
- **🔄 并行提交（多批次生成）**：生成过程中可再次点击提交，新批次与旧批次并行运行、结果累积展示（不再中断旧批次导致图片丢失/费用浪费）
- **📊 生成进度条**：生成中实时显示百分比进度条（含已完成图片数），空状态大图标 + 光晕动画
- **⌨️ Ctrl+Enter 快捷生成**：描述词框内按 `Ctrl/Cmd + Enter` 直接提交，附字数统计（0/2000）
- **🔑 管理员重置密码**：用户详情页新增"重置密码"卡片，用户忘记密码时管理员可一键重置
- **🔒 密码可见性切换**：登录页密码输入框支持显示/隐藏切换
- **💬 生成状态提示条**：生成进行中显示"可继续提交新批次"提示，明确并行提交能力

### 性能
- **⚡ 任务轮询幂等**：已完成任务直接返回缓存图片，不再重复下载/重复计费（修复刷新或多标签页导致的重复图片与配额重复累计）
- **⚡ 真实缩略图**：缩略图接口懒生成 256px WebP 并磁盘缓存（`private/thumbs/`），历史栏/图片库不再加载 4K 原图
- **⚡ 消除 N+1 查询**：管理员用户列表由每用户 2 次查询优化为 3 次聚合查询
- **⚡ 非阻塞文件读取**：图片服务从 `readFileSync` 改为异步读取，不再阻塞事件循环
- **⚡ 并行图片下载**：任务完成时多张图片并发下载，磁盘清理批量并行

### UI/UX
- **🖼️ 历史栏骨架屏**：加载中用占位卡片动画替代"加载中..."文字
- **⏱️ 任务时长格式化**：运行时长显示为 `1分30秒` 格式，运行中时钟脉冲动画
- **💾 设置页保存反馈**：保存按钮 loading 态，成功/失败消息颜色区分
- **✨ 全局细节**：品牌图标渐变、文本选中高亮色、登录检查页 spinner 动画

### 修复
- **🔧 修复图片区无限增长（严重）**：`useEffect` 依赖数组误加 zustand store 对象导致无限循环 → 并发轮询同一任务 → 服务端竞态重复下载同一张图。已修复 effect 依赖、增加防重入锁、服务端原子抢占（`processing` 状态）防并发重复下载、前端 `appendImages` 去重 + 上限 100
- **🔧 修复生成中动画不消失**：`isGenerating` 状态完成时未重置，新增 `setGenerating()` 并在所有结束路径正确复位
- **🔧 修复历史"清空"不同步服务器**：新增 `DELETE /api/history` 批量删除接口，前端清空时同步调用
- **🔧 修复旧轮询覆盖新任务状态**：中止的轮询不再写入过期状态，多批次费用正确累加
- **🧹 清理重复数据**：删除 7 张重复图片（md5 相同），恢复任务计数一致性

## v1.0.0 (2026-07-21) — 双模型切换 + 安全审计 + UI/UX 全面优化

### 新增
- **🔄 双模型切换**：支持 `gpt-image-2`（APIB 渠道）和 `gpt-image-2-official`（OpenAI 官方），操作面板一键切换
- **⚙️ Official 高级参数**：选择 Official 模型时显示质量（auto/low/medium/high）、审核强度（默认/宽松）、输出格式（PNG/JPEG/WebP）、压缩率滑块（0-100）
- **💾 任务状态持久化**：刷新页面后保留进行中的任务区块，自动恢复轮询
- **🖼️ 管理后台图片灯箱**：`/admin/images` 点击缩略图打开灯箱，显示提示词、模型标签、用户、费用、时间，支持键盘导航
- **🏷️ 模型标签**：图片区、任务卡片、管理后台图片库均显示模型 badge（APIB / Official）
- **✅ 确认弹窗组件**：自定义 ConfirmDialog 替代浏览器 `confirm()`，覆盖历史清空、用户删除、图片删除
- **♿ 无障碍改进**：Toast 加入 `role="alert"` 和 `aria-live`，关闭按钮扩大触摸区域

### 安全
- **🔒 IDOR 越权修复**：`/api/images/[id]` 和 `/api/images/[id]/thumbnail` 加入 `userId` 所有权检查
- **🔒 任务越权修复**：`/api/tasks/[taskId]` 加入归属验证
- **🔒 Seed 端点保护**：仅空数据库时可调用，已存在用户时返回 403
- **🔒 Zod 输入校验**：6 个 POST/PUT 端点接入 Zod schema（`/api/history`、`/api/admin/settings`、`/api/admin/users`、`/api/admin/users/[id]`、`/api/user/settings`）
- **🔒 API 响应验证**：`api.ts` 封装 `handleResponse`，非 2xx 状态抛 `ApiError`
- **🔒 Cookie Secure**：改为动态判断（`NEXTAUTH_URL` 为 HTTPS 时自动启用）

### 错误处理
- **⚠️ 生成失败详情**：ImageDisplayArea 显示失败任务列表（prompt + 错误原因），TaskFlow 卡片显示 errorMessage
- **⚠️ 错误隔离**：上一轮失败任务在新生成时自动清除（`clearCompletedTasks`）
- **⚠️ API 错误传递**：从 API 响应中提取错误消息展示给用户
- **⚠️ AbortController**：页面卸载时自动取消轮询

### UI/UX
- **📱 触摸目标优化**：Header 图标按钮、登录按钮统一 `size-10`/`min-h-[44px]`
- **🎨 主题切换**：三态图标（Moon / Sun / Monitor），tooltip 随状态变化
- **🔄 数据库迁移**：`Image` + `GenerationTask` 增加 `model` 字段
- **📄 DEPLOY.md**：运维手册从 README 独立
- **🗑️ 管理后台**：图片卡片删除按钮从 `size-7` 提升至 `size-10`

### 修复
- 修复 `official_fallback` 残留字段导致的编译错误
- 修复 `trustHost` 移除后登录 500 的问题
- 修复生成失败错误信息与下一批图片混合显示的问题
- 修复 `z.record()` Zod v4 API 不兼容问题
- 修复空状态文案"在左侧"在移动端误导的问题

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
