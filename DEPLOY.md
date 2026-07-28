# 运维手册

## 目录

- [架构概览](#架构概览)
- [环境要求](#环境要求)
- [环境变量](#环境变量)
- [快速部署](#快速部署)
- [Nginx 配置](#nginx-配置)
- [PM2 管理](#pm2-管理)
- [SSL 证书](#ssl-证书)
- [数据库备份](#数据库备份)
- [存储管理](#存储管理)
- [安全加固](#安全加固)
- [更新流程](#更新流程)
- [故障排查](#故障排查)

---

## 架构概览

```
用户 → 域名:__SSL_PORT__
        ↓
  [Nginx] 反向代理 + SSL 终止
        ↓
  [PM2] 管理 Next.js 进程
        ↓
  [Next.js] App Router
    ├── Client: React (TailwindCSS + shadcn/ui)
    ├── API Routes → Prisma → SQLite (private/uploads/)
    └── API Routes → APIB.ai API (外部)
```

**请求流向**：
1. 浏览器访问 `https://你的域名:__SSL_PORT__`
2. Nginx 终止 SSL，转发到 `http://127.0.0.1:3000`
3. Next.js 处理请求：
   - 页面路由 → SSR 渲染
   - API 路由 → 业务逻辑 → 数据库/外部 API
4. 图片存储于 `private/uploads/`，通过 `/api/images/{id}` 鉴权访问

---

## 环境要求

| 依赖 | 版本要求 | 检查命令 |
|------|----------|----------|
| Node.js | >= 20 | `node -v` |
| npm | >= 10 | `npm -v` |
| Nginx | >= 1.24 | `nginx -v` |
| pm2 | latest | `npm list -g pm2` |

安装缺失依赖：

```bash
# Node.js（如未安装）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
npm install -g pm2

# 本工程依赖
cd /path/to/ai-image-gen
npm install
```

---

## 环境变量

参见 `.env` 模板。生产环境关键变量：

| 变量 | 用途 | 示例 |
|------|------|------|
| `APIB_API_KEY` | APIB.ai API 密钥 | `sk-xxxx` |
| `DATABASE_URL` | 数据库路径 | `file:./dev.db` |
| `AUTH_SECRET` | JWT 签名密钥（**必须修改**） | `openssl rand -hex 32` 生成 |
| `NEXTAUTH_URL` | 公开访问地址（**反代时必须设置**） | `https://你的域名:__SSL_PORT__` |

**.env 与 .env.local 的关系**：
- `.env` — 模板文件，提交到 Git，不含敏感值
- `.env.local` — 实际配置，不提交到 Git，`next start` 时读取
- 复制并编辑：`cp .env .env.local`

---

## 快速部署

### 一键部署

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

脚本执行内容：
1. `git pull` 拉取最新代码
2. `npm install` 安装依赖
3. `npx prisma migrate deploy` 执行数据库迁移（生产模式）
4. `npm run build` 构建生产版本
5. `pm2 reload ecosystem.config.cjs` 平滑重启

### 手动部署

```bash
git pull
npm install
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.cjs     # 首次
pm2 reload ecosystem.config.cjs    # 后续重启
```

### 管理后台入口

部署后访问 `https://你的域名:__SSL_PORT__/login`，使用管理员账号登录。

初始化管理员（仅首次）：

```bash
curl -X POST http://localhost:3000/api/auth/seed
```

默认密码：`admin123456`，请在后台立即修改。

---

## Nginx 配置

采用模块化结构，便于维护。

### 文件结构

```
deploy/nginx/
├── ai-image-gen.conf      # 主配置文件（入口）
└── conf.d/
    ├── upstream.conf      # 后端上游定义
    ├── proxy.conf         # 反向代理通用参数
    ├── ssl.conf           # SSL/TLS 证书配置
    ├── security.conf      # 安全头 + 限流
    ├── cache.conf         # 静态资源缓存策略
    ├── gzip.conf          # 压缩配置
    └── websocket.conf     # WebSocket 支持（Next.js HMR）
```

### 部署到系统

```bash
sudo cp deploy/nginx/ai-image-gen.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/ai-image-gen.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 各模块说明

**ai-image-gen.conf** — 主入口，挂载到 `server_name`，按顺序 `include` 各模块。

**upstream.conf** — 定义后端服务地址：

```nginx
upstream ai-image-gen {
    server 127.0.0.1:3000;
    keepalive 64;
}
```

**proxy.conf** — 反代核心参数，包含 `proxy_set_header` 转发真实 IP/协议。

**ssl.conf** — SSL 证书路径、协议版本、加密套件（需先修改证书路径为实际位置）。

**security.conf** — 安全头（CSP、HSTS、X-Frame-Options 等）和连接限流。

**cache.conf** — 静态资源（JS/CSS/图片）的浏览器缓存策略。

**gzip.conf** — `gzip on`、压缩级别 6、`text/html application/javascript` 等。

**websocket.conf** — `Upgrade`/`Connection` 头转发，用于开发模式 HMR。

### 修改域名

编辑 `ai-image-gen.conf`，将 `server_name` 改为你的域名。

---

## PM2 管理

### 常用命令

```bash
# 启动（首次）
pm2 start ecosystem.config.cjs

# 查看状态
pm2 list
pm2 show ai-image-gen

# 查看日志
pm2 logs ai-image-gen
pm2 logs ai-image-gen --lines 100

# 监控（CPU/内存）
pm2 monit

# 重启 / 停止
pm2 restart ai-image-gen
pm2 stop ai-image-gen

# 保存进程列表（开机自启）
pm2 save
pm2 startup  # 按提示执行生成的命令
```

### 日志管理

PM2 日志默认存储在 `~/.pm2/logs/`，建议配置日志轮转：

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
```

### ecosystem.config.cjs

```javascript
module.exports = {
  apps: [{
    name: "ai-image-gen",
    script: "npm",
    args: "start",
    cwd: "/path/to/ai-image-gen",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    instances: 1,          // 单实例（SQLite 不支持多写）
    exec_mode: "fork",
    max_memory_restart: "1G",
    error_file: "./logs/error.log",
    out_file: "./logs/access.log",
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};
```

---

## SSL 证书

### 使用 Let's Encrypt（推荐）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com
```

证书自动续期（已配置 systemd timer）：

```bash
# 测试续期
sudo certbot renew --dry-run
```

### 更新 ssl.conf

certbot 完成后，修改 `deploy/nginx/conf.d/ssl.conf` 中的证书路径：

```nginx
ssl_certificate     /etc/letsencrypt/live/你的域名.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/你的域名.com/privkey.pem;
```

然后重新部署 nginx 配置。

---

## 数据库备份

### 手动备份

```bash
# SQLite 数据库文件
cp /path/to/ai-image-gen/prisma/dev.db /backup/ai-image-gen-$(date +%Y%m%d).db
```

### 自动备份（cron）

```bash
sudo crontab -e
# 添加（每天凌晨 3 点，保留最近 30 天）：
0 3 * * * /path/to/ai-image-gen/deploy/backup.sh
```

`deploy/backup.sh` 脚本内容（需手动创建）：

```bash
#!/bin/bash
BACKUP_DIR="/backup"
DB_PATH="/path/to/ai-image-gen/prisma/dev.db"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/dev-$(date +%Y%m%d-%H%M%S).db"
find "$BACKUP_DIR" -name "dev-*.db" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Backup completed" >> "$BACKUP_DIR/backup.log"
```

---

## 存储管理

### 图片存储位置

`private/uploads/` — 所有生成图片，以 UUID 命名，原始格式 + WebP 格式。

### 存储上限

通过管理员后台 `/admin/settings` 配置 `maxStorageMB`（默认 500MB）。接近上限时，系统自动删除最旧的图片文件及对应数据库记录。

### 手动清理

```bash
# 查看当前存储用量
du -sh private/uploads/

# 手动清理某用户图片（通过管理员后台 /admin/images）
```

---

## 安全加固

### 密钥管理

- `APIB_API_KEY`：定期轮换，通过 `/admin/settings` 更新（功能开发中，暂时手动修改 `.env.local`）
- `AUTH_SECRET`：**必须修改**为 `openssl rand -hex 32` 生成的随机值

### 生产环境 Checklist

- [ ] `AUTH_SECRET` 已修改为强随机字符串
- [ ] `NEXTAUTH_URL` 已设置为正确域名
- [ ] 默认管理员密码已修改
- [ ] SSL 证书已配置且自动续期
- [ ] Nginx `deny all;` 对 `private/` 和 `.env*` 已生效
- [ ] 防火墙仅开放 `__SSL_PORT__` 端口（或 WebSocket 所需的端口）
- [ ] 数据库备份 cron 已配置

### CSP 策略

`security.conf` 中已配置 Content-Security-Policy，如使用外部资源需按需调整。

---

## 更新流程

```bash
# 1. 拉取最新代码
git pull

# 2. 安装依赖（如有变更）
npm install

# 3. 数据库迁移（如有 schema 变更）
npx prisma migrate deploy

# 4. 构建
npm run build

# 5. 平滑重启
pm2 reload ecosystem.config.cjs

# 6. 验证
sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
# 预期返回 200
```

如更新涉及 Nginx 配置：

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 故障排查

### 502 Bad Gateway

Nginx 无法连接 Next.js 进程：

```bash
# 检查 Next.js 是否运行
pm2 list

# 检查端口监听
ss -tlnp | grep 3000

# 查看应用日志
pm2 logs ai-image-gen --lines 50
```

### 登录后 session 丢失 / 重定向到 login

原因：`NEXTAUTH_URL` 与浏览器访问地址不匹配，或 cookie 未正确转发。

```bash
# 1. 检查 .env.local 中的 NEXTAUTH_URL
grep NEXTAUTH_URL .env.local

# 2. 确认 Nginx 转发头部（proxy.conf）
#    proxy_set_header Host $host;             # 必须
#    proxy_set_header X-Forwarded-Proto $scheme;  # 必须（生产环境）

# 3. 检查浏览器 cookie：next-auth.session-token 是否存在
# 4. 清除浏览器缓存后重试
```

### 数据库错误

```bash
# 检查数据库文件完整性
sqlite3 prisma/dev.db "PRAGMA integrity_check;"

# 查看系统日志
journalctl -u nginx --no-pager -n 50
pm2 logs ai-image-gen --lines 50
```

### 图片无法生成 / 任务卡住

1. 检查 `APIB_API_KEY` 是否有效
2. 检查 `curl -X POST` 测试 API：
   ```bash
   curl -s -H "Authorization: Bearer $APIB_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"gpt-image-2","prompt":"test","n":1}' \
     https://api.apib.ai/v1/images/generations
   ```
3. 查看应用日志中 API 响应

### 存储空间告警

```bash
# 查看空间使用
df -h

# 查看图片目录大小
du -sh /path/to/ai-image-gen/private/uploads/

# 如磁盘满：扩容或增加 maxStorageMB 后手动清理
# 紧急：删除最旧图片
ls -t private/uploads/ | tail -n +100 | xargs -I{} rm private/uploads/{}
```

### 性能问题

- SQLite 不适用于高并发写入场景。如用户量增大，建议迁移至 PostgreSQL
- 检查 PM2 内存：`pm2 monit`
- 检查磁盘 IO：`iostat -x 1`
- 图片文件大量堆积时，WebP 转码可能消耗 CPU，考虑调整 `sharp` 质量参数

### 日志文件位置汇总

| 日志 | 位置 |
|------|------|
| Next.js 应用日志 | `pm2 logs ai-image-gen` |
| PM2 日志文件 | `~/.pm2/logs/ai-image-gen-*.log` |
| Nginx 错误日志 | `/var/log/nginx/error.log` |
| Nginx 访问日志 | `/var/log/nginx/access.log` |
| 系统日志 | `journalctl -u nginx` |
| 备份日志 | `/backup/backup.log` |

---

> 如有未覆盖的问题，请提交 Issue：https://github.com/danroudao/ai-image-gen/issues
