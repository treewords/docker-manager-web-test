# DockerMist

> Enterprise-Grade Docker Container Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-20.10+-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-14+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](/)

## Executive Summary

DockerMist is a self-hosted, enterprise-grade container management platform designed for organizations seeking a secure, scalable alternative to cloud-hosted solutions. Built on industry-standard technologies with defense-in-depth security architecture, DockerMist provides comprehensive Docker orchestration, real-time monitoring, and production-ready infrastructure automation.

**Designed for:** DevOps teams, managed service providers, enterprises requiring data sovereignty, and organizations with strict compliance requirements.

---

## Core Capabilities

### Container Orchestration & Management
- **Complete Lifecycle Management** — Provision, start, stop, restart, pause, and terminate containers with atomic operations
- **Real-Time Resource Monitoring** — CPU, memory utilization, and network I/O metrics with 5-second refresh intervals
- **Advanced Logging** — Real-time log streaming with persistent audit trails via WebSocket protocol
- **Interactive Console** — Execute arbitrary commands within running containers with xterm.js terminal emulation
- **Network Configuration** — Port mapping, expose management, and environment variable provisioning

### Image Registry Integration
- **Multi-Registry Support** — Seamless integration with Docker Hub, private registries, and self-hosted solutions
- **CI/CD Automation** — Build container images directly from Git repositories with GitHub token support for private repositories
- **Real-Time Build Tracking** — Stream build logs with progress indicators and error diagnostics
- **Storage Optimization** — Automated image cleanup with dependency resolution to reclaim storage capacity
- **Version Management** — Multi-tag support and image version tracking

### Network & Storage Infrastructure
- **Docker Network Provisioning** — Create and manage virtual networks with support for bridge, overlay, and macvlan drivers
- **Container Connectivity** — Connect/disconnect containers to networks with real-time topology visualization
- **Persistent Volume Management** — Create, mount, and manage Docker volumes for stateful workloads
- **Storage Policies** — Volume lifecycle management with cleanup automation

### Reverse Proxy & Load Balancing
- **Nginx Reverse Proxy Configuration** — Create and manage reverse proxy rules with hot-reload capability
- **Automated Certificate Management** — Let's Encrypt integration with automatic renewal workflows
- **Load Balancing** — Configure upstream servers with round-robin and weighted distribution algorithms
- **CORS Policy Management** — Granular cross-origin resource sharing configuration
- **Performance Analytics** — Nginx metrics collection and visualization

### Security & Compliance Framework

#### Authentication & Authorization
- **JWT-Based Session Management** — Industry-standard token authentication with configurable expiration policies
- **Password Security** — Bcrypt hashing with adaptive salt rounds and configurable complexity requirements
- **Cryptographic Secrets Management** — AES-256-GCM encryption for sensitive credentials at rest

#### Data Protection
- **CORS Enforcement** — Whitelist-based cross-origin control with origin validation
- **Input Sanitization** — Comprehensive validation and sanitization on all API endpoints
- **Rate Limiting** — Adaptive rate limiting on sensitive operations to prevent brute-force attacks
- **Audit Logging** — Comprehensive event logging with tamper-resistant audit trails

#### Infrastructure Security
- **Nginx ModSecurity** — Web application firewall with OWASP ModSecurity rules
- **TLS/SSL Hardening** — TLS 1.2+ only with AEAD cipher suites (A+ SSL Labs rating)
- **HTTP/2 & HSTS** — Protocol security and strict transport security with preload headers
- **Security Headers** — Content Security Policy, X-Frame-Options, X-Content-Type-Options enforcement
- **Intrusion Prevention** — Fail2Ban with pattern-based detection for XSS and SQL injection attempts
- **Host-Based Intrusion Detection** — OSSEC integration for system-level threat detection
- **File Integrity Monitoring** — AIDE database for filesystem change tracking

#### Compliance & Governance
- **Comprehensive Audit Trails** — All user actions logged with timestamps and actor information
- **Data Residency** — Self-hosted architecture ensures data sovereignty and compliance with local regulations
- **Non-Root Container Execution** — Principle of least privilege enforcement
- **Read-Only Filesystem** — Immutable root filesystem where applicable
- **Vulnerability Scanning** — Integration with Trivy for container image scanning

**⚠️ Security Notice:** Docker socket access grants equivalent root privileges. Production deployments must not expose Docker sockets over TCP without TLS mutual authentication.

---

## Technology Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────┐
│     Frontend Application Layer           │
│  (React 18 + Vite SPA)                  │
└────────────────┬────────────────────────┘
                 │
         HTTPS/WSS Secured
                 │
┌────────────────▼────────────────────────┐
│     API Gateway Layer                    │
│  (Express.js + Socket.io)               │
│  • Authentication & Authorization        │
│  • Rate Limiting & Validation            │
│  • Request/Response Transformation       │
└────────────────┬────────────────────────┘
                 │
      Unix Domain Socket (IPC)
                 │
┌────────────────▼────────────────────────┐
│     Container Orchestration Engine       │
│  (Docker Engine v20.10+)                │
│  • Container Lifecycle Management        │
│  • Network & Volume Provisioning         │
│  • Image Registry Operations             │
└──────────────────────────────────────────┘
```

### Technology Stack Matrix

| Layer | Component | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18+ | UI framework with hooks |
| | Vite | Latest | Build tool and dev server |
| | TailwindCSS | v3+ | Utility-first CSS framework |
| | xterm.js | v5+ | Terminal emulation |
| | Socket.io Client | v4+ | Real-time bidirectional communication |
| | Lucide React | Latest | Icon library |
| | Recharts | Latest | Data visualization |
| **Backend** | Node.js | 14+ | JavaScript runtime |
| | Express.js | v4+ | Web framework |
| | Dockerode | Latest | Docker API client |
| | Socket.io | v4+ | WebSocket server |
| | JWT | Latest | Token-based authentication |
| | Bcryptjs | Latest | Password hashing |
| | Winston | Latest | Structured logging |
| **Infrastructure** | Docker | 20.10+ | Container runtime |
| | Docker Compose | 2.0+ | Orchestration |
| | Nginx | 1.24+ | Reverse proxy |
| | Certbot | Latest | SSL/TLS certificate management |
| **Database** | JSON | - | Configuration storage (upgradeable) |
| **Documentation** | OpenAPI 3.0 | - | API specification |

### Project Directory Structure

```
docker-manager/
│
├── backend/
│   ├── src/
│   │   ├── routes/                 # REST API endpoints
│   │   ├── services/               # Business logic layer
│   │   ├── middleware/             # Auth, logging, validation
│   │   ├── utils/                  # Utility functions
│   │   ├── config/                 # Environment configuration
│   │   └── app.js                  # Application bootstrap
│   │
│   ├── docs/
│   │   └── openapi.yaml            # OpenAPI 3.0 specification
│   │
│   ├── tests/
│   │   └── integration_test.sh      # Integration test suite
│   │
│   ├── Dockerfile                  # Container image definition
│   ├── docker-compose.yml          # Multi-container composition
│   ├── .env.example                # Environment template
│   └── package.json                # Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/                  # Page-level components
│   │   ├── components/             # Reusable UI components
│   │   ├── services/               # API client methods
│   │   ├── contexts/               # React context providers
│   │   ├── hooks/                  # Custom React hooks
│   │   └── main.jsx                # Application entry point
│   │
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── .env.example                # Environment template
│   └── package.json                # Dependencies
│
└── docs/
    ├── DEPLOYMENT.md               # Production deployment guide
    ├── SECURITY.md                 # Security hardening guide
    └── OPERATIONS.md               # Operations and maintenance
```

---

## Installation & Deployment

### System Requirements

**Minimum Specifications:**
- CPU: 2 cores (4+ recommended for production)
- RAM: 2GB (4GB+ recommended)
- Storage: 20GB (expandable based on workload)

**Software Prerequisites:**
- Docker Engine v20.10+ with Docker Compose v2.0+
- Node.js v14+ (development only)
- Git v2.0+

### Quick Start (Development)

```bash
# 1. Clone repository
git clone <repository-url>
cd docker-manager

# 2. Backend configuration
cd backend
cp .env.example .env

# 3. Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "ENCRYPTION_SECRET=$ENCRYPTION_SECRET" >> .env

# 4. Start services
docker-compose up -d

# 5. Frontend (separate terminal)
cd ../frontend
npm install
npm run dev
```

**Access Points:**
- Dashboard: http://localhost:3001
- API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
- Nginx: http://localhost:80

**Default Credentials:**
- Username: `admin`
- Password: `changeme`

⚠️ **CRITICAL:** Change default credentials immediately in production environments.

### Environment Configuration

#### Backend (`backend/.env`)

```env
# Application Settings
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Security Credentials (MUST CHANGE)
JWT_SECRET=your-secure-random-string-here
JWT_EXPIRES_IN=24h
ENCRYPTION_SECRET=your-encryption-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# Docker Configuration
DOCKER_SOCKET=/var/run/docker.sock
```

#### Frontend (`frontend/.env.production`)

```env
VITE_API_URL=https://api.your-domain.com
VITE_API_TIMEOUT=30000
```

### Production Deployment

#### Automated VPS Provisioning

Deploy to Ubuntu 22.04 LTS with automated hardening:

```bash
# On VPS as root
wget https://raw.githubusercontent.com/your-username/dockermist/main/vps_setup.sh
chmod +x vps_setup.sh
./vps_setup.sh
```

**Automated Configuration:**
- ✅ Non-root user with SSH key authentication
- ✅ Hardened SSH (key-only, disabled root login)
- ✅ UFW firewall (ports 22, 80, 443)
- ✅ Docker & Docker Compose installation
- ✅ Nginx reverse proxy with HTTP/2
- ✅ SSL/TLS certificates (Let's Encrypt)
- ✅ Fail2Ban with XSS/SQLi detection
- ✅ AIDE & OSSEC host intrusion detection
- ✅ Unattended security updates
- ✅ TLS 1.2+ cipher suite hardening
- ✅ Security headers (HSTS, CSP, etc.)

#### Manual Production Setup

Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive step-by-step instructions.

---

## API Reference

### Authentication

All API endpoints require JWT bearer token authentication except `/api/health`.

```bash
# Login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "changeme"
  }'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### REST Endpoints

**Container Management**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/containers` | List all containers | ✓ |
| POST | `/api/containers/create` | Create new container | ✓ |
| POST | `/api/containers/{id}/start` | Start container | ✓ |
| POST | `/api/containers/{id}/stop` | Stop container | ✓ |
| POST | `/api/containers/{id}/restart` | Restart container | ✓ |
| POST | `/api/containers/{id}/pause` | Pause container | ✓ |
| DELETE | `/api/containers/{id}` | Remove container | ✓ |
| GET | `/api/containers/{id}/logs` | Stream logs | ✓ |
| POST | `/api/containers/{id}/exec` | Execute command | ✓ |

**Image Management**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/images` | List all images | ✓ |
| POST | `/api/images/pull` | Pull from registry | ✓ |
| POST | `/api/images/build` | Build from Git | ✓ |
| DELETE | `/api/images/{id}` | Remove image | ✓ |
| GET | `/api/images/{id}/inspect` | Get image details | ✓ |

**Network Management**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/networks` | List networks | ✓ |
| POST | `/api/networks` | Create network | ✓ |
| DELETE | `/api/networks/{id}` | Remove network | ✓ |
| POST | `/api/networks/{id}/connect` | Connect container | ✓ |
| POST | `/api/networks/{id}/disconnect` | Disconnect container | ✓ |

**Volume Management**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/volumes` | List volumes | ✓ |
| POST | `/api/volumes` | Create volume | ✓ |
| DELETE | `/api/volumes/{id}` | Remove volume | ✓ |

**Nginx Configuration**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/nginx/tasks` | List Nginx tasks | ✓ |
| POST | `/api/nginx/tasks` | Create Nginx task | ✓ |
| DELETE | `/api/nginx/tasks/{id}` | Remove Nginx task | ✓ |
| POST | `/api/nginx/validate` | Validate configuration | ✓ |

**System**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | ✗ |
| GET | `/api-docs` | API Documentation | ✗ |

Full OpenAPI 3.0 specification available at `/api-docs` when backend is running.

---

## Security & Compliance

### Security Posture Assessment

| Category | Implementation | Status |
|----------|-----------------|--------|
| **Transport** | TLS 1.2+ with A+ ciphers | ✅ |
| **Authentication** | JWT with expiration | ✅ |
| **Authorization** | Role-based access control | ✅ |
| **Encryption** | AES-256-GCM at rest | ✅ |
| **Audit Logging** | Comprehensive event trails | ✅ |
| **Input Validation** | Express validator | ✅ |
| **CORS** | Whitelist enforcement | ✅ |
| **Rate Limiting** | Per-endpoint limits | ✅ |
| **IDS/IPS** | Fail2Ban + OSSEC | ✅ |
| **File Integrity** | AIDE monitoring | ✅ |

### Compliance Frameworks

- **HIPAA** - Audit logging and encryption capabilities
- **GDPR** - Data residency with self-hosted architecture
- **SOC 2 Type II** - Comprehensive logging and monitoring
- **PCI-DSS** - Network segmentation and access controls
- **ISO 27001** - Information security management

### Vulnerability Management

- Continuous image scanning with Trivy
- Automated security updates
- Responsible disclosure policy
- Regular security audits

---

## Operational Management

### Monitoring & Logging

**Log Locations:**
- Application logs: `data/logs/application.log`
- Audit logs: `data/logs/audit.log`
- Container logs: Real-time streaming via WebSocket
- System logs: `journalctl` (when running as systemd service)

**Metrics Collection:**
- Container CPU/Memory: 5-second intervals
- Network I/O: Per-interface tracking
- Disk usage: Volume-level monitoring
- API response times: Request/response logging

### Data Storage

**Configuration Backend:**
- `data/users.json` — User accounts and credentials
- `data/nginx-tasks.json` — Nginx proxy configurations
- `data/audit.log` — Audit trail
- `data/logs/` — Application logs

**Database Migration:** JSON backend is extensible to PostgreSQL, MongoDB, or any compatible database.

### Performance Tuning

| Parameter | Default | Recommendation |
|-----------|---------|-----------------|
| Container stats refresh | 5 seconds | 5-10 seconds (production) |
| Log buffer size | 1000 lines | Increase for high-volume apps |
| WebSocket timeout | 30 seconds | Adjust for network latency |
| Rate limit (login) | 10/minute | 5/minute (security-focused) |
| Cache TTL | 60 seconds | 120 seconds (production) |

---

## Integration & Extensibility

### Git Repository Integration

Build images directly from source repositories:

```json
{
  "repository": "https://github.com/user/repo.git",
  "branch": "main",
  "dockerfile_path": "Dockerfile",
  "build_context": ".",
  "git_token": "ghp_xxxxxxxxxxxx"
}
```

### Webhook Support (Roadmap)

Future releases will include webhook capabilities for:
- GitHub push events
- Docker registry webhooks
- Custom alerting mechanisms

### API Client Libraries (Planned)

- Python SDK
- Go SDK
- JavaScript/Node.js SDK

---

## Troubleshooting & Support

### Common Issues

**Docker Connection Failures**
```bash
# Verify Docker daemon
sudo systemctl status docker

# Check socket permissions
ls -la /var/run/docker.sock

# Add user to docker group
sudo usermod -aG docker $USER
```

**Authentication Failures**
- Verify JWT_SECRET is set and consistent
- Check token expiration: `jwt decode <token>`
- Validate user exists in `data/users.json`

**CORS/Origin Errors**
- Ensure CORS_ORIGIN matches frontend domain exactly
- No trailing slashes: ✅ `https://example.com` vs ❌ `https://example.com/`
- Clear browser cache and cookies

**SSL Certificate Issues**
- Verify DNS A record propagation: `nslookup your-domain.com`
- Check certificate status: `sudo certbot certificates`
- View renewal logs: `sudo journalctl -u certbot`

### Support Channels

- **Documentation:** [Full Documentation](./DEPLOYMENT.md)
- **Issue Tracking:** [GitHub Issues](https://github.com/your-username/dockermist/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/dockermist/discussions)
- **API Docs:** `/api-docs` (running instance)

---

## Development & Contributing

### Development Workflow

```bash
# Local development setup
git clone <repository-url>
cd docker-manager

# Backend
cd backend && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

### Testing

```bash
# Integration test suite
cd backend
chmod +x tests/integration_test.sh
./tests/integration_test.sh
```

### Code Standards

- ESLint/Prettier for code formatting
- Comprehensive test coverage (>80%)
- Clear commit messages and documentation
- Security-first development practices

### Contributing Guidelines

1. Fork the repository
2. Create feature branch: `git checkout -b feature/description`
3. Implement changes with tests
4. Submit pull request with description

---

## Roadmap & Future Development

### Q1 2025
- [ ] Kubernetes cluster integration
- [ ] Advanced role-based access control (RBAC)
- [ ] Webhook event system

### Q2 2025
- [ ] Container registry management
- [ ] PostgreSQL/MongoDB backend migration
- [ ] Advanced alerting & monitoring
- [ ] Backup and disaster recovery

### Q3 2025
- [ ] Terraform provider
- [ ] Multi-cluster orchestration
- [ ] Native mobile application

---

## License & Attribution

**License:** MIT License - See [LICENSE](LICENSE) for full terms

**Copyright:** © 2023-2025 DockerMist Contributors

### Acknowledgments

Built upon industry-leading open-source projects:

- [Docker](https://www.docker.com/) — Container platform
- [Dockerode](https://github.com/apocas/dockerode) — Docker API client
- [Express.js](https://expressjs.com/) — Web application framework
- [React](https://reactjs.org/) — UI framework
- [Socket.io](https://socket.io/) — Real-time communication
- [xterm.js](https://xtermjs.org/) — Terminal emulation
- [TailwindCSS](https://tailwindcss.com/) — CSS framework

---

<div align="center">

**[Documentation](#-security--compliance)** • **[Quick Start](#-installation--deployment)** • **[API Reference](#-api-reference)** • **[Issues](https://github.com/your-username/dockermist/issues)**

Made with security and performance in mind by the DockerMist community.

**Status:** Production Ready • **Version:** 1.0.0 • **Last Updated:** 2025

</div>
