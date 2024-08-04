module.exports = {
  apps : [{
    name: 'dmvision-api',
    script: 'server.js',
    instances: 'max',
    autorestart: true,
    max_memory_restart: '1G',
    env: {
	NODE_ENV: 'development'
    },
    env_production: {
	NODE_ENV: 'production'
    },
    watch: true
  }],

  deploy : {
    production : {
      user : 'SSH_USERNAME',
      host : 'SSH_HOSTMACHINE',
      ref  : 'origin/master',
      repo : 'GIT_REPOSITORY',
      path : 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
