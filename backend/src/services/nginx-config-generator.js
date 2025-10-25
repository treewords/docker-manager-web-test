const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const logger = require('../utils/logger');

const configDir = path.join(__dirname, '../../data/nginx/conf.d');

class NginxConfigGenerator {
  constructor() {
    fs.mkdir(configDir, { recursive: true }).catch(err => {
      logger.error('Failed to create Nginx config directory', err);
    });
  }

  _sanitize(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[^a-zA-Z0-9_.-]/g, '');
  }

  async _writeConfigFile(domain, content) {
    const sanitizedDomain = this._sanitize(domain);
    const configPath = path.join(configDir, `${sanitizedDomain}.conf`);
    try {
      await fs.writeFile(configPath, content, 'utf8');
      logger.info(`Nginx config file generated for domain: ${domain}`);
      return configPath;
    } catch (error) {
      logger.error(`Failed to write Nginx config file for domain: ${domain}`, error);
      throw error;
    }
  }

  generateUpstreamBlock(task) {
    if (!task.upstreams || task.upstreams.length === 0) return '';
    const sanitizedUpstreamName = this._sanitize(task.domain);
    const servers = task.upstreams.map(up => `  server ${up.host}:${up.port};`).join('\n');
    return `upstream ${sanitizedUpstreamName} {\n${servers}\n}\n`;
  }

  generateCorsHeaders(task) {
    if (!task.cors_origins || task.cors_origins.length === 0) return '';
    const origins = task.cors_origins.join(' ');
    // ... CORS headers implementation ...
  }

  generateTemporaryConfigFile(task) {
    const content = `
server {
  listen 80;
  server_name ${task.domain};

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    # Temporary response for the challenge phase
    return 404;
  }
}`;
    return this._writeConfigFile(task.domain, content);
  }

  generateFinalConfigFile(task) {
    const upstreamBlock = this.generateUpstreamBlock(task);
    const sanitizedDomain = this._sanitize(task.domain);
    const proxyPass = task.upstreams?.length > 0 ? `http://${sanitizedDomain}` : `http://localhost:${task.port}`;

    let serverBlocks = `
server {
  listen 80;
  server_name ${task.domain};

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}`;

    if (task.ssl && task.ssl.enabled) {
      serverBlocks += `
server {
  listen 443 ssl http2;
  server_name ${task.domain};

  ssl_certificate /etc/letsencrypt/live/${task.domain}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/${task.domain}/privkey.pem;

  # Recommended SSL settings
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
  ssl_prefer_server_ciphers off;

  location / {
    proxy_pass ${proxyPass};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    ${this.generateCorsHeaders(task) || ''}
  }
}`;
    } else {
      // Non-SSL configuration
      serverBlocks = `
server {
  listen 80;
  server_name ${task.domain};

  location / {
    proxy_pass ${proxyPass};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    ${this.generateCorsHeaders(task) || ''}
  }
}`;
    }

    const finalConfig = `${upstreamBlock}\n${serverBlocks}`;
    return this._writeConfigFile(task.domain, finalConfig);
  }
}

module.exports = new NginxConfigGenerator();
