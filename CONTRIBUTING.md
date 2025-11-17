# Contributing to Docker Manager Dashboard

Thank you for your interest in contributing to Docker Manager Dashboard! This document provides guidelines and instructions for contributing to this project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/docker-manager-web-test.git`
3. Add upstream remote: `git remote add upstream https://github.com/treewords/docker-manager-web-test.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites
- Node.js >= 20.19.0
- npm >= 10.0.0
- Docker >= 20.10.0
- Docker Compose >= 2.0.0

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Using Docker
```bash
# Build and run all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## How to Contribute

### Types of Contributions

1. **Bug Fixes**: Fix issues reported in the issue tracker
2. **Features**: Implement new functionality
3. **Documentation**: Improve or add documentation
4. **Tests**: Add or improve test coverage
5. **Refactoring**: Improve code quality without changing functionality

## Coding Standards

### Backend (Node.js/Express)
- Follow ESLint configuration in `.eslintrc.json`
- Use Prettier for code formatting
- Write meaningful variable and function names
- Add JSDoc comments for complex functions
- Keep functions small and focused

```javascript
// Good
async function getUserById(userId) {
  // Implementation
}

// Bad
async function get(id) {
  // Implementation
}
```

### Frontend (React/Vite)
- Use functional components with hooks
- Follow React best practices
- Use meaningful component names
- Keep components small and reusable
- Use proper prop-types or TypeScript

```jsx
// Good
function UserProfile({ user, onUpdate }) {
  // Implementation
}

// Bad
function Component1({ data, fn }) {
  // Implementation
}
```

### General Guidelines
- Write self-documenting code
- Add comments for complex logic
- Follow the Single Responsibility Principle
- Use consistent naming conventions
- Avoid code duplication

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples
```bash
feat(auth): add JWT token refresh functionality

fix(docker): resolve container restart issue on network failure

docs(readme): update installation instructions

refactor(api): simplify error handling middleware
```

## Pull Request Process

1. **Update Your Branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run Tests**
   ```bash
   # Backend
   cd backend && npm run lint && npm run prettier

   # Frontend
   cd frontend && npm run build
   ```

3. **Push Changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Use the pull request template
   - Provide a clear description
   - Link related issues
   - Add screenshots if applicable
   - Ensure all checks pass

5. **Code Review**
   - Address review comments
   - Keep the PR focused and small
   - Be responsive to feedback

6. **Merge**
   - PRs require at least one approval
   - All CI checks must pass
   - Maintainers will merge approved PRs

## Reporting Bugs

Use the [Bug Report](https://github.com/treewords/docker-manager-web-test/issues/new?template=bug_report.md) template and include:

- Clear and descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots or logs
- Possible solution (if you have one)

## Suggesting Enhancements

Use the [Feature Request](https://github.com/treewords/docker-manager-web-test/issues/new?template=feature_request.md) template and include:

- Clear and descriptive title
- Problem you're trying to solve
- Proposed solution
- Alternative solutions considered
- Additional context

## Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
./scripts/test_integration.sh
```

## Documentation

- Update README.md for user-facing changes
- Update relevant documentation in `/docs`
- Add JSDoc comments for new functions
- Update API documentation in `/backend/docs/openapi.yaml`

## Questions?

Feel free to:
- Open an issue with the `question` label
- Start a discussion in GitHub Discussions
- Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see [LICENSE](LICENSE)).

---

Thank you for contributing! 🎉
