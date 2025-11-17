# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Reorganized repository structure for better professionalism
- Added comprehensive documentation in `/docs` directory
- Created GitHub workflows for CI/CD pipeline
- Added issue templates for bug reports and feature requests
- Added pull request template
- Created CONTRIBUTING.md with contribution guidelines
- Created CODE_OF_CONDUCT.md
- Added root-level docker-compose.yml for orchestration
- Added Dockerfile for frontend
- Created `/scripts` directory for deployment and testing scripts
- Created `/public` directory for static assets
- Added security scanning with Trivy in CI pipeline

### Changed
- Moved documentation files (DEPLOYMENT.md, OPERATIONS.md, SECURITY.md, TESTING.md) to `/docs`
- Moved scripts (test_integration.sh, vps_setup.sh) to `/scripts`
- Moved landing.html to `/public`
- Updated repository structure to follow industry best practices

### Documentation
- Improved README.md with updated structure and badges
- Added comprehensive API documentation
- Enhanced deployment documentation
- Added security guidelines

## [1.0.0] - Previous Release

### Added
- Docker Manager Dashboard web interface
- Real-time container monitoring
- Container management (start, stop, restart, remove)
- Container logs viewing
- Container shell access
- User authentication with JWT
- Role-based access control
- RESTful API backend with Express.js
- React frontend with Vite
- Docker API integration
- WebSocket support for real-time updates
- Nginx service management
- Task queue system
- SQLite database for data persistence

### Security
- JWT-based authentication
- Bcrypt password hashing
- Rate limiting
- Input validation
- CORS configuration
- Security headers
- Docker socket access control

---

## Release Notes Format

### Types of changes
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes

[unreleased]: https://github.com/treewords/docker-manager-web-test/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/treewords/docker-manager-web-test/releases/tag/v1.0.0
