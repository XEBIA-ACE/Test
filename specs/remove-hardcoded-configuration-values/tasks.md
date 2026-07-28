# TASKS: Remove Hardcoded Configuration Values

## Prerequisites
N/A — not applicable to this task

## Phase 1 — Preparation
- [S] Audit configuration files in the repository to identify hardcoded values.

## Phase 2 — Core Upgrade
- [M] Extract hardcoded database connection strings from DatabaseConnector.java and add to config.properties.
- [M] Refactor API endpoint URLs hardcoded in ApiService.java to be retrieved from config.properties.
- [S] Extract logging level settings from LoggerInitializer.java and move to config.properties.

## Phase 3 — Testing & Validation
- [S] Update and run unit tests for DatabaseConnector to utilize new config properties.
- [S] Validate ApiService behavior using integration tests after configuration extraction.
- [S] Verify logging level changes through existing test cases after refactoring LoggerInitializer.

## Phase 4 — CI/CD & Infrastructure
- [XS] Update CI pipeline to ensure config.properties file is correctly loaded in test and production environments.

## Phase 5 — Documentation & Rollout
- [XS] Update documentation to reflect configuration changes, emphasizing the new config.properties usage.
- [XS] Conduct a code review of the changes to hardcoded configurations.
- [S] Monitor application for any configuration-related issues during initial rollout.