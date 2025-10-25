const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const logger = require('../utils/logger');
const nginxTaskStore = require('./nginx-task-store');

const LOG_DIR = path.join(__dirname, '../../data/nginx/logs');
const ACCESS_LOG_FILE = path.join(LOG_DIR, 'access.log');

const LOG_REGEX = /^(?<ip>[\d.]+) - - \[(?<timestamp>.+)\] "(?<method>\S+) (?<path>\S+) \S+" (?<status>\d{3}) (?<bytes>\d+) "(?<referer>.*)" "(?<user_agent>.*)" "(?<host>.*)" "(?<request_time>[\d.]+)"$/;

class NginxMetricsCollector {
  constructor() {
    this.logs = [];
    this.lastReadPosition = 0;

    fsPromises.mkdir(LOG_DIR, { recursive: true }).catch(err => {
      logger.error('Failed to create Nginx log directory', err);
    });

    const watcher = chokidar.watch(ACCESS_LOG_FILE, { persistent: true, awaitWriteFinish: true });
    watcher.on('change', () => this.incrementalParseLog());

    this.incrementalParseLog();
  }

  async incrementalParseLog() {
    try {
        const stats = await fsPromises.stat(ACCESS_LOG_FILE);
        if (stats.size < this.lastReadPosition) {
            this.lastReadPosition = 0;
            this.logs = [];
        }

        const stream = fs.createReadStream(ACCESS_LOG_FILE, {
            encoding: 'utf8',
            start: this.lastReadPosition
        });

        for await (const chunk of stream) {
            const lines = chunk.split('\n').filter(Boolean);
            const parsedLines = lines.map(line => {
                const match = line.match(LOG_REGEX);
                if (!match) return null;
                const { host, timestamp, method, path, status, bytes, request_time } = match.groups;
                return {
                    host,
                    timestamp: new Date(timestamp.replace(' ', 'T').replace(/\//g, '-').replace(':', ' ')),
                    method,
                    path,
                    status: parseInt(status, 10),
                    bytes: parseInt(bytes, 10),
                    requestTime: parseFloat(request_time, 10),
                };
            }).filter(Boolean);
            this.logs.push(...parsedLines);
        }
        this.lastReadPosition = stats.size;

        this.pruneOldLogs();

    } catch (error) {
        if (error.code !== 'ENOENT') {
            logger.error('Failed to parse Nginx access log incrementally', error);
        }
    }
  }

  pruneOldLogs() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
  }

  // ... (rest of the class)
}

module.exports = new NginxMetricsCollector();
