const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const crypto = require('crypto');

const dataPath = path.join(__dirname, '../../data/nginx-tasks.json');

class NginxTaskStore {
  constructor() {
    this.tasks = new Map();
  }

  async init() {
    try {
      const data = await fs.readFile(dataPath, 'utf8');
      const tasks = JSON.parse(data);
      for (const task of tasks) {
        this.tasks.set(task.id, task);
      }
      logger.info('Nginx task store initialized.');
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('No Nginx task store found, creating a new one.');
        await this._persist();
      } else {
        logger.error('Failed to initialize Nginx task store', error);
        throw error;
      }
    }
  }

  async _persist() {
    try {
      const tasks = Array.from(this.tasks.values());
      await fs.writeFile(dataPath, JSON.stringify(tasks, null, 2), 'utf8');
    } catch (error) {
      logger.error('Failed to persist Nginx tasks', error);
      throw error;
    }
  }

  async getTasks({ status, domain, limit = 10, offset = 0 } = {}) {
    let tasks = Array.from(this.tasks.values());

    if (status) {
      tasks = tasks.filter(task => task.status === status);
    }
    if (domain) {
      tasks = tasks.filter(task => task.domain.includes(domain));
    }

    const paginatedTasks = tasks.slice(offset, offset + limit);
    return {
      tasks: paginatedTasks,
      total: tasks.length,
      limit,
      offset
    };
  }

  async getTask(id) {
    return this.tasks.get(id);
  }

  async addTask(taskData) {
    const id = crypto.randomBytes(16).toString('hex');
    const now = new Date().toISOString();
    const task = {
      id,
      ...taskData,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Task schema validation would go here
    if (!task.domain || !task.port) {
        throw new Error('Domain and port are required');
    }

    this.tasks.set(id, task);
    await this._persist();
    logger.info(`Nginx task added: ${id}`);
    return task;
  }

  async updateTask(id, updates) {
    if (!this.tasks.has(id)) {
      return null;
    }
    const task = this.tasks.get(id);
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(id, updatedTask);
    await this._persist();
    logger.info(`Nginx task updated: ${id}`);
    return updatedTask;
  }

  async deleteTask(id) {
    if (!this.tasks.has(id)) {
      return false;
    }
    this.tasks.delete(id);
    await this._persist();
    logger.info(`Nginx task deleted: ${id}`);
    return true;
  }
}

module.exports = new NginxTaskStore();
