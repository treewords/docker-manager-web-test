const Docker = require('dockerode');
const { Readable, Writable } = require('stream');
const { logger } = require('../config/logger');
const userStore = require('./user-store');

// Initialize Dockerode
// It will connect to the Docker daemon via the socket specified in DOCKER_HOST
// or the default /var/run/docker.sock.
const docker = new Docker();

/**
 * Lists all containers.
 * @returns {Promise<Array>} A list of containers with relevant details.
 */
async function listContainers() {
  try {
    const containersInfo = await docker.listContainers({ all: true });

    const containers = await Promise.all(
      containersInfo.map(async (containerInfo) => {
        const containerData = {
          id: containerInfo.Id.substring(0, 12),
          name: containerInfo.Names[0].substring(1),
          image: containerInfo.Image,
          state: containerInfo.State,
          status: containerInfo.Status,
          ports: containerInfo.Ports,
          CpuUsage: 'N/A',
          MemUsage: 'N/A',
        };

        if (containerInfo.State === 'running') {
          try {
            const container = docker.getContainer(containerInfo.Id);
            const stats = await container.stats({ stream: false });

            // CPU Usage Calculation
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
            const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
            const numberOfCpus = stats.cpu_stats.online_cpus || (stats.cpu_stats.cpu_usage.percpu_usage ? stats.cpu_stats.cpu_usage.percpu_usage.length : 1);

            if (systemCpuDelta > 0.0 && cpuDelta > 0.0) {
              const cpuUsage = (cpuDelta / systemCpuDelta) * numberOfCpus * 100.0;
              containerData.CpuUsage = `${cpuUsage.toFixed(2)}%`;
            } else {
              containerData.CpuUsage = '0.00%';
            }

            // Memory Usage Calculation
            if (stats.memory_stats && stats.memory_stats.usage && stats.memory_stats.limit > 0) {
              const usedMemory = stats.memory_stats.usage - (stats.memory_stats.stats?.cache || 0);
              const memUsage = (usedMemory / stats.memory_stats.limit) * 100.0;
              containerData.MemUsage = `${memUsage.toFixed(2)}%`;
            }
          } catch (statsError) {
            logger.error(`Could not get stats for container ${containerInfo.Id}:`, statsError);
          }
        }

        return containerData;
      })
    );

    return containers;
  } catch (error) {
    logger.error('Error listing containers:', error);
    throw new Error('Failed to list Docker containers.');
  }
}

/**
 * Creates a new Docker volume.
 * @param {Object} options - The volume creation options (e.g., { Name: 'my-volume' }).
 * @returns {Promise<Object>} The created volume object.
 */
async function createVolume(options) {
  try {
    const volume = await docker.createVolume(options);
    return volume;
  } catch (error) {
    logger.error('Error creating volume:', error);
    throw new Error('Failed to create Docker volume.');
  }
}

/**
 * Removes a Docker volume.
 * @param {string} volumeName - The name of the volume to remove.
 */
async function removeVolume(volumeName) {
  try {
    const volume = docker.getVolume(volumeName);
    await volume.remove();
  } catch (error) {
    logger.error(`Error removing volume ${volumeName}:`, error);
    if (error.statusCode === 404) {
      throw new Error(`Volume '${volumeName}' not found.`);
    }
    if (error.statusCode === 409) {
      throw new Error(`Volume '${volumeName}' is in use and cannot be removed.`);
    }
    throw new Error(`Failed to remove volume '${volumeName}'.`);
  }
}

/**
 * Gets a single container by its ID.
 * @param {string} containerId - The ID of the container.
 * @returns {Promise<Docker.Container>} The Dockerode container object.
 */
function getContainer(containerId) {
  return docker.getContainer(containerId);
}

/**
 * Starts a container.
 * @param {string} containerId - The ID of the container to start.
 */
async function startContainer(containerId) {
  try {
    const container = getContainer(containerId);
    await container.start();
  } catch (error) {
    logger.error(`Error starting container ${containerId}:`, error);
    throw new Error(`Failed to start container ${containerId}.`);
  }
}

/**
 * Stops a container.
 * @param {string} containerId - The ID of the container to stop.
 */
async function stopContainer(containerId) {
  try {
    const container = getContainer(containerId);
    await container.stop();
  } catch (error) {
    logger.error(`Error stopping container ${containerId}:`, error);
    throw new Error(`Failed to stop container ${containerId}.`);
  }
}

/**
 * Restarts a container.
 * @param {string} containerId - The ID of the container to restart.
 */
async function restartContainer(containerId) {
    try {
        const container = getContainer(containerId);
        await container.restart();
    } catch (error) {
        logger.error(`Error restarting container ${containerId}:`, error);
        throw new Error(`Failed to restart container ${containerId}.`);
    }
}

/**
 * Removes a container.
 * @param {string} containerId - The ID of the container to remove.
 */
async function removeContainer(containerId) {
  try {
    const container = getContainer(containerId);
    await container.remove({ force: true }); // Force removal even if running
  } catch (error) {
    logger.error(`Error removing container ${containerId}:`, error);
    throw new Error(`Failed to remove container ${containerId}.`);
  }
}

/**
 * Creates a new container.
 * @param {Object} options - The container creation options.
 * @param {string} options.image - The image to use.
 * @param {Array<string>} [options.ports] - Port mappings (e.g., ["8080:80"]).
 * @param {Array<string>} [options.env] - Environment variables (e.g., ["VAR=value"]).
 * @param {string} [options.name] - The name of the container.
 * @param {Array<string>} [options.volumes] - Volume mappings (e.g., ["my-volume:/path/in/container"]).
 */
async function createContainer(options) {
    const { image, ports, env, name, volumes } = options;

    const portBindings = {};
    if (ports) {
        ports.forEach(portMapping => {
            const [hostPort, containerPort] = portMapping.split(':');
            const key = `${containerPort}/tcp`;
            if (!portBindings[key]) {
                portBindings[key] = [];
            }
            portBindings[key].push({ HostPort: hostPort });
        });
    }

    const createOptions = {
        Image: image,
        name,
        Env: env,
        ExposedPorts: {},
        HostConfig: {
            PortBindings: portBindings,
            Binds: volumes,
            LogConfig: { // Added LogConfig
                Type: "json-file"
            }
        }
    };

    if (ports) {
        ports.forEach(portMapping => {
            const [, containerPort] = portMapping.split(":");
            createOptions.ExposedPorts[`${containerPort}/tcp`] = {};
        });
    }

    try {
        const container = await docker.createContainer(createOptions);
        await container.start();
        return container;
    } catch (error) {
        // If the error is because the image does not exist, pull it and try again.
        if (error.statusCode === 404 && error.json.message.includes('No such image')) {
            logger.info(`Image '${image}' not found locally. Pulling from registry...`);
            try {
                // Pass a mock socket that does nothing to prevent crashes
                await pullImage(image, { emit: () => {} });
                logger.info(`Retrying container creation for '${image}'...`);
                const container = await docker.createContainer(createOptions);
                await container.start();
                return container;
            } catch (pullError) {
                logger.error(`Failed to pull image '${image}':`, pullError);
                // Propagate the specific pull error to the client
                throw new Error(`Failed to pull image ${image}.`);
            }
        }
        logger.error('Error creating container:', error);
        throw new Error(`Failed to create container from image ${image}.`);
    }
}

/**
 * Pulls a Docker image from the registry and reports progress via socket.
 * @param {string} imageName - The name of the image to pull.
 * @param {object} socket - The socket.io instance for progress reporting.
 * @returns {Promise<void>}
 */
async function pullImage(imageName, socket) {
  return new Promise((resolve, reject) => {
    docker.pull(imageName, (err, stream) => {
      if (err) {
        logger.error(`Error on initial pull for ${imageName}:`, err);
        const errorMessage = err.json?.message || err.message || 'Unknown error';
        socket.emit('pull:error', { imageName, message: `Failed to start pull: ${errorMessage}` });
        return reject(new Error(`Failed to pull image: ${errorMessage}`));
      }

      // Listen for progress events
      stream.on('data', (chunk) => {
        try {
          const data = JSON.parse(chunk.toString());
          socket.emit('pull:log', { imageName, ...data });
        } catch (e) {
          // Ignore parsing errors for non-JSON progress data
        }
      });

      stream.on('end', () => {
         logger.info(`Image pull stream ended for ${imageName}.`);
      });

      docker.modem.followProgress(stream, (finErr, output) => {
        if (finErr) {
          logger.error(`Error during image pull progress for ${imageName}:`, finErr);
          const errorMessage = finErr.message || 'Unknown error during pull progress.';
          socket.emit('pull:error', { imageName, message: `Pull failed: ${errorMessage}` });
          return reject(new Error(errorMessage));
        }

        const lastStatus = output[output.length - 1];
        if (lastStatus.error) {
            logger.error(`Error pulling image ${imageName}: ${lastStatus.error}`);
            socket.emit('pull:error', { imageName, message: lastStatus.error });
            return reject(new Error(lastStatus.error));
        }

        logger.info(`Successfully pulled image: ${imageName}`);
        socket.emit('pull:result', { status: 'success', imageName, message: 'Image pulled successfully.' });
        resolve(output);
      });
    });
  });
}

/**
 * Streams logs from a container.
 * @param {string} containerId - The ID of the container.
 * @param {Function} onData - Callback function to handle incoming log chunks.
 * @returns {Promise<Stream>} The log stream object.
 */
async function streamLogs(containerId, onData) {
    const container = getContainer(containerId);
    const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: true,
    });

    logStream.on('data', chunk => {
        onData(chunk.toString('utf8'));
    });

    return logStream;
}


/**
 * Executes a command in a container and streams the output.
 * @param {string} containerId - The ID of the container.
 * @param {string} command - The command to execute.
 * @returns {Promise<{ stream: Duplex, exec: Exec }>} The stream for the command output and the exec instance.
 */
async function executeCommand(containerId, command) {
  try {
    const container = getContainer(containerId);

    const execOptions = {
      Cmd: ['/bin/sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    };

    const exec = await container.exec(execOptions);
    const stream = await exec.start({ hijack: true, stdin: true });

    return { stream, exec };

  } catch (error) {
    logger.error(`Error executing command in container ${containerId}:`, error);
    throw new Error(`Failed to execute command in container ${containerId}.`);
  }
}


/**
 * Lists all Docker images.
 * @returns {Promise<Array>} A list of images with relevant details.
 */
async function listImages() {
  try {
    const images = await docker.listImages({ all: false });
    return images.map(image => ({
      id: image.Id.split(':')[1].substring(0, 12),
      tags: image.RepoTags,
      size: image.Size,
      created: image.Created,
    }));
  } catch (error) {
    logger.error('Error listing images:', error);
    throw new Error('Failed to list Docker images.');
  }
}

/**
 * Lists all Docker networks.
 * @returns {Promise<Array>} A list of networks with relevant details.
 */
async function listNetworks() {
  try {
    const networks = await docker.listNetworks();
    return networks.map(network => ({
      id: network.Id.substring(0, 12),
      name: network.Name,
      driver: network.Driver,
      scope: network.Scope,
      created: network.Created,
    }));
  } catch (error) {
    logger.error('Error listing networks:', error);
    throw new Error('Failed to list Docker networks.');
  }
}

/**
 * Lists all Docker volumes.
 * @returns {Promise<Array>} A list of volumes with relevant details.
 */
async function listVolumes() {
  try {
    const { Volumes: volumes } = await docker.listVolumes();
    return volumes.map(volume => ({
      name: volume.Name,
      driver: volume.Driver,
      mountpoint: volume.Mountpoint,
      createdAt: volume.CreatedAt,
    }));
  } catch (error) {
    logger.error('Error listing volumes:', error);
    throw new Error('Failed to list Docker volumes.');
  }
}

/**
 * Builds a Docker image from a Git repository.
 * @param {string} repoUrl - The URL of the Git repository.
 * @param {string} imageName - The name for the new image.
 * @param {object} user - The user object from the request.
 * @param {object} io - The socket.io server instance.
 * @returns {Promise<void>}
 */
async function buildImage(repoUrl, imageName, user, io) {
  return new Promise(async (resolve, reject) => {
    const userRoom = user.id; // Room specific to the user
    let remoteUrl = repoUrl;
    if (user) {
      const token = await userStore.getGitToken(user.username);
      if (token) {
        remoteUrl = repoUrl.replace('https://', `https://${token}@`);
        logger.info(`Using git token for user '${user.username}' to build from private repository.`);
      }
    }

    const options = {
      t: imageName,
      remote: remoteUrl,
    };

    // The first argument to buildImage must be a readable stream.
    // For remote builds, this can be an empty stream.
    const emptyStream = new Readable();
    emptyStream.push(null);

    docker.buildImage(emptyStream, options, (err, stream) => {
      if (err) {
        logger.error(`Error starting image build for ${imageName}:`, { error: err.message, stack: err.stack });
        if (io) {
          io.to(userRoom).emit('build:result', { status: 'error', imageName, message: `Failed to start build: ${err.message}` });
        }
        return reject(new Error(`Failed to start image build for ${imageName}.`));
      }

      // Handle the JSON stream from Docker
      stream.on('data', (chunk) => {
        try {
          const data = JSON.parse(chunk.toString());
          const message = data.stream || data.status;
          if (message) {
            logger.info(`[Build Output - ${imageName}]: ${message.trim()}`);
            if (io) {
              io.to(userRoom).emit('build:log', { imageName, message: message });
            }
          }
        } catch (e) {
            logger.warn(`Failed to parse Docker build log chunk for ${imageName}: ${chunk.toString()}`);
        }
      });

      stream.on('end', () => {
        logger.info(`Docker build stream ended for ${imageName}.`);
      });

      docker.modem.followProgress(stream, (finErr, output) => {
        if (finErr) {
          logger.error(`Error during image build from ${repoUrl}:`, { error: finErr.message, stack: finErr.stack });
          if (io) {
            io.to(userRoom).emit('build:result', { status: 'error', imageName, message: `Build failed: ${finErr.message}` });
          }
          return reject(new Error(`Failed during image build for ${imageName}.`));
        }

        if (output && output.length > 0) {
          const lastEntry = output[output.length - 1];
          if (lastEntry.error) {
              logger.error(`Build failed for ${imageName}: ${lastEntry.error}`);
              if (io) {
                  io.to(userRoom).emit('build:result', { status: 'error', imageName, message: lastEntry.error });
              }
              return reject(new Error(lastEntry.error));
          }
        }

        logger.info(`Successfully built image: ${imageName}`);
        if (io) {
          io.to(userRoom).emit('build:result', { status: 'success', imageName, message: 'Image built successfully.' });
        }
        resolve(output);
      });
    });
  });
}

/**
 * Removes a Docker image.
 * @param {string} imageId - The ID of the image to remove.
 */
async function removeImage(imageId) {
    try {
        const image = docker.getImage(imageId);
        await image.remove({ force: true });
    } catch (error) {
        logger.error(`Error removing image ${imageId}:`, error);
        if (error.statusCode === 404) {
            throw new Error(`Image ${imageId} not found.`);
        }
        if (error.statusCode === 409) {
            throw new Error(`Image ${imageId} is in use and cannot be removed.`);
        }
        throw new Error(`Failed to remove image ${imageId}.`);
    }
}

/**
 * Pauses a container.
 * @param {string} containerId - The ID of the container to pause.
 */
async function pauseContainer(containerId) {
    try {
        const container = docker.getContainer(containerId);
        await container.pause();
    } catch (error) {
        logger.error(`Error pausing container ${containerId}:`, error);
        throw new Error(`Failed to pause container ${containerId}.`);
    }
}

/**
 * Unpauses a container.
 * @param {string} containerId - The ID of the container to unpause.
 */
async function unpauseContainer(containerId) {
    try {
        const container = docker.getContainer(containerId);
        await container.unpause();
    } catch (error) {
        logger.error(`Error unpausing container ${containerId}:`, error);
        throw new Error(`Failed to unpause container ${containerId}.`);
    }
}
/**
 * Creates a new Docker network.
 * @param {Object} options - The network creation options (e.g., { Name: 'my-network', Driver: 'bridge' }).
 * @returns {Promise<Object>} The created network object.
 */
async function createNetwork(options) {
  try {
    const network = await docker.createNetwork(options);
    return network.inspect();
  } catch (error) {
    logger.error('Error creating network:', error);
    throw new Error('Failed to create Docker network.');
  }
}

/**
 * Inspects a Docker network.
 * @param {string} networkId - The ID of the network to inspect.
 * @returns {Promise<Object>} The network details.
 */
async function inspectNetwork(networkId) {
  try {
    const network = docker.getNetwork(networkId);
    return await network.inspect();
  } catch (error) {
    logger.error(`Error inspecting network ${networkId}:`, error);
    if (error.statusCode === 404) {
      throw new Error(`Network ${networkId} not found.`);
    }
    throw new Error(`Failed to inspect network ${networkId}.`);
  }
}

/**
 * Connects a container to a network.
 * @param {string} networkId - The ID of the network.
 * @param {string} containerId - The ID of the container to connect.
 */
async function connectContainerToNetwork(networkId, containerId) {
    try {
        const network = docker.getNetwork(networkId);
        await network.connect({ Container: containerId });
    } catch (error) {
        logger.error(`Error connecting container ${containerId} to network ${networkId}:`, error);
        if (error.statusCode === 404) {
            throw new Error(`Network or container not found.`);
        }
        throw new Error(`Failed to connect container to network.`);
    }
}

/**
 * Disconnects a container from a network.
 * @param {string} networkId - The ID of the network.
 * @param {string} containerId - The ID of the container to disconnect.
 */
async function disconnectContainerFromNetwork(networkId, containerId) {
    try {
        const network = docker.getNetwork(networkId);
        await network.disconnect({ Container: containerId });
    } catch (error) {
        logger.error(`Error disconnecting container ${containerId} from network ${networkId}:`, error);
        if (error.statusCode === 404) {
            throw new Error(`Network or container not found.`);
        }
        throw new Error(`Failed to disconnect container from network.`);
    }
}

/**
 * Removes a Docker network.
 * @param {string} networkId - The ID of the network to remove.
 */
async function removeNetwork(networkId) {
    try {
        const network = docker.getNetwork(networkId);
        await network.remove();
    } catch (error) {
        logger.error(`Error removing network ${networkId}:`, error);
        if (error.statusCode === 404) {
            throw new Error(`Network ${networkId} not found.`);
        }
        throw new Error(`Failed to remove network ${networkId}.`);
    }
}
module.exports = {
  listContainers,
  getContainer,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  createContainer,
  pullImage,
  streamLogs,
  executeCommand,
  listImages,
  buildImage,
  listNetworks,
  listVolumes,
  createVolume,
  removeVolume,
  removeImage,
  pauseContainer,
  unpauseContainer,
  createNetwork,
  inspectNetwork,
  connectContainerToNetwork,
  disconnectContainerFromNetwork,
  removeNetwork,
};