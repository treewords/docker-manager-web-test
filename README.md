# DockerMist

> A powerful, self-hosted Docker management dashboard with enterprise-grade security

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v14+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)

DockerMist transforms Docker container management into a streamlined, intuitive experience. Built for developers and small teams who need powerful orchestration without the complexity of enterprise platforms, it delivers production-ready container management through a beautiful web interface.

## ✨ Key Features

### Container Operations
- **Complete Lifecycle Control** - Start, stop, restart, and remove containers with single-click actions
- **Live Log Streaming** - Built-in terminal viewer with real-time container logs via WebSocket
- **Smart Container Creation** - Deploy from Docker Hub or private registries with intelligent configuration
- **Status Monitoring** - Real-time status tracking with uptime metrics and health indicators

### Image Management
- **Registry Integration** - Pull images from Docker Hub or private registries seamlessly
- **CI/CD Ready** - Build custom images directly from GitHub repositories (public and private)
- **Storage Optimization** - Identify and remove unused images to reclaim disk space
- **Version Control** - Track image versions and manage multiple tags effortlessly

### Security First
- **Automated VPS Hardening** - One-command script to secure your server, including SSH hardening, firewall configuration, and kernel tuning.
- **Intrusion Detection** - Pre-configured with OSSEC (Host-based IDS) and AIDE (file integrity monitoring).
- **Intrusion Prevention** - Fail2Ban is set up with advanced rules to block malicious IPs targeting SSH, Nginx, and web vulnerabilities (XSS, SQLi).
- **JWT Authentication** - Industry-standard token-based authentication with secure session management.
- **Encrypted Secrets** - AES-256 encryption for sensitive data like GitHub tokens at rest.
- **SSL/TLS Ready** - Hardened Nginx configuration with Let's Encrypt for A+ grade SSL.

### Developer Experience
- **Responsive Design** - Manage your infrastructure from desktop, tablet, or mobile
- **Modern UI** - Clean, intuitive interface built with React and TailwindCSS
- **API Documentation** - Interactive Swagger UI for endpoint exploration and testing
- **Volume Management** - Create and delete persistent storage volumes with ease

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│   React + Vite  │────────▶│  Node.js API     │
│   Frontend      │  HTTPS  │  Express Server  │
│   (Static)      │         │                  │
│                 │         │                  │
└─────────────────┘         └────────┬─────────┘
                                     │
                            Unix Socket (secure)
                                     │
                            ┌────────▼─────────┐
                            │                  │
                            │  Docker Engine   │
                            │                  │
                            └──────────────────┘
```

**Technology Stack**

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, xterm.js |
| Backend | Node.js, Express, Socket.io, Dockerode |
| Security | JWT, bcrypt, crypto, Fail2Ban, OSSEC, AIDE, UFW |
| Infrastructure | Docker, Docker Compose, Nginx, Certbot |
| Documentation | Swagger/OpenAPI 3.0 |

## 🚀 Getting Started

### 1. Production Deployment (Recommended)

For production, the best and most secure method is to use the automated setup script on a fresh Ubuntu 22.04 server.

#### Automated VPS Setup

This script handles all security hardening, dependency installation, and configuration for you.

```bash
# On your Ubuntu 22.04 VPS as root
wget https://raw.githubusercontent.com/your-username/dockermist/main/vps_setup.sh
chmod +x vps_setup.sh
./vps_setup.sh
```

**The script automatically:**
- ✅ Creates a non-root user with SSH key authentication
- ✅ Hardens SSH, kernel, and system settings
- ✅ Configures UFW firewall with rate limiting
- ✅ Installs Docker, Docker Compose, Nginx, Certbot
- ✅ Sets up Fail2Ban with advanced XSS/SQLi protection
- ✅ Installs AIDE and OSSEC for intrusion detection
- ✅ Enables automatic security updates
- ✅ Deploys the Nginx reverse proxy with a hardened SSL/TLS configuration

After running the script, follow the on-screen instructions to log in as the new user and deploy the application.

### 2. Local Development

For local testing and development on your machine.

#### Prerequisites

- **Docker** & **Docker Compose**
- **Node.js** (v14+) & **npm**
- **Git**

#### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/dockermist.git
cd dockermist

# 2. Set up and start the backend
cd backend
npm install
cp .env.example .env

# CRITICAL: Edit .env and set secure secrets
# - JWT_SECRET: openssl rand -base64 32
# - ENCRYPTION_SECRET: openssl rand -base64 32
# - UID: id -u
# - GID: id -g
# - DOCKER_GID: getent group docker | cut -d: -f3
nano .env

# Start the backend
docker-compose up --build

# 3. Set up and start the frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```

**Access the dashboard:** http://localhost:3001
**Default credentials:** `admin` / `changeme` (⚠️ Change immediately)

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Deployment Guide](./DEPLOYMENT.md) | Manual deployment and custom setups |
| [Security Guide](./SECURITY.md) | In-depth look at the security features |
| [Operations Guide](./OPERATIONS.md) | Backups, monitoring, and maintenance tasks |
| [Testing Guide](./TESTING.md) | API testing with curl and integration tests |
| [API Documentation](http://localhost:3000/api-docs) | Interactive Swagger UI (when backend is running) |

## 🔒 Security

DockerMist is built with a defense-in-depth approach. The automated `vps_setup.sh` script configures the following security layers:

**Host Security:**
- **OSSEC:** Host-based Intrusion Detection System for real-time log analysis and threat detection.
- **AIDE:** File integrity monitoring to detect unauthorized changes to critical system files.
- **Fail2Ban:** Protects against brute-force attacks on SSH and web-based attacks (XSS, SQLi) on Nginx.
- **UFW Firewall:** Configured with rate limiting to block unauthorized access.
- **Kernel Hardening:** `sysctl` settings are tuned to protect against common network attacks like IP spoofing and SYN floods.
- **SSH Hardening:** Disables password authentication and root login, enforcing key-based access.
- **Automatic Updates:** `unattended-upgrades` is configured to apply security patches automatically.

**Application Security:**
- **JWT Authentication:** Secure, token-based authentication.
- **Encrypted Secrets:** Sensitive data like GitHub tokens are encrypted at rest using AES-256.
- **CORS Protection:** Whitelists your frontend domain to prevent unauthorized API access.
- **Nginx Reverse Proxy:** All traffic is routed through a hardened Nginx proxy with A+ grade SSL/TLS.
- **Security Headers:** Implements HSTS, CSP, and other headers to protect against browser-based attacks.

**Container Security:**
- **Docker Socket Protection:** The application communicates with the Docker engine via a local Unix socket. Access is granted by adding the container's user to the host's `docker` group, avoiding the need to run the container as root.
- **Non-Root Container:** The backend container runs as a non-root user (`appuser`), reducing the attack surface.
- **Principle of Least Privilege:** The container is configured with the minimal necessary permissions to perform its tasks.

⚠️ **Critical:** The Docker socket grants root-equivalent access to the host. Ensure that only trusted users are added to the `docker` group on the host machine.

## 🧪 Testing

The project includes an integration test script to verify core functionality.

```bash
# 1. Make sure the backend is running
cd backend
sudo -E node src/app.js

# 2. In another terminal, run the test script
chmod +x test_integration.sh
./test_integration.sh
```

For more detailed API testing examples, see [TESTING.md](./TESTING.md).

## 🤝 Contributing

Contributions are welcome! Please fork the repository, create a feature branch, and open a pull request. See our contributing guidelines for more details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2023-2025 DockerMist Contributors
