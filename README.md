# AI 绘图 - 在线 AI 图像生成工具

基于 [APIB.ai](https://apib.ai) GPT-Image-2 模型的 Web 端 AI 图像生成工具，支持文生图与图生图，并行多任务生成。

## 功能

- **文生图** - 输入文字描述，AI 生成图片
- **图生图** - 上传参考图，基于参考图生成新图片（最多 16 张）
- **多种比例** - 支持 15 种图片比例 + 自动模式
- **分辨率选择** - 1K / 2K / 4K 三档可选
- **并行生成** - 单次最多并行 10 个独立任务，完成一个展示一个
- **图片快捷菜单** - 点击图片可复用提示词、作为参考图、下载
- **生成本地存储** - 本地保存最近 10 条历史记录
- **图片缓存** - 服务端自动缓存生成图片（最多 50 张，超限自动清理）
- **暗色模式** - 支持亮色 / 暗色 / 跟随系统

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS v4 + shadcn/ui
- **状态管理**: Zustand
- **图片存储**: 本地文件系统 (public/generated)

## 快速开始

```bash
# 安装依赖
npm install

# 配置 API Key
# 复制 .env.local 文件，填入你的 API Key
# 获取地址：https://apib.ai
# .env.local 内容：
# APIB_API_KEY=你的密钥

# 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可使用。

## 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 主页面
│   ├── globals.css             # 全局样式
│   └── api/
│       ├── generate/route.ts   # POST - 提交生成任务
│       └── tasks/[taskId]/route.ts  # GET - 查询任务状态
├── components/
│   ├── Header.tsx              # 顶栏 + 暗色模式切换
│   ├── OperationPanel.tsx      # 操作面板（比例/分辨率/数量/参考图/提示词）
│   ├── ImageDisplayArea.tsx    # 图片展示区（含图片快捷菜单）
│   ├── HistoryBar.tsx          # 历史记录栏
│   ├── ImageUploader.tsx       # 图片上传组件
│   ├── Lightbox.tsx            # 图片灯箱预览（含快捷操作）
│   ├── ErrorBoundary.tsx       # 错误边界
│   └── ThemeProvider.tsx       # 主题切换
├── stores/
│   ├── generation-store.ts     # 生成状态（含并行任务计数）
│   ├── form-store.ts           # 表单状态（提示词/参考图）
│   ├── history-store.ts        # 历史记录 (localStorage)
│   └── settings-store.ts       # 主题设置
└── lib/
    ├── types.ts                # 类型定义
    └── api.ts                  # API 客户端封装
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

## 构建部署

```bash
npm run build
# 产物在 .next/ 目录
```

## License

MIT
