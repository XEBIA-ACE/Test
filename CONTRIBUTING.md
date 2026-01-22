# Contributing to Configuration Service

Thank you for your interest in contributing to the Configuration Service!

## Development Setup

1. Fork and clone the repository
2. Install prerequisites:
   - Java 17+
   - Maven 3.6+
   - Docker and Docker Compose

3. Build the project:
   ```bash
   mvn clean install
   ```

4. Run tests:
   ```bash
   mvn test
   ```

## Code Style

- Follow Java coding conventions
- Use 4 spaces for indentation
- Maximum line length: 120 characters
- Use meaningful variable and method names
- Add JavaDoc comments for public methods and classes

## Testing

- Write unit tests for all new functionality
- Maintain test coverage above 80%
- Write integration tests for API endpoints
- Use descriptive test method names: `methodName_condition_expectedResult`

Example:
```java
@Test
void checkHealth_withValidConfig_returnsHealthyStatus() {
    // Test implementation
}
```

## Submitting Changes

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Add tests for new functionality
4. Ensure all tests pass: `mvn test`
5. Commit with descriptive messages
6. Push to your fork
7. Submit a pull request

## Pull Request Guidelines

- Include a clear description of the changes
- Reference any related issues
- Ensure CI builds pass
- Request review from maintainers
- Update documentation if needed

## Questions?

Open an issue for any questions or concerns.
