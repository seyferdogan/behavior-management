module.exports = {
  apps: [
    {
      name: 'behavior-management-backend-ssl',
      script: 'src/app.js',
      cwd: './behavior-management-backend',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        SSL_ENABLED: 'true',
        SSL_CERT_PATH: './certificates/localhost.crt',
        SSL_KEY_PATH: './certificates/localhost.key'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'behavior-management-frontend-ssl',
      script: 'serve',
      cwd: './behavior_system',
      args: '-s build -l 3000 --ssl-cert ../certificates/localhost.crt --ssl-key ../certificates/localhost.key',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
