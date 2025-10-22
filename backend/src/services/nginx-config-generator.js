const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const logger = require('../utils/logger');

const configDir = path.join(__dirname, '../../data/nginx/conf.d');

class NginxConfigGenerator {
  constructor() {
    // Ensure the config directory exists
    fs.mkdir(configDir, { recursive: true }).catch(err => {
      logger.error('Failed to create Nginx config directory', err);
    });
  }

  _sanitize(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[^a-zA-Z0-9_.-]/g, '');
  }

  generateUpstreamBlock(task) {
    if (!task.upstreams || task.upstreams.length === 0) {
      return '';
    }
    const sanitizedUpstreamName = this._sanitize(task.domain);
    const servers = task.upstreams.map(upstream => `  server ${upstream.host}:${upstream.port};`).join('\n');
    return `
upstream ${sanitizedUpstreamName} {
${servers}
}
`;
  }

  generateCorsHeaders(task) {
    if (!task.cors_origins || task.cors_origins.length === 0) {
      return '';
    }
    const origins = task.cors_origins.join(' ');
    return `
  add_header 'Access-Control-Allow-Origin' '${origins}';
  add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
  add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
  add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
  if ($request_method = 'OPTIONS') {
    add_header 'Access-Control-Max-Age' 1728000;
    add_header 'Content-Type' 'text/plain; charset=utf-8';
    add_header 'Content-Length' 0;
    return 204;
  }
`;
  }

  generateServerBlock(task) {
    const sanitizedDomain = this._sanitize(task.domain);
    const proxyPass = task.upstreams && task.upstreams.length > 0
      ? `http://${sanitizedDomain}`
      : `http://127.0.0.1:${task.port}`;

    return `
server {
  listen 80;
  server_name ${task.domain};

  location / {
    proxy_pass ${proxyPass};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
${this.generateCorsHeaders(task)}
  }
}
`;
  }

  async generateConfigFile(task) {
    const upstreamBlock = this.generateUpstreamBlock(task);
    const serverBlock = this.generateServerBlock(task);
    const config = `${upstreamBlock}\n${serverBlock}`;

    const sanitizedDomain = this._sanitize(task.domain);
    const configPath = path.join(configDir, `${sanitizedDomain}.conf`);

    try {
      await fs.writeFile(configPath, config, 'utf8');
      logger.info(`Nginx config file generated for domain: ${task.domain}`);
      return configPath;
    } catch (error) {
      logger.error(`Failed to write Nginx config file for domain: ${task.domain}`, error);
      throw error;
    }
  }

  async validateNginxSyntax() {
    return new Promise((resolve, reject) => {
      // This command assumes nginx is in the PATH. In a containerized environment,
      // this would be executed inside the nginx container.
      exec('nginx -t', (error, stdout, stderr) => {
        if (error) {
          logger.error(`Nginx syntax validation failed: ${stderr}`);
          reject(new Error(`Nginx syntax validation failed: ${stderr}`));
        } else {
          logger.info('Nginx syntax is valid.');
          resolve(true);
        }
      });
    });
  }
}

module.exports = new NginxConfigGenerator();
