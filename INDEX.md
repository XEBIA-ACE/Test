# Authentication Service - File Index

## 📁 Project Files (54 total)

### 📋 Documentation (7 files)
- `README.md` - Complete setup and usage guide
- `ARCHITECTURE.md` - Architecture and design documentation
- `QUICKSTART.md` - 5-minute quick start guide
- `PROJECT_STRUCTURE.md` - Project organization
- `SUMMARY.md` - Implementation summary
- `CHANGELOG.md` - Version history
- `INDEX.md` - This file (file directory)

### ☕ Java Source Files (28 files)

#### Application Entry Point
- `AuthenticationServiceApplication.java` - Main application class

#### API Layer (10 files)
**Controllers (2)**
- `AuthController.java` - Authentication endpoints
- `HealthController.java` - Health check endpoint

**DTOs (6)**
- `LoginRequest.java` - Login request
- `RegisterRequest.java` - Registration request
- `RefreshTokenRequest.java` - Token refresh request
- `AuthResponse.java` - Authentication response
- `UserResponse.java` - User information response
- `ErrorResponse.java` - Error response

**Exception Handlers (1)**
- `GlobalExceptionHandler.java` - Global exception handling

#### Domain Layer (11 files)
**Models (3)**
- `User.java` - User entity
- `Session.java` - Session entity
- `RefreshToken.java` - Refresh token entity

**Services (4)**
- `AuthenticationService.java` - Main authentication logic
- `JwtService.java` - JWT token management
- `RefreshTokenService.java` - Refresh token management
- `KeycloakService.java` - Keycloak integration

**Exceptions (4)**
- `AuthenticationException.java` - Authentication failures
- `UserAlreadyExistsException.java` - User conflict
- `TokenRefreshException.java` - Token refresh failures
- `KeycloakException.java` - Keycloak errors

#### Infrastructure Layer (7 files)
**Configuration (4)**
- `SecurityConfig.java` - Spring Security configuration
- `RedisConfig.java` - Redis configuration
- `OpenApiConfig.java` - Swagger/OpenAPI configuration
- `CorsProperties.java` - CORS properties

**Repositories (3)**
- `UserRepository.java` - User data access
- `SessionRepository.java` - Session data access
- `RefreshTokenRepository.java` - Refresh token data access

**Security (1)**
- `JwtAuthenticationFilter.java` - JWT authentication filter

### 🧪 Test Files (4 files)
- `AuthenticationServiceApplicationTests.java` - Context tests
- `AuthControllerTest.java` - Controller integration tests
- `JwtServiceTest.java` - JWT service unit tests
- `UserRepositoryTest.java` - Repository integration tests

### ⚙️ Configuration Files (8 files)
**Application Configuration (4)**
- `application.yml` - Main configuration
- `application-dev.yml` - Development profile
- `application-prod.yml` - Production profile
- `application-test.yml` - Test profile

**Logging Configuration (1)**
- `logback-spring.xml` - Logging configuration

**Build Configuration (1)**
- `pom.xml` - Maven dependencies and build

**Environment (1)**
- `.env.example` - Environment variables template

**Ignore Files (1)**
- `.gitignore` - Git ignore patterns

### 🐳 Docker Files (4 files)
- `Dockerfile` - Application container definition
- `docker-compose.yml` - Development stack
- `.dockerignore` - Docker build exclusions
- `LICENSE` - MIT License

### 📜 Scripts (3 files)
- `setup-keycloak.sh` - Keycloak configuration script
- `test-api.sh` - API testing script
- `start-dev.sh` - Development environment startup

## 📊 Statistics

### Code Distribution
```
Java Source Files:    28 (52%)
Test Files:           4  (7%)
Configuration:        8  (15%)
Documentation:        7  (13%)
Docker/Build:         4  (7%)
Scripts:              3  (6%)
────────────────────────────
Total:                54 (100%)
```

### Lines of Code (Estimated)
```
Java Source:      ~2,800 lines
Java Tests:       ~500 lines
Configuration:    ~400 lines
Documentation:    ~2,500 lines
Scripts:          ~200 lines
────────────────────────────
Total:            ~6,400 lines
```

### Package Structure
```
com.authservice/
├── api/                    (10 files)
│   ├── controller/         (2 files)
│   ├── dto/                (6 files)
│   └── exception/          (1 file)
├── domain/                 (11 files)
│   ├── model/              (3 files)
│   ├── service/            (4 files)
│   └── exception/          (4 files)
└── infrastructure/         (7 files)
    ├── config/             (4 files)
    ├── repository/         (3 files)
    └── security/           (1 file)
```

## 🔍 Quick File Finder

### Need to...

**Configure the application?**
→ `src/main/resources/application.yml`

**Set environment variables?**
→ `.env.example`

**Understand the architecture?**
→ `ARCHITECTURE.md`

**Get started quickly?**
→ `QUICKSTART.md`

**Add a new REST endpoint?**
→ `src/main/java/com/authservice/api/controller/`

**Add business logic?**
→ `src/main/java/com/authservice/domain/service/`

**Change security settings?**
→ `src/main/java/com/authservice/infrastructure/config/SecurityConfig.java`

**Configure Redis?**
→ `src/main/java/com/authservice/infrastructure/config/RedisConfig.java`

**Deploy with Docker?**
→ `docker-compose.yml` and `Dockerfile`

**Run tests?**
→ `src/test/java/com/authservice/`

**Check API documentation?**
→ Start app and visit `/swagger-ui.html`

## 📝 File Naming Conventions

### Java Classes
- Controllers: `*Controller.java`
- Services: `*Service.java`
- Repositories: `*Repository.java`
- Models/Entities: `*.java` (noun)
- DTOs: `*Request.java`, `*Response.java`
- Exceptions: `*Exception.java`
- Configuration: `*Config.java`, `*Properties.java`
- Tests: `*Test.java`

### Configuration Files
- Main config: `application.yml`
- Profile configs: `application-{profile}.yml`
- Build: `pom.xml`

### Documentation
- Main docs: UPPERCASE.md (README.md, ARCHITECTURE.md)
- Supporting docs: descriptive names

## 🎯 Key Entry Points

### Application Startup
```
AuthenticationServiceApplication.java → main()
```

### API Requests
```
HTTP Request
  ↓
JwtAuthenticationFilter (if protected)
  ↓
AuthController
  ↓
AuthenticationService
  ↓
Repository/External Service
```

### Configuration Loading
```
application.yml (base)
  ↓
application-{profile}.yml (profile-specific)
  ↓
Environment Variables (override)
```

## 🚀 Important Files for Getting Started

1. **QUICKSTART.md** - Start here for setup
2. **README.md** - Comprehensive documentation
3. **docker-compose.yml** - Run everything with one command
4. **.env.example** - Configuration template
5. **scripts/setup-keycloak.sh** - Automated Keycloak setup

## 📦 Dependencies Summary

### Main Dependencies (in pom.xml)
- Spring Boot Starter Web
- Spring Boot Starter Security
- Spring Boot Starter Data Redis
- Spring Session Data Redis
- Keycloak Spring Boot Starter
- JJWT (JWT library)
- SpringDoc OpenAPI (Swagger)
- Lombok
- Jackson
- Micrometer Prometheus

### Test Dependencies
- Spring Boot Starter Test
- Spring Security Test
- Testcontainers

## 🔗 Related Files

### Authentication Flow
1. `AuthController.java` - Entry point
2. `AuthenticationService.java` - Business logic
3. `KeycloakService.java` - External auth
4. `JwtService.java` - Token generation
5. `SessionRepository.java` - Session storage

### Security Configuration
1. `SecurityConfig.java` - Main security config
2. `JwtAuthenticationFilter.java` - Token validation
3. `application.yml` - Security properties

### Docker Deployment
1. `Dockerfile` - Image definition
2. `docker-compose.yml` - Stack definition
3. `.dockerignore` - Build exclusions

---

**Total Files Created: 54**

All files are organized following Clean Architecture principles with clear separation between API, Domain, and Infrastructure layers.
