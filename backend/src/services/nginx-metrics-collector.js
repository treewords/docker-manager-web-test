const fs = require('fs').promises;
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

    // Ensure the log directory exists
    fs.mkdir(LOG_DIR, { recursive: true }).catch(err => {
      logger.error('Failed to create Nginx log directory', err);
    });

    // Watch the access log for changes
    const watcher = chokidar.watch(ACCESS_LOG_FILE, { persistent: true, awaitWriteFinish: true });
    watcher.on('change', () => this.incrementalParseLog());

    this.incrementalParseLog(); // Initial parse
  }

  async incrementalParseLog() {
    try {
        const stats = await fs.stat(ACCESS_LOG_FILE);
        if (stats.size < this.lastReadPosition) {
            // Log file has been rotated
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

        // Prune old logs to prevent memory exhaustion
        this.pruneOldLogs();

    } catch (error) {
        if (error.code !== 'ENOENT') {
            logger.error('Failed to parse Nginx access log incrementally', error);
        }
    }
  }

  pruneOldLogs() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Keep 7 days of logs
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
  }

  _filterLogs(taskDomain, timeWindow) {
    const now = new Date();
    let startTime;

    switch (timeWindow) {
      case '1h': startTime = new Date(now.getTime() - 60 * 60 * 1000); break;
      case '24h': startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
      case '7d': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      default: startTime = new Date(0); // All time
    }

    return this.logs.filter(log =>
        (!taskDomain || log.host === taskDomain) && log.timestamp >= startTime
    );
  }

  async getTaskMetrics(taskId, { timeWindow = '24h' } = {}) {
    const task = await nginxTaskStore.getTask(taskId);
    const filteredLogs = this._filterLogs(task ? task.domain : null, timeWindow);

    if (filteredLogs.length === 0) {
        return { totalRequests: 0, avgResponseTime: 0, errorRate: 0, statusCodes: {}, topEndpoints: [] };
    }

    const totalRequests = filteredLogs.length;
    const totalResponseTime = filteredLogs.reduce((sum, log) => sum + log.requestTime, 0);
    const avgResponseTime = totalResponseTime / totalRequests;

    const errors = filteredLogs.filter(log => log.status >= 400);
    const errorRate = errors.length / totalRequests;

    const statusCodes = filteredLogs.reduce((acc, log) => ({ ...acc, [log.status]: (acc[log.status] || 0) + 1 }), {});

    const endpointCounts = filteredLogs.reduce((acc, log) => {
      const endpoint = `${log.method} ${log.path}`;
      return { ...acc, [endpoint]: (acc[endpoint] || 0) + 1 };
    }, {});

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return { totalRequests, avgResponseTime, errorRate, statusCodes, topEndpoints };
  }
}

module.exports = new NginxMetricsCollector();
