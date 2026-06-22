module.exports = {
  apps: [
    {
      name: 'ras-portal',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max', // Spawns a worker process on every CPU core
      exec_mode: 'cluster', // Enables clustering and built-in load balancing
      watch: false,
      max_memory_restart: '1G', // Restarts a worker if memory usage exceeds 1GB
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
