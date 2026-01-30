"""
Claude Code Wrapper Service - API Module.

⚠️  DEPRECATED: This module is deprecated as of 2025-01-27.

The ACE-API-service now communicates directly with the Celery worker via Redis,
eliminating the need for this FastAPI layer.

Files in this module:
- routers/scaffold.py - HTTP endpoints (replaced by ACE-API claude_code_router.py)
- models.py - Pydantic models (replaced by ACE-API shared models)

See services/ACE-API-service/src/api/routers/claude_code_router.py for the new implementation.
See services/ACE-API-service/src/application/services/claude_code_service.py for Celery task submission.
"""
