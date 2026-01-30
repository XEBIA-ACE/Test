#!/usr/bin/env python3
"""
Claude Code FastAPI Wrapper Service

⚠️  DEPRECATED: This FastAPI service is deprecated as of 2025-01-27.

The ACE-API-service now communicates directly with the Celery worker via Redis,
eliminating the need for this intermediate FastAPI layer.

MIGRATION STATUS:
- ACE-API now uses ClaudeCodeService (direct Celery task submission)
- Session management moved to ACE-API via ClaudeCodeSessionManager
- WebSocket support moved to ACE-API router
- This file is kept for backward compatibility and rollback purposes

NEW ARCHITECTURE:
  ACE-API → Celery (Redis) → claude-code-wrapper worker

OLD ARCHITECTURE (deprecated):
  ACE-API → HTTP → claude-code-wrapper FastAPI → Celery → worker

TO REMOVE THIS FILE:
1. Verify all clients use ACE-API endpoints instead of direct CCW calls
2. Remove main.py and src/cwapi/ directory
3. Update docker-compose to only run worker (no FastAPI)

ORIGINAL DESCRIPTION:
This service runs on the EC2 instance and provides:
1. Interactive project scaffolding with Claude Agent SDK
2. Session management with approval handling
3. WebSocket support for real-time updates
4. S3-based project file handling
5. REST API for scaffolding operations

This service should be deployed on the EC2 instance alongside Claude Agent SDK.
"""

# CRITICAL: Fix for Windows subprocess issue with Python 3.13+
# Must be set BEFORE any asyncio imports or operations
# Import the Windows fix module which auto-applies the fix
import sys

if sys.platform == "win32":
    # Import the fix module which sets the event loop policy
    from src.claude_code.windows_fix import apply_windows_event_loop_fix

    apply_windows_event_loop_fix()

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request, status

# Load environment variables from .env file
load_dotenv()
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.cwapi.routers.scaffold import router as scaffold_router
from src.claude_code.session import session_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def periodic_cleanup():
    """Periodic cleanup of old temporary files and sessions."""
    import shutil
    from datetime import datetime, UTC

    cleanup_interval = int(os.getenv("CLEANUP_INTERVAL", "3600"))  # 1 hour

    while True:
        try:
            await asyncio.sleep(cleanup_interval)

            temp_path = Path(os.getenv("EC2_TEMP_DIR", "/tmp/claude-scaffold"))
            if not temp_path.exists():
                continue

            current_time = datetime.now(UTC).timestamp()
            max_age = cleanup_interval * 2  # Keep files for 2 cleanup intervals

            cleaned_count = 0
            for item in temp_path.iterdir():
                if item.is_dir():
                    # Check if directory is older than max_age
                    item_age = current_time - item.stat().st_mtime
                    if item_age > max_age:
                        shutil.rmtree(item)
                        cleaned_count += 1
                        logger.info(f"Cleaned up old directory: {item}")

            # Also cleanup old sessions
            session_manager._cleanup_old_sessions()

            if cleaned_count > 0:
                logger.info(f"Periodic cleanup completed: {cleaned_count} directories removed")

        except Exception as e:
            logger.error(f"Periodic cleanup error: {str(e)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Claude Code Wrapper Service")

    # Create temp directory
    temp_dir = os.getenv("EC2_TEMP_DIR", "/tmp/claude-scaffold")
    os.makedirs(temp_dir, exist_ok=True)
    logger.info(f"Created temp directory: {temp_dir}")

    # Verify Claude API key (support both ANTHROPIC_API_KEY and CLAUDE_API_KEY)
    api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY")
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY or CLAUDE_API_KEY not set. Service will start but SDK operations will fail.")
    else:
        # Set ANTHROPIC_API_KEY for SDK if only CLAUDE_API_KEY is set
        if not os.getenv("ANTHROPIC_API_KEY") and os.getenv("CLAUDE_API_KEY"):
            os.environ["ANTHROPIC_API_KEY"] = os.getenv("CLAUDE_API_KEY")
        logger.info("Claude API key configured")

    # Test Claude Agent SDK availability
    try:
        from claude_agent_sdk import query

        logger.info("Claude Agent SDK is available")
    except ImportError:
        logger.error("Claude Agent SDK not available. Install with: pip install claude-agent-sdk")

    # Start periodic cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup())
    logger.info("Periodic cleanup task started")

    yield

    # Shutdown
    logger.info("Shutting down Claude Code Wrapper Service")
    # Cancel cleanup task
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    # Cleanup sessions
    for session_id in list(session_manager.sessions.keys()):
        session_manager.delete_session(session_id)


# Initialize FastAPI app
app = FastAPI(
    title="Claude Code Wrapper Service",
    description="Interactive project scaffolding with Claude Agent SDK",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    root_path="/claude-code-wrapper",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests for debugging."""
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    logger.debug(f"Content-Type: {request.headers.get('content-type', 'not set')}")

    # Store request body for error handling (only for POST/PUT/PATCH)
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body = await request.body()
            # Store in request state for exception handlers
            request.state.body = body

            # Recreate the request stream for downstream handlers
            async def receive():
                return {"type": "http.request", "body": body}

            request._receive = receive
        except Exception as e:
            logger.debug(f"Could not read request body in middleware: {e}")
            request.state.body = None

    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code}")
        return response
    except Exception as e:
        logger.error(f"Error processing request: {e}", exc_info=True)
        raise


# Register routers
app.include_router(scaffold_router)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors (including JSON decode errors)."""
    logger.error(f"Request validation error: {exc.errors()}")
    logger.error(f"Request path: {request.url.path}")
    logger.error(f"Request method: {request.method}")

    # Check if this is a JSON decode error
    errors = exc.errors()
    json_error = None
    for error in errors:
        if error.get("type") == "json_invalid":
            json_error = error
            break

    # Try to get the request body for debugging
    body_str = None
    try:
        # First try to get from request state (stored by middleware)
        if hasattr(request.state, "body") and request.state.body:
            body = request.state.body
        else:
            # Fallback to reading from request
            body = await request.body()

        if body:
            body_str = body.decode("utf-8", errors="ignore")
            logger.error(f"Request body length: {len(body_str)} characters")

            # If there's a JSON error with location info, show context around the error
            if json_error and "loc" in json_error:
                try:
                    # Try to extract position from location (could be tuple with position)
                    error_loc = json_error.get("loc")
                    if isinstance(error_loc, tuple) and len(error_loc) > 1:
                        error_pos = error_loc[1]
                        if isinstance(error_pos, int) and body_str:
                            start = max(0, error_pos - 100)
                            end = min(len(body_str), error_pos + 100)
                            context = body_str[start:end]
                            # Replace newlines with \n for better visibility
                            context_display = context.replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
                            logger.error(f"JSON error context (position {error_pos}): ...{context_display}...")
                            if error_pos < len(body_str):
                                char_at_pos = body_str[error_pos]
                                logger.error(
                                    f"Character at position {error_pos}: {repr(char_at_pos)} (ord: {ord(char_at_pos)})"
                                )
                                # Check for common control characters
                                if char_at_pos == "\n":
                                    logger.error(
                                        "Found unescaped newline character. It should be escaped as \\n in JSON."
                                    )
                                elif char_at_pos == "\r":
                                    logger.error(
                                        "Found unescaped carriage return. It should be escaped as \\r in JSON."
                                    )
                                elif ord(char_at_pos) < 32:  # Control character
                                    logger.error(
                                        f"Found control character (ASCII {ord(char_at_pos)}). Control characters must be escaped in JSON."
                                    )
                except Exception as e:
                    logger.error(f"Could not extract error context: {e}")

            # Log first 2000 chars at ERROR level for visibility
            logger.error(f"Request body (first 2000 chars): {body_str[:2000]}")
            if len(body_str) > 2000:
                logger.error(f"... (truncated, total length: {len(body_str)} characters)")
    except Exception as e:
        logger.error(f"Could not read request body: {e}")

    # Build helpful error message
    error_message = "Invalid request format. Please check your JSON payload and ensure all required fields are present."
    if json_error:
        ctx_error = json_error.get("ctx", {}).get("error", "")
        if "Invalid control character" in ctx_error:
            error_message = (
                "JSON decode error: Invalid control character detected. "
                "This usually means there are unescaped newlines or other control characters in your JSON string values. "
                "Make sure all string values in your JSON are properly escaped (e.g., use \\n for newlines)."
            )
        elif "Expecting" in ctx_error or "Unexpected" in ctx_error:
            error_message = f"JSON syntax error: {ctx_error}. Please check your JSON syntax."
        else:
            error_message = f"JSON decode error: {ctx_error}"

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Request validation error",
            "detail": exc.errors(),
            "message": error_message,
            "hint": "If your prompt contains newlines, make sure they are escaped as \\n in the JSON string value.",
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    logger.error(f"HTTP exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


@app.exception_handler(json.JSONDecodeError)
async def json_decode_exception_handler(request: Request, exc: json.JSONDecodeError):
    """Handle JSON decode errors."""
    logger.error(f"JSON decode error: {exc.msg} at line {exc.lineno}, column {exc.colno}")

    # Try to get the request body for debugging
    try:
        body = await request.body()
        if body:
            logger.debug(f"Request body (first 500 chars): {body[:500].decode('utf-8', errors='ignore')}")
    except Exception as e:
        logger.debug(f"Could not read request body: {e}")

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": "Invalid JSON format",
            "detail": f"JSON decode error: {exc.msg} at line {exc.lineno}, column {exc.colno}",
            "message": "The request body is not valid JSON. Please check your JSON syntax.",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "message": "An unexpected error occurred. Please check the server logs for details.",
        },
    )


@app.get("/health")
async def health_check():
    """
    Health check endpoint (compatibility with EC2 script).

    Returns the same format as the EC2 script for seamless replacement.
    """
    from datetime import datetime, UTC

    try:
        sdk_available = False
        try:
            from claude_agent_sdk import query

            sdk_available = True
        except ImportError:
            pass

        # Match EC2 script format exactly
        return {
            "status": "healthy",
            "timestamp": datetime.now(UTC).isoformat(),
            "sdk_available": sdk_available,
            "claude_cli_available": sdk_available,  # For compatibility
            "active_sessions": session_manager.get_active_sessions_count(),
            "total_sessions": len(session_manager.sessions),
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
        }


@app.get("/api/v1/status")
async def get_status():
    """
    Get service status and configuration.

    Note: For comprehensive system status, use GET /api/v1/scaffold/status
    """
    from datetime import datetime, UTC

    temp_dir = os.getenv("EC2_TEMP_DIR", "/tmp/claude-scaffold")
    max_file_size = int(os.getenv("MAX_FILE_SIZE", "104857600"))  # Default: 100MB

    sdk_available = False
    try:
        from claude_agent_sdk import query

        sdk_available = True
    except ImportError:
        pass

    return {
        "status": "running",
        "sdk_available": sdk_available,
        "temp_dir": temp_dir,
        "max_file_size": max_file_size,
        "active_sessions": session_manager.get_active_sessions_count(),
        "total_sessions": len(session_manager.sessions),
        "timestamp": datetime.now(UTC).isoformat(),
    }


if __name__ == "__main__":
    # Get configuration from environment
    host = os.getenv("EC2_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("EC2_SERVICE_PORT", "8080"))
    workers = int(os.getenv("EC2_SERVICE_WORKERS", "1"))

    logger.info(f"Starting Claude Code Wrapper Service on {host}:{port}")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        log_level="info",
        access_log=True,
    )
