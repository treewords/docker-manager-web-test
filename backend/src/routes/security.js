const express = require('express');
const Docker = require('dockerode');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../config/logger');

const router = express.Router();
const docker = new Docker();

/**
 * GET /api/security/status
 * Returns security status based on read-only container inspection
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    const images = await docker.listImages({ all: false });

    const securityChecks = {
      totalContainers: containers.length,
      runningContainers: 0,
      issues: [],
      warnings: [],
      secure: 0,

      // Detailed counts
      privilegedContainers: 0,
      rootContainers: 0,
      publicPortContainers: 0,
      noHealthCheckContainers: 0,
      danglingImages: 0,
    };

    // Check each running container
    for (const containerInfo of containers) {
      if (containerInfo.State !== 'running') continue;

      securityChecks.runningContainers++;
      let containerSecure = true;

      try {
        const container = docker.getContainer(containerInfo.Id);
        const inspection = await container.inspect();
        const containerName =
          containerInfo.Names[0]?.substring(1) ||
          containerInfo.Id.substring(0, 12);

        // Check 1: Privileged mode
        if (inspection.HostConfig?.Privileged) {
          securityChecks.privilegedContainers++;
          securityChecks.issues.push({
            type: 'privileged',
            container: containerName,
            message: `Container '${containerName}' runs in privileged mode`,
          });
          containerSecure = false;
        }

        // Check 2: Running as root (User is empty or "0" or "root")
        const user = inspection.Config?.User || '';
        if (user === '' || user === '0' || user === 'root') {
          securityChecks.rootContainers++;
          securityChecks.warnings.push({
            type: 'root',
            container: containerName,
            message: `Container '${containerName}' runs as root`,
          });
        }

        // Check 3: Ports exposed on 0.0.0.0 (all interfaces)
        const portBindings = inspection.HostConfig?.PortBindings || {};
        for (const [port, bindings] of Object.entries(portBindings)) {
          if (bindings) {
            for (const binding of bindings) {
              if (binding.HostIp === '' || binding.HostIp === '0.0.0.0') {
                securityChecks.publicPortContainers++;
                securityChecks.warnings.push({
                  type: 'public_port',
                  container: containerName,
                  message: `Container '${containerName}' exposes port ${port} publicly`,
                });
                break;
              }
            }
          }
        }

        // Check 4: No health check defined
        if (
          !inspection.Config?.Healthcheck ||
          !inspection.Config.Healthcheck.Test
        ) {
          securityChecks.noHealthCheckContainers++;
          // This is informational, not a warning
        }

        if (containerSecure) {
          securityChecks.secure++;
        }
      } catch (inspectError) {
        logger.error(
          `Error inspecting container ${containerInfo.Id}:`,
          inspectError,
        );
      }
    }

    // Check for dangling images (no tags)
    for (const image of images) {
      if (
        !image.RepoTags ||
        image.RepoTags.length === 0 ||
        (image.RepoTags.length === 1 && image.RepoTags[0] === '<none>:<none>')
      ) {
        securityChecks.danglingImages++;
      }
    }

    // Calculate overall status
    const criticalIssues = securityChecks.privilegedContainers;
    const warningCount =
      securityChecks.rootContainers + securityChecks.publicPortContainers;

    let overallStatus = 'secure';
    let statusMessage = 'All security features active';

    if (criticalIssues > 0) {
      overallStatus = 'critical';
      statusMessage = `${criticalIssues} critical issue(s) detected`;
    } else if (warningCount > 0) {
      overallStatus = 'warning';
      statusMessage = `${warningCount} warning(s) detected`;
    }

    res.json({
      status: overallStatus,
      message: statusMessage,
      summary: {
        total: securityChecks.runningContainers,
        secure: securityChecks.secure,
        privileged: securityChecks.privilegedContainers,
        runningAsRoot: securityChecks.rootContainers,
        publicPorts: securityChecks.publicPortContainers,
        noHealthCheck: securityChecks.noHealthCheckContainers,
        danglingImages: securityChecks.danglingImages,
      },
      issues: securityChecks.issues,
      warnings: securityChecks.warnings,
    });
  } catch (error) {
    logger.error('Error checking security status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check security status',
      error: error.message,
    });
  }
});

module.exports = router;
