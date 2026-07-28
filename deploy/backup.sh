#!/bin/bash
# AI Image Generator — 数据库备份脚本
# 配合 cron 使用：0 3 * * * /path/to/ai-image-gen/deploy/backup.sh

BACKUP_DIR="/backup"
DB_PATH="$(cd "$(dirname "$0")/.." && pwd)/prisma/dev.db"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/dev-$(date +%Y%m%d-%H%M%S).db"
find "$BACKUP_DIR" -name "dev-*.db" -mtime +$RETENTION_DAYS -delete
echo "[$(date)] Backup completed: dev-$(date +%Y%m%d-%H%M%S).db" >> "$BACKUP_DIR/backup.log"
