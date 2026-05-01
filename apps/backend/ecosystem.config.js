const path = require('path');

module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/index.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      node_args: '-r dotenv/config',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DOTENV_CONFIG_PATH: path.resolve(__dirname, '../../.env'),
      },
    },
  ],
}
