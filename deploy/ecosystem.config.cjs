/**
 * PM2 process definition for the Qaroo India API on EC2.
 *
 *   cd /var/www/qaroo/backend
 *   pm2 start ../deploy/ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup          # prints a command to run with sudo, so it survives reboot
 *
 *   pm2 logs qaroo-api
 *   pm2 reload qaroo-api # zero-downtime restart after a deploy
 *
 * .cjs because the backend package.json sets "type": "module" and PM2 loads
 * this file with require().
 *
 * Secrets are NOT in this file. Put them in backend/.env on the instance
 * (chmod 600), or better, pull them from AWS Secrets Manager / SSM Parameter
 * Store in a wrapper script. A committed config file is the wrong place for a
 * database URI or a mailbox password.
 */

module.exports = {
  apps: [
    {
      name: 'qaroo-api',
      script: 'server.js',
      cwd: '/var/www/qaroo/backend',

      // Bound to loopback so the port is reachable only through nginx on this
      // host, and not from the internet even if the security group is loose.
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 5000,
      },

      // One instance. Going to cluster mode would need the express-rate-limit
      // store moved to Redis or Mongo first: the default store is per-process,
      // so N workers would each allow the full quota and the limits would
      // effectively be N times looser.
      instances: 1,
      exec_mode: 'fork',

      autorestart: true,
      max_restarts: 10,
      min_uptime: '20s',
      // Restart if the process leaks past this, rather than letting the
      // instance start swapping.
      max_memory_restart: '400M',

      // Timestamped logs, and stderr kept separate so an error is not buried
      // in request noise.
      time: true,
      out_file: '/var/log/qaroo/api.out.log',
      error_file: '/var/log/qaroo/api.err.log',
      merge_logs: true,

      // Never watch in production: a file change mid-request would restart the
      // process under load.
      watch: false,
    },
  ],
};
