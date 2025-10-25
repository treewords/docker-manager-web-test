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
- **JWT Authentication** - Industry-standard token-based authentication with secure session management
- **Encrypted Secrets** - AES-256 encryption for sensitive data like GitHub tokens at rest
- **CORS Protection** - Granular cross-origin control to prevent unauthorized API access
- **Audit Logging** - Comprehensive activity logs for security compliance and forensics
- **Fail2Ban Integration** - Automated intrusion prevention with IP banning
- **SSL/TLS Ready** - One-command HTTPS setup with Let's Encrypt

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
| Security | JWT, bcrypt, crypto, Fail2Ban, OSSEC |
| Infrastructure | Docker, Docker Compose, Nginx, Certbot |
| Documentation | Swagger/OpenAPI 3.0 |

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **Node.js** (v14+) and **npm** (v6+)
- **Git** for repository management

### Local Development

Get DockerMist running on your machine in under 2 minutes:

```bash
# Clone the repository
git clone https://github.com/your-username/dockermist.git
cd dockermist

# Backend setup
cd backend
npm install
cp .env.example .env

# CRITICAL: Edit .env and set secure secrets
# - JWT_SECRET: openssl rand -base64 32
# - ENCRYPTION_SECRET: openssl rand -base64 32
nano .env

# Start the backend (requires Docker socket access)
sudo npm start

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

**Access the dashboard:** http://localhost:3001

**Default credentials:** `admin` / `changeme` (⚠️ Change immediately)

## 📦 Production Deployment

DockerMist uses a split architecture optimized for production:
- **Backend:** Dockerized API on a Linux VPS
- **Frontend:** Static build on any hosting (cPanel, Netlify, Vercel)

### Automated VPS Setup

We provide a comprehensive automation script that handles everything:

```bash
# On your Ubuntu 22.04 VPS as root
wget https://raw.githubusercontent.com/your-username/dockermist/main/vps_setup.sh
chmod +x vps_setup.sh
./vps_setup.sh
```

**The script automatically:**
- ✅ Creates a non-root user with SSH key authentication
- ✅ Hardens SSH (disables root login and password auth)
- ✅ Configures UFW firewall (ports 22, 80, 443)
- ✅ Installs Docker, Docker Compose, Nginx, Certbot
- ✅ Sets up Fail2Ban with advanced XSS/SQLi protection
- ✅ Installs AIDE and OSSEC for intrusion detection
- ✅ Enables automatic security updates
- ✅ Configures Nginx reverse proxy with HTTP/2
- ✅ Generates free SSL certificate via Let's Encrypt
- ✅ Applies hardened SSL/TLS settings (TLSv1.2+)
- ✅ Adds security headers (HSTS, CSP, X-Frame-Options)

### Manual Deployment

For manual setup or customization, see our comprehensive guides:

- **[Deployment Guide](./DEPLOYMENT.md)** - Step-by-step production setup
- **[Security Checklist](./SECURITY.md)** - Essential hardening steps
- **[Advanced Security](./ADVANCED_SECURITY.md)** - Enterprise-grade protection
- **[Operations Guide](./OPERATIONS.md)** - Backups, monitoring, maintenance

### Environment Configuration

**Backend** (`backend/.env`):
```bash
# Application
NODE_ENV=production
PORT=3000

# Security (CHANGE THESE!)
JWT_SECRET=your-secure-random-secret-here
ENCRYPTION_SECRET=your-encryption-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password

# CORS (must match frontend domain exactly)
CORS_ORIGIN=https://your-domain.com
```

**Frontend** (`frontend/.env.production`):
```bash
VITE_API_URL=https://api.your-domain.com
```

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Testing Guide](./TESTING.md) | API testing with curl and integration tests |
| [API Documentation](http://localhost:3000/api-docs) | Interactive Swagger UI (when backend is running) |
| [Operations Guide](./OPERATIONS.md) | Fail2Ban setup, backups, monitoring |
| [Security Guide](./SECURITY.md) | Essential security checklist |
| [Advanced Security](./ADVANCED_SECURITY.md) | HIDS, rate limiting, 2FA, vulnerability scanning |

## 🎯 Usage

### Managing Containers

1. **Dashboard** - View running containers, system stats, and quick actions
2. **Containers Page** - Detailed list with status, ports, and lifecycle controls
3. **Create Container** - Deploy new containers with custom configuration
4. **Live Logs** - Click any container to view real-time logs in the built-in terminal

### Managing Images

1. **Pull Images** - Fetch from Docker Hub or private registries
2. **Build Images** - Compile from your GitHub repositories (requires PAT)
3. **Image Cleanup** - Remove unused images to free disk space

### Managing Volumes

1. **Create Volumes** - Provision persistent storage for containers
2. **Delete Volumes** - Clean up unused volumes safely

### User Settings

Configure your GitHub Personal Access Token (PAT) to enable building images from private repositories.

## 🔒 Security Features

DockerMist implements defense-in-depth security:

**Application Layer:**
- JWT-based authentication with token expiration
- Password hashing with bcrypt (10 salt rounds)
- Encrypted secret storage (AES-256-CBC)
- CORS protection with whitelist validation
- Rate limiting on sensitive endpoints
- Comprehensive audit logging

**Infrastructure Layer:**
- Nginx reverse proxy with ModSecurity support
- SSL/TLS with strong cipher suites (A+ rating)
- HTTP/2 and HSTS preloading
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- Fail2Ban with XSS/SQLi pattern detection
- OSSEC host-based intrusion detection
- AIDE file integrity monitoring

**Container Security:**
- Non-root user in Docker container
- Read-only root filesystem (where possible)
- Minimal base image (Alpine Linux)
- Regular vulnerability scanning with Trivy
- Controlled Docker socket access

⚠️ **Critical:** The Docker socket grants root-equivalent access. Never expose it over TCP without TLS.

## 📊 API Endpoints

All API endpoints are documented with Swagger UI at `/api-docs`. Key endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/health` | Health check (no auth) |
| GET | `/api/containers` | List all containers |
| POST | `/api/containers/create` | Create new container |
| POST | `/api/containers/:id/start` | Start container |
| POST | `/api/containers/:id/stop` | Stop container |
| DELETE | `/api/containers/:id` | Remove container |
| GET | `/api/images` | List all images |
| POST | `/api/images/pull` | Pull image from registry |
| POST | `/api/images/build` | Build image from GitHub |
| DELETE | `/api/images/:id` | Remove image |
| GET | `/api/volumes` | List all volumes |
| POST | `/api/volumes/create` | Create volume |

## 🧪 Testing

Run the comprehensive integration test suite:

```bash
# Backend must be running
cd backend
sudo npm start

# In another terminal, run tests
cd backend
chmod +x tests/integration_test.sh
./tests/integration_test.sh
```

For API testing examples, see [TESTING.md](./TESTING.md).

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

**Development Standards:**
- Follow existing code style (ESLint/Prettier)
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Verify `CORS_ORIGIN` in backend `.env` matches frontend domain exactly
- No trailing slashes: ✅ `https://example.com` ❌ `https://example.com/`

**Docker Socket Permission Denied:**
- Add user to docker group: `sudo usermod -aG docker $USER`
- Log out and back in for changes to take effect

**404 on Frontend Routes:**
- Add `.htaccess` file for client-side routing (cPanel)
- Configure rewrite rules for your hosting platform

**SSL Certificate Errors:**
- Ensure DNS A record points to your VPS IP
- Wait 2-5 minutes after DNS changes for propagation
- Check Certbot logs: `sudo journalctl -u certbot`

For more troubleshooting, see our [documentation](#-documentation) or open an issue.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2023-2025 DockerMist Contributors

## 🙏 Acknowledgments

Built with these excellent open-source projects:
- [Docker](https://www.docker.com/) - Container platform
- [Dockerode](https://github.com/apocas/dockerode) - Docker API client
- [Express](https://expressjs.com/) - Web framework
- [React](https://reactjs.org/) - UI library
- [Socket.io](https://socket.io/) - Real-time communication
- [xterm.js](https://xtermjs.org/) - Terminal emulator
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

## 📬 Support

- **Issues:** [GitHub Issues](https://github.com/your-username/dockermist/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/dockermist/discussions)
- **Documentation:** [Full Documentation](./DEPLOYMENT.md)

---

<div align="center">

**[Documentation](#-documentation)** • **[Quick Start](#-quick-start)** • **[Security](#-security-features)** • **[Contributing](#-contributing)**

Made with ❤️ by the DockerMist community

</div>
