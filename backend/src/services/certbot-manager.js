const Docker = require('dockerode');
const logger = require('../utils/logger');

const CERTBOT_CONTAINER_NAME = 'certbot';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class CertbotManager {
  constructor() {
    this.docker = new Docker();
  }

  async _findCertbotContainer() {
    const containers = await this.docker.listContainers({
      filters: { name: [CERTBOT_CONTAINER_NAME] }
    });
    if (containers.length === 0) {
      throw new Error(`Certbot container '${CERTBOT_CONTAINER_NAME}' not found.`);
    }
    return this.docker.getContainer(containers[0].Id);
  }

  async _execInCertbot(command) {
    try {
      const container = await this._findCertbotContainer();
      const exec = await container.exec({
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: true, stdin: true });

      return new Promise((resolve, reject) => {
        let output = '';
        let errorOutput = '';

        stream.on('data', chunk => {
          const data = chunk.toString('utf8');
          if (data.toLowerCase().includes('error') || data.toLowerCase().includes('failed')) {
            errorOutput += data;
          } else {
            output += data;
          }
        });

        exec.inspect((err, data) => {
          if (err) return reject(err);
          if (data.ExitCode !== 0) {
            const errorMessage = errorOutput || output || `Command exited with code ${data.ExitCode}`;
            logger.error(`Certbot command '${command.join(' ')}' failed: ${errorMessage}`);
            return reject(new Error(errorMessage));
          }
          resolve(output);
        });
      });
    } catch (error) {
      logger.error(`Failed to execute command in Certbot container: ${error.message}`);
      throw error;
    }
  }

  async requestCertificate(domain, email) {
    logger.info(`Requesting certificate for ${domain} with email ${email}...`);

    await sleep(5000);

    const command = [
      'certbot', 'certonly',
      '--webroot',
      '--webroot-path', '/var/www/certbot',
      '--email', email,
      '-d', domain,
      '--agree-tos',
      '--no-eff-email',
      '--text',
      '--non-interactive',
      '--force-renewal',
    ];
    await this._execInCertbot(command);
    logger.info(`Successfully obtained certificate for ${domain}.`);
  }

  async renewCertificates() {
    logger.info('Attempting to renew SSL certificates...');
    try {
      const command = ['certbot', 'renew'];
      const result = await this._execInCertbot(command);
      logger.info('Certificates renewal check finished.', result);
    } catch (error) {
      logger.error('Failed to renew certificates:', error);
    }
  }
}

module.exports = new CertbotManager();
