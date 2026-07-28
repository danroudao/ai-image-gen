// AI Image Generator — PM2 进程管理
// 使用：pm2 start ecosystem.config.cjs 或 pm2 reload ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "ai-image-gen",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      error_file: "./logs/error.log",
      out_file: "./logs/access.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
