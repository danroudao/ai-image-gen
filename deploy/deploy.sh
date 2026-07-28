#!/bin/bash
# AI Image Generator — 一键部署脚本
# 用法：chmod +x deploy/deploy.sh && ./deploy/deploy.sh

set -e

echo "========================================"
echo " AI Image Generator — 部署开始"
echo "========================================"

# 检查环境
command -v node >/dev/null 2>&1 || { echo "错误：未检测到 Node.js"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "错误：未检测到 npm"; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo "错误：未检测到 PM2，运行 npm install -g pm2"; exit 1; }

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo "[1/5] 拉取最新代码..."
git pull

echo "[2/5] 安装依赖..."
npm install --production

echo "[3/5] 执行数据库迁移..."
npx prisma migrate deploy

echo "[4/5] 构建生产版本..."
npm run build

echo "[5/5] 平滑重启 PM2..."
if pm2 list | grep -q ai-image-gen; then
    pm2 reload ecosystem.config.cjs
else
    pm2 start ecosystem.config.cjs
fi
pm2 save

echo "========================================"
echo " 部署完成！"
echo " 管理：pm2 logs ai-image-gen"
echo " 监控：pm2 monit"
echo "========================================"
