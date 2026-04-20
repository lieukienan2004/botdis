module.exports = {
  apps: [{
    name: 'discord-music-bot-24-7',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart strategies
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    // Auto restart on crash
    kill_timeout: 5000,
    // Memory monitoring
    max_memory_restart: '500M',
    // CPU monitoring
    instance_var: 'INSTANCE_ID'
  }]
};