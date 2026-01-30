# Contributing to Integration Service

Thank you for considering contributing to Integration Service! This document outlines the process and guidelines for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Detailed steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Relevant logs or screenshots

### Suggesting Enhancements

For feature requests or enhancements:
- Check existing issues first
- Provide a clear use case
- Explain why this enhancement would be useful
- Consider implementation approach

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Run tests** and ensure they pass
6. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/integration-service.git
cd integration-service

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start development environment
docker-compose up -d
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict type checking
- Avoid `any` types when possible
- Use interfaces for contracts

### Code Style

- Follow existing code style
- Use Prettier for formatting: `npm run format`
- Use ESLint for linting: `npm run lint`
- Write meaningful variable and function names

### Comments

- Add JSDoc comments for public APIs
- Comment complex logic
- Keep comments up-to-date with code changes

### Git Commits

Use conventional commit messages:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(integration): add support for XML payloads

- Add XML parser for SOAP requests
- Update integration service to handle XML
- Add tests for XML processing

Closes #123
```

## Testing

### Writing Tests

- Write unit tests for business logic
- Write integration tests for API endpoints
- Aim for >70% code coverage
- Test both success and error cases

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage
```

## Project Structure

```
src/
├── api/                # API layer
├── application/        # Business logic
├── domain/            # Domain entities
├── infrastructure/    # External services
├── config/            # Configuration
└── utils/             # Utilities

tests/
├── unit/              # Unit tests
└── integration/       # Integration tests
```

## Architecture Principles

### Clean Architecture

- Keep layers independent
- Dependencies point inward
- Use dependency injection
- Follow SOLID principles

### Domain-Driven Design

- Model domain entities clearly
- Use ubiquitous language
- Separate domain from infrastructure

## Review Process

1. Automated checks must pass (tests, linting)
2. Code review by maintainers
3. Address review comments
4. Squash commits if needed
5. Merge to main branch

## Documentation

Update documentation for:
- New features or changes
- API endpoints
- Configuration options
- Architecture changes

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in pull request comments
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
