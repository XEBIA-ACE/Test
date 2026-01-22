# Configuration Repository Example

This directory contains example configuration files that should be stored in a separate Git repository.

## Repository Structure

```
config-repo/
├── application.yml              # Default config for all applications
├── application-dev.yml          # Dev environment defaults
├── application-staging.yml      # Staging environment defaults
├── application-prod.yml         # Production environment defaults
├── myapp/
│   ├── application.yml          # myapp default config
│   ├── application-dev.yml      # myapp dev config
│   └── application-prod.yml     # myapp prod config
└── another-service/
    └── application.yml
```

## Setup Instructions

1. Create a new Git repository:
   ```bash
   git init config-repo
   cd config-repo
   ```

2. Copy example files from this directory

3. Commit and push to your Git hosting service:
   ```bash
   git add .
   git commit -m "Initial configuration"
   git remote add origin https://github.com/your-org/config-repo.git
   git push -u origin main
   ```

4. Update Config Service environment variables:
   ```bash
   export GIT_REPO_URI=https://github.com/your-org/config-repo.git
   export GIT_USERNAME=your-username
   export GIT_PASSWORD=your-token
   ```

## Configuration Priority

Configuration is resolved in the following order (highest to lowest priority):

1. `{application}/{application}-{profile}.yml`
2. `{application}/application.yml`
3. `application-{profile}.yml`
4. `application.yml`

## Best Practices

- Use environment-specific profiles (dev, staging, prod)
- Store sensitive values encrypted: `{cipher}encrypted_value`
- Keep default values in `application.yml`
- Override with environment-specific values in `application-{profile}.yml`
- Version control all configuration changes
- Use meaningful commit messages
- Implement configuration change approval process for production
