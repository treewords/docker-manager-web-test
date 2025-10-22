const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const logger = require('../utils/logger');
const nginxTaskStore = require('./nginx-task-store');

const NGINX_SSL_DIR = path.join(__dirname, '../../data/nginx/ssl');

class NginxSslManager {
  constructor() {
    // Ensure the Nginx SSL directory exists
    fs.mkdir(NGINX_SSL_DIR, { recursive: true }).catch(err => {
      logger.error('Failed to create Nginx SSL directory', err);
    });
  }

  async generateLetsEncryptCert(taskId) {
    const task = await nginxTaskStore.getTask(taskId);
    if (!task || !task.ssl || !task.ssl.enabled) {
      throw new Error('SSL is not enabled for this task');
    }

    const { domain } = task.ssl;

    // In a production environment, this would trigger a job for a dedicated Certbot container.
    // For this implementation, we will log a message and simulate the certificate generation.
    logger.info(`[Placeholder] SSL certificate generation requested for domain: ${domain}.`);
    logger.info('In a production environment, a separate Certbot container would handle this request.');

    await nginxTaskStore.updateTask(taskId, { ssl: { ...task.ssl, status: 'issuing' } });

    // Simulate a delay for certificate issuance
    setTimeout(async () => {
        // In a real scenario, we'd verify the certificate exists before updating the status.
        await nginxTaskStore.updateTask(taskId, { ssl: { ...task.ssl, status: 'issued' } });
        logger.info(`[Placeholder] SSL certificate for domain: ${domain} marked as issued.`);
    }, 30000); // 30-second delay to simulate issuance
  }

  async renewAllCertificates() {
    logger.info('[Placeholder] Daily certificate renewal process started.');
    logger.info('In a production environment, a separate Certbot container would handle renewals.');
    // Here you would check for certificates nearing expiration and trigger renewal jobs.
  }

  setupAutoRenewal() {
    cron.schedule('0 3 * * *', () => { // Run daily at 3:00 AM
      this.renewAllCertificates();
    }, {
      scheduled: true,
      timezone: "Etc/UTC"
    });

    logger.info('Scheduled automatic certificate renewal check.');
  }

  async validateCertificate(domain) {
    // This would check for the actual certificate files in a shared volume.
    const certPath = path.join(NGINX_SSL_DIR, domain, 'fullchain.pem');
    try {
        await fs.access(certPath);
        logger.info(`Certificate for ${domain} found.`);
        return true;
    } catch (error) {
        logger.warn(`Certificate for ${domain} not found.`);
        return false;
    }
  }
}

module.exports = new NginxSslManager();
