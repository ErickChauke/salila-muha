const path = require('path');

module.exports = {
  apps: [
    {
      name: 'api',
      script: 'dist/index.js',
      node_args: '-r dotenv/config',
      instances: 1,
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
