# Claude Code Wrapper Service

Wrapper service for executing Claude Code with approval interception and environment setup.

<!-- AUTO-MANAGED: project-description -->
Integrates with Claude Agent SDK for:
- Project scaffolding and code generation execution
- User approval interception for dangerous tool operations
- Environment diagnostics (Node.js, API keys, working directory)
- Windows subprocess compatibility (Python 3.13+)
- Distributed execution via Celery workers (optional)
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: architecture -->
## Core Architecture

### Default Mode (In-Memory)
- `/src/claude_code/executor.py` - Main execution engine with approval handling
- `/src/claude_code/session.py` - In-memory session state management
- `/src/claude_code/windows_fix.py` - Windows event loop compatibility

### Celery Mode (Distributed)
Enable with `USE_CELERY=true` environment variable:
- `/src/claude_code/redis_session.py` - Redis-backed distributed session storage (TTL: 1hr running, 5min completed)
- `/src/celery_app.py` - Celery configuration with Redis broker/backend, task time limits (30min soft/40min hard), worker prefetch=1
- `/src/tasks/scaffold_tasks.py` - Celery task wrappers for scaffolding, async coroutine execution in worker context
- `/src/cwapi/routers/scaffold.py` - Dual-mode router with lazy imports, startup logging, USE_CELERY feature flag
- `/worker.py` - Celery worker entry point
- `/start_celery.py` - Convenience script for starting workers

### Execution Flow
1. Environment validation (Node.js, API keys, working directory)
2. SDK initialization with approval callback
3. Scaffolding loop with turn-by-turn approval checks
4. Result extraction from messages
5. **Post-completion tasks** (S3/cloud upload, GitHub push) - lines 354-363
6. **Session status update to COMPLETED** - line 365 (AFTER post-completion)
7. Environment cleanup

### Distributed Architecture (Celery Mode)
```
┌──────────────────────────────────────────────────────────────┐
│              FastAPI (Web Layer - scaffold.py)               │
│  POST /scaffold → Submit task to Celery queue (lazy import)  │
│  POST /scaffold-s3 → Submit S3 task to Celery                │
│  POST /scaffold-git → Submit Git clone task to Celery        │
│  GET /sessions/{id} → Read session from Redis                │
│  POST /sessions/{id}/approve → Update approval in Redis      │
│  WS /ws/{id} → Redis pub/sub bridge for real-time updates    │
│  Mode detection: USE_CELERY env var checked at startup       │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Redis (celery_app.py config)               │
│  • Celery broker + backend (cluster-compatible URL)          │
│  • Session state: claude_session:{id} (hash)                 │
│  • Pub/Sub: approval:{id} (for approval events)              │
│  • Pub/Sub: session_updates:{id} (for WebSocket bridge)      │
│  • Result expiration: 1 hour, worker prefetch: 1             │
└─────────────────────────┬────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Celery Worker 1 │ │ Celery Worker 2 │ │ Celery Worker 3 │
│ scaffold_tasks  │ │ scaffold_tasks  │ │ scaffold_tasks  │
│ (solo pool)     │ │ (solo pool)     │ │ (solo pool)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Docker Compose Architecture
- **redis**: Redis 7-alpine for Celery broker and session storage (port 6379)
  - Healthcheck: `redis-cli ping`
  - Volume: `redis_data` for persistence
- **claude-code-wrapper**: FastAPI service (port 8080) with USE_CELERY=true
  - Uses: `services/claude-code-wrapper/Dockerfile`
  - Build context: `../..` (monorepo root)
  - Exposes HTTP port, runs FastAPI with `CMD ["python", "main.py"]`
  - Environment: `USE_CELERY=true`, Redis URLs, `EC2_SERVICE_HOST=0.0.0.0`, `EC2_SERVICE_PORT=8080`
  - Healthcheck: HTTP probe on `localhost:8080/health`
  - Depends on: redis (healthy)
- **claude-code-wrapper-worker**: Dedicated Celery worker container
  - Uses: `services/claude-code-wrapper/Dockerfile` (shared base with command override)
  - Build context: `../..` (monorepo root)
  - Command override: `python start_celery.py`
  - No exposed ports (background worker)
  - Environment: Redis URLs, `CELERY_POOL=${CELERY_POOL:-prefork}`, `EC2_TEMP_DIR=/tmp/claude-scaffold`, `AWS_REGION=${AWS_REGION:-us-east-1}`
  - Healthcheck: `celery -A worker inspect ping -d celery@$HOSTNAME`
  - Depends on: redis (healthy)
  - Volume: `claude_temp` mounted at `/tmp/claude-scaffold` for artifact storage
  - Restart policy: unless-stopped
- **Dockerfile.worker**: Alternative worker-specific Dockerfile available
  - Optimized for worker-only deployment (no EXPOSE 8080)
  - Built-in CMD: `python start_celery.py`
  - Celery-specific healthcheck
  - Can replace main Dockerfile for worker service if preferred
- **Network**: Custom network `claude-code-wrapper-network` for service isolation

### WebSocket Redis Bridge (Celery Mode)
- **Problem**: WebSocket connections can't be shared across processes. In Celery mode, worker runs in separate process.
- **Solution**: Redis pub/sub bridges worker updates to FastAPI WebSocket handler
- **Channels**:
  - `session_updates:{id}` - Worker publishes messages, status changes, completion/error events
  - `approval:{id}` - Existing channel for approval request/response
- **Implementation**:
  - `redis_session.py`: `publish_session_update()` method broadcasts updates to channel
  - `scaffold_tasks.py`: Calls publish at key points (running, message, approval_required, completed, error)
  - `scaffold.py`: `_websocket_celery_mode()` subscribes to channel and forwards to WebSocket

### Session Status Flow (Celery Mode)
- **Initial status**: `pending` (set in `create_session()`) - task queued but not yet picked up
- **Running status**: `running` (set when worker starts) - task actively executing
- **Flow**: `pending` → `running` → `completed`/`error`/`cancelled`
- **Benefit**: Clients can distinguish between queued and actively running tasks

### Critical Race Condition Fix
- **Issue**: Session status was set to COMPLETED before `handle_post_completion()` ran, causing `github_url` to be null in polling responses
- **Fix**: Status now updated AFTER post-completion tasks finish (line 365)
- **Behavior**: Polling clients receive complete metadata (github_url, storage_url, s3_url, azure_url, gcs_url) when status becomes COMPLETED

### Event Loop Management (Celery Workers)
- **Issue**: Consecutive Celery tasks each create a new event loop. Cached Redis connections become stale (attached to closed loop).
- **Symptom**: `RuntimeError: Event loop is closed` or `Future attached to different loop` on second task execution
- **Fix**: `redis_session.py` tracks `_redis_loop` alongside `_redis`. In `_get_redis()`, compares current loop to cached loop. If different, closes stale connection and creates new one.
- **Location**: `redis_session.py` lines 74-96
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: conventions -->
## Code Conventions

### SDK Integration
- Optional dependency: Check `SDK_AVAILABLE` flag before using Claude Agent SDK
- Fallback error messaging: "Claude Agent SDK not available. Install with: pip install claude-agent-sdk"
- Message serialization: Use `model_dump()` → `dict()` → fallback to manual attribute extraction

### Approval Handling
- Dangerous tool detection: Check tool names for `["bash", "write", "edit", "delete", "rm"]`
- Approval requirement in message content blocks with `type == "tool_use"`
- Extract tool info: name, input dict, and id for approval request

### Environment Diagnostics
- **Windows-specific** (lines 226-239): Check event loop policy (`asyncio.get_event_loop_policy()`), Python version (`sys.version`), `PYTHONUNBUFFERED` env var
- **All platforms**: Verify Node.js availability (`node --version`), `ANTHROPIC_API_KEY` presence, working directory existence
- **Session metadata logging** (lines 246-253): Log metadata state at start - warn if None or empty, info if present
- **Logging**: All diagnostics logged at INFO level before SDK execution for debugging
- **Error capture**: Stderr from SDK execution captured via callback for enhanced error reporting
- **Purpose**: Troubleshoot Windows subprocess issues and environment setup problems

### Cloud Storage Configuration
- **Provider resolution logic** (`executor.py` line 505, commit ac518485):
  1. Request config `provider` field takes precedence if present
  2. Fall back to `CLOUD_STORAGE_PROVIDER` env var if config lacks provider
  3. Default to `s3` for backward compatibility if neither above
- **Backward compatibility** (lines 511-512): Legacy `upload_to_s3` config without provider field defaults to "s3"
- **Bucket/Key reuse**: Works for both S3 (bucket/key) and Azure (container/blob) with shared config interface
- **Unified URL handling**: Store as `storage_url` (provider-agnostic) plus provider-specific keys (`s3_url`, `azure_url`, `gcs_url`)
- **Multi-cloud support**: S3, Azure Blob, GCS with provider-specific credentials in config
- **Session cleanup**: Completed sessions retained for 5 min (300s) grace period to allow polling to complete

### Error Handling
- SDK-specific exceptions: `ProcessError`, `CLIConnectionError`, `ClaudeSDKError` (if available)
- Fallback error strings from stderr captured during execution
- Session status update on error with detailed error message
- Include environment diagnostics and working directory state in error context

### Celery Configuration (celery_app.py)
- **Redis URL handling**: Uses `get_cluster_compatible_redis_url()` from x_sdlc_core.utils.redis_utils with fallback (lines 17-22)
- **Broker retry settings**: max_retries=10, retry_delay=5s, max_delay=60s, backoff=2.0x, jitter enabled (lines 57-63)
- **Task settings**: acks_late=true, track_started=true, reject_on_worker_lost=true, max_retries=3, soft_time_limit=1800s (30min), time_limit=2400s (40min) (lines 66-76)
- **Worker settings**: prefetch_multiplier=1 (one task at a time), max_tasks_per_child=50, cancel_long_running_on_connection_loss=true (lines 78-82)
- **Result backend transport options**: socket_connect_timeout=5s, socket_timeout=5s, retry_on_timeout=true, health_check_interval=30s (lines 96-102)
- **Task queue**: Uses default 'celery' queue for simplicity (line 105)
- **Logging**: Custom log formats for worker and task execution, reduced verbosity for kombu/redis loggers (lines 115-123)
- **Recent updates (commit f8a1d94b)**: Celery mode support added to /scaffold-s3 endpoint with deferred S3 download to worker

### Request Metadata Handling
- **Metadata consolidation** (scaffold.py lines 152-167): Merges `request.metadata` dict with top-level fields (upload_to_s3, upload_to_cloud_storage, push_to_github, create_download)
- **Storage field aliases**: Both `upload_to_s3` (legacy) and `upload_to_cloud_storage` (newer multi-cloud) supported as top-level fields
- **Top-level field precedence**: Request-level fields override metadata dict values for storage/GitHub config
- **Metadata logging** (line 167): Log configured metadata keys at session start for debugging
- **Dual-mode consistency**: Same metadata dict passed to both Celery tasks (line 194) and in-memory sessions (line 214)

### Docker Image Design
- **Shared base pattern**: Main `Dockerfile` supports both API and worker deployments
  - Base layers: Python 3.11-slim, Node.js 20.x, system dependencies (gcc, git, curl)
  - Internal packages: x-sdlc-core, x-sdlc-observability installed from local paths
  - Application: Installs `.[all-cloud-storage]` with S3, Azure, GCS support
  - Default CMD: `python main.py` (FastAPI server)
  - Healthcheck: HTTP probe on localhost:8080/health
- **Worker-specific Dockerfile**: `Dockerfile.worker` optimized for worker-only deployment
  - Same base layers and dependencies as main Dockerfile
  - Removes EXPOSE 8080 (no HTTP port needed)
  - CMD: `python start_celery.py` (worker entry point)
  - Healthcheck: `celery -A worker inspect ping -d celery@$HOSTNAME` (Celery-native)
  - Use case: When deploying workers separately or optimizing image size
- **Command override pattern**: docker-compose uses `command:` to override Dockerfile CMD
  - Allows single Dockerfile to serve multiple roles
  - Worker service: `command: python start_celery.py` overrides default `python main.py`
  - Trade-off: Slightly larger image vs simplified build pipeline

### Code Quality
- **Formatting**: black (line-length 120), isort (black profile)
- **Type checking**: mypy with enhanced warnings (warn_return_any, warn_unused_configs, warn_redundant_casts, warn_unused_ignores, show_error_codes)
- **Linting**: ruff with comprehensive rules (E=pycodestyle, F=Pyflakes, I=isort, PL=Pylint, UP=pyupgrade, B=Bugbear, SIM=simplify)
- **Security scanning**: ruff with Bandit rules (S=Security) for SQL injection (S608), hardcoded credentials (S105/S106), subprocess safety (S603), insecure hashes (S324)
- **Ignored rules**: E501 (line too long), PLR0913 (too many arguments), PLR2004 (magic values), PLR0911/0912/0915 (complexity), PLW0603 (global statement), SIM108 (ternary operator)
- **Per-file ignores**: F401 in __init__.py, PLR2004/S101 in tests, E501 in migrations
- **Security commands**: `ruff check services/claude-code-wrapper/ --select=S` (all security), `ruff check . --select=S105,S106,S608` (HIGH severity only)
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: patterns -->
## Detected Patterns

### Windows Subprocess Fix
- Import `windows_fix` module at module load time (before asyncio)
- Apply fix in early module initialization for Python 3.13+ compatibility
- Fix sets event loop policy for Windows subprocess handling

### Message Extraction
- Convert SDK message objects to serializable dictionaries
- Extract content blocks as list of objects
- Fallback chain: `model_dump()` → `dict()` → manual attribute extraction

### Session Polling
- Async session loop with message accumulation
- Turn-based execution with approval checkpoint
- Result extraction from `ResultMessage` or final message content
- Session cleanup: Completed sessions held for 5 min (300s) grace period to allow long-running polls to complete

### Session Lifecycle Management
- `SessionManager` config: max_sessions=100, session_timeout=3600s (1 hour), grace_period=300s (5 min)
- Cleanup logic: Never cleanup sessions younger than 60s (startup protection)
- Status-based timeouts: Completed/error/cancelled use grace period (300s), running/waiting use full timeout (3600s)
- Multi-instance awareness: Log warnings when session not found (indicates Azure multi-container deployment)

### Celery Mode Execution Pattern
- **Lazy imports**: `get_redis_session_manager()` and `get_celery_tasks()` load dependencies only when USE_CELERY=true (lines 78-93)
- **Feature flag detection**: USE_CELERY env var checked at module load, supports "true"/"1"/"yes" values (line 71)
- **Startup logging**: Mode selection logged at router initialization with env var values and configuration tips (lines 96-107 in scaffold.py)
- **Metadata consolidation**: Request metadata merged with top-level fields before task submission (lines 152-167 for /scaffold, lines 382-398 for /scaffold-s3)
- **Task submission**: Creates Redis session first, then submits Celery task with consolidated metadata dict (lines 169-196 for /scaffold, lines 400-438 for /scaffold-s3)
- **S3 mode difference**: /scaffold-s3 in Celery mode defers S3 download to worker (working_directory set empty initially), worker sets path after download
- **Worker execution**: Celery task wraps async scaffolding logic using `run_async()` helper with new event loop per task

### Cloud Storage Upload Pipeline
- **Post-completion async task**: Provider resolved after scaffolding completes
- **Multi-provider support**: S3, GCS, Azure with unified config interface
- **Storage URL tracking**: Session metadata includes `storage_url` (unified) and provider-specific (`s3_url`, `azure_url`, `gcs_url`)
- **Session dict structure** (`session.py` lines 83-88): Returns all storage URLs in `to_dict()` for API responses
- **Provider resolution**: Config `provider` field takes precedence, env var `CLOUD_STORAGE_PROVIDER` as fallback
- **Backward compatibility**: Old `upload_to_s3` config without provider field defaults to "s3"

### WebSocket Dual-Mode Pattern
- **Mode detection**: `websocket_endpoint()` checks `USE_CELERY` flag and routes to appropriate handler
- **In-memory mode** (`_websocket_inmemory_mode()`): Direct session reference, approval via `asyncio.Event`
- **Celery mode** (`_websocket_celery_mode()`): Redis pub/sub subscription, approval via `set_approval_response()`
- **Concurrent tasks**: Forward Redis→WebSocket + Receive WebSocket→Redis run in parallel using `asyncio.wait()`
- **Graceful shutdown**: On completion/error event, forward task breaks loop, pending tasks cancelled

### Session Update Broadcasting
- **Method**: `publish_session_update(session_id, update_type, data)` in `redis_session.py`
- **Update types**: "status", "message", "approval_required", "completed", "error"
- **Payload format**: `{"type": update_type, "timestamp": iso_timestamp, "data": payload}`
- **Called from**: `scaffold_tasks.py` at status transitions and message additions
- **Recent addition (commit 49df1b9c)**: WebSocket Redis pub/sub bridge for Celery mode - worker publishes to `session_updates:{id}`, WebSocket handler subscribes and forwards to clients

### Docker Multi-Container Pattern
- **Shared base image approach**: Main `Dockerfile` serves dual purpose
  - API container: Uses default CMD `["python", "main.py"]`, exposes port 8080
  - Worker container: Overrides with `command: python start_celery.py`, no exposed ports
  - Both containers built from same image reduces build time and ensures consistency
- **Alternative worker Dockerfile**: `Dockerfile.worker` provides optimized worker-only build
  - Removes HTTP-specific configuration (no EXPOSE 8080)
  - Built-in CMD for worker: `["python", "start_celery.py"]`
  - Celery-specific healthcheck: `celery -A worker inspect ping`
  - Trade-off: Separate build vs smaller image size and clearer separation
- **docker-compose.yml conventions**:
  - Service-level: `services/claude-code-wrapper/docker-compose.yml` uses relative context `../..`
  - Root-level: `docker-compose.yml` uses context `.` (project root)
  - Both reference `dockerfile: services/claude-code-wrapper/Dockerfile` for now
  - Worker command override: `command: python start_celery.py` in service definition
<!-- END AUTO-MANAGED -->

<!-- AUTO-MANAGED: build-commands -->
## Build & Test Commands

```bash
# Install dependencies
pip install -e .

# Include SDK (required for execution)
pip install claude-agent-sdk

# Run tests
pytest tests/

# Format code
black src/
isort src/

# Linting (comprehensive rules: E, F, I, PL, UP, B, SIM)
ruff check src/

# Type checking (mypy with enhanced warnings)
mypy src/
```

### Celery Mode Commands

```bash
# Start Redis (required for Celery mode)
docker run -d -p 6379:6379 redis:latest

# Start single worker
python start_celery.py

# Start multiple workers for parallelism
python start_celery.py --workers 3

# Or manually with celery command:
# Linux
celery -A worker worker --loglevel=info --concurrency=2

# macOS (use solo pool)
celery -A worker worker --loglevel=info -P solo

# Start API with Celery mode enabled
USE_CELERY=true python main.py
```

### Docker Compose Deployment

```bash
# Start entire stack with Docker Compose (from project root)
docker compose up -d

# Start only claude-code-wrapper services (from service directory)
cd services/claude-code-wrapper
docker compose up -d

# View service logs
docker compose logs -f claude-code-wrapper
docker compose logs -f claude-code-wrapper-worker

# Rebuild specific service
docker compose build claude-code-wrapper-worker
docker compose up -d claude-code-wrapper-worker

# Service architecture:
# - claude-code-wrapper: FastAPI service (port 8080) with USE_CELERY=true
#   - Dockerfile: services/claude-code-wrapper/Dockerfile
#   - CMD: python main.py (default from Dockerfile)
# - claude-code-wrapper-worker: Celery worker
#   - Dockerfile: services/claude-code-wrapper/Dockerfile (same base)
#   - Command override: python start_celery.py
#   - Alternative: Can use Dockerfile.worker for optimized worker-only image
# - Shared volume: claude_temp mounted at /tmp/claude-scaffold
# - Worker healthcheck: celery -A worker inspect ping -d celery@$HOSTNAME
```
<!-- END AUTO-MANAGED -->

<!-- MANUAL: best-practices -->
## Best Practices

- Always run environment diagnostics before starting SDK execution
- Capture stderr output for better error messages in approval loops
- Keep approval UI responsive - show tool info (name, input) clearly
- Validate working directory exists before starting scaffolding
- Test Windows subprocess handling on Windows CI/CD runners
<!-- END MANUAL -->
