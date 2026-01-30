"""
Scaffold Router - REST and WebSocket endpoints for Claude Code scaffolding.

Supports two modes:
- In-memory mode (default): Uses asyncio.create_task() for single-process execution
- Celery mode (USE_CELERY=true): Uses Celery tasks for distributed execution across workers

Set USE_CELERY=true environment variable to enable distributed mode.
"""

# CRITICAL: Fix for Windows subprocess issue with Python 3.13+
# Must be set BEFORE any asyncio imports or SDK imports
# Import the Windows fix module which auto-applies the fix
import sys

if sys.platform == "win32":
    from ...claude_code.windows_fix import apply_windows_event_loop_fix

    apply_windows_event_loop_fix()

import asyncio
import json
import logging
import os
import shutil
import tarfile
import uuid
import zipfile
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, Any, Optional

import boto3
from fastapi import APIRouter, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse

from ..models import (
    ScaffoldRequest,
    ScaffoldResponse,
    ScaffoldS3Request,
    ScaffoldGitRequest,
    ApprovalResponse,
    SessionStatusResponse,
    SessionMessagesResponse,
    OneOffRequest,
    OneOffResponse,
    CleanupRequest,
    FileUploadResponse,
    S3DownloadResponse,
    SystemStatusResponse,
    # Compatibility models
    CLIExecutionRequest,
    CLIExecutionResponse,
    S3CLIExecutionRequest,
    GitCLIExecutionRequest,
)
from ...claude_code.executor import run_scaffolding
from ...claude_code.git_utils import (
    clone_git_repo,
    get_repo_name_from_url,
)
from ...claude_code.session import SessionStatus, session_manager
from ...claude_code.system_utils import (
    check_disk_space,
    ensure_sufficient_disk_space,
    check_system_tools,
)

logger = logging.getLogger(__name__)

# Celery mode flag - set USE_CELERY=true to enable distributed execution
USE_CELERY = os.getenv("USE_CELERY", "false").lower() in ("true", "1", "yes")

# Lazy imports for Celery mode
_redis_session_manager = None
_celery_tasks = None


def get_redis_session_manager():
    """Get Redis session manager (lazy import for Celery mode)."""
    global _redis_session_manager
    if _redis_session_manager is None:
        from ...claude_code.redis_session import get_redis_session_manager as get_manager
        _redis_session_manager = get_manager()
    return _redis_session_manager


def get_celery_tasks():
    """Get Celery tasks (lazy import for Celery mode)."""
    global _celery_tasks
    if _celery_tasks is None:
        from ...tasks import scaffold_tasks
        _celery_tasks = scaffold_tasks
    return _celery_tasks


if USE_CELERY:
    logger.info("=" * 60)
    logger.info("🚀 Celery mode ENABLED - using Redis sessions and Celery tasks")
    logger.info(f"   USE_CELERY env = '{os.getenv('USE_CELERY')}'")
    logger.info(f"   REDIS_URL = '{os.getenv('REDIS_URL', 'redis://localhost:6379/0')}'")
    logger.info("=" * 60)
else:
    logger.info("=" * 60)
    logger.info("⚡ Celery mode DISABLED - using in-memory sessions")
    logger.info(f"   USE_CELERY env = '{os.getenv('USE_CELERY', 'not set')}'")
    logger.info("   Set USE_CELERY=true to enable distributed mode")
    logger.info("=" * 60)

router = APIRouter(prefix="/api/v1", tags=["scaffold"])

# Configuration
TEMP_DIR = os.getenv("EC2_TEMP_DIR", "/tmp/claude-scaffold")
# Default to 100MB (104857600 bytes)
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "104857600"))
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY") or os.getenv("CLAUDE_API_KEY", "")

# Initialize S3 client
s3_client = boto3.client("s3", region_name=AWS_REGION)


@router.post("/scaffold", response_model=ScaffoldResponse)
async def start_scaffolding(request: ScaffoldRequest):
    """
    Start a new scaffolding session.

    In Celery mode (USE_CELERY=true):
        - Creates session in Redis
        - Submits task to Celery queue
        - Returns immediately

    In default mode:
        - Creates session in memory
        - Starts asyncio task
        - Returns immediately

    Args:
        request: Scaffolding request

    Returns:
        ScaffoldResponse with session_id
    """
    session_id = request.session_id or str(uuid.uuid4())

    try:
        # Create working directory if it doesn't exist
        working_dir = Path(request.working_directory).resolve()
        working_dir.mkdir(parents=True, exist_ok=True)

        # Build metadata dict
        metadata = {}
        if hasattr(request, 'metadata') and request.metadata:
            metadata.update(request.metadata)

        # Override with top-level fields (these take precedence)
        if request.upload_to_s3:
            metadata["upload_to_s3"] = request.upload_to_s3
        if hasattr(request, 'upload_to_cloud_storage') and request.upload_to_cloud_storage:
            metadata["upload_to_cloud_storage"] = request.upload_to_cloud_storage
        if request.push_to_github:
            metadata["push_to_github"] = request.push_to_github
        if request.create_download:
            metadata["create_download"] = True
            metadata["download_format"] = "zip"

        logger.info(f"Session {session_id} metadata configured with keys: {list(metadata.keys())}")

        if USE_CELERY:
            # Celery mode: Use Redis sessions and Celery tasks
            logger.info(f"Session {session_id} - Using CELERY mode")
            redis_manager = get_redis_session_manager()
            celery_tasks = get_celery_tasks()

            # Create session in Redis
            logger.info(f"Session {session_id} - Creating session in Redis")
            await redis_manager.create_session(
                session_id=session_id,
                working_directory=str(working_dir),
                prompt=request.prompt,
                metadata=metadata,
            )
            logger.info(f"Session {session_id} - Redis session created")

            # Submit Celery task
            logger.info(f"Session {session_id} - Submitting to Celery queue")
            task_result = celery_tasks.run_scaffolding_task.delay(
                session_id=session_id,
                prompt=request.prompt,
                working_directory=str(working_dir),
                allowed_tools=request.allowed_tools,
                max_turns=request.max_turns,
                model=request.model,
                metadata=metadata,
            )
            logger.info(f"Session {session_id} - Submitted to Celery, task_id={task_result.id}")

            # Link celery_task_id to session for debugging/correlation
            await redis_manager.update_session(session_id, celery_task_id=task_result.id)

            return ScaffoldResponse(
                session_id=session_id,
                status="running",
                message="Scaffolding started (Celery). Poll /sessions/{id} for status",
            )
        else:
            # Default mode: Use in-memory sessions and asyncio tasks
            session = session_manager.create_session(
                session_id=session_id,
                working_directory=str(working_dir),
                prompt=request.prompt,
            )

            # Store metadata in session
            if not hasattr(session, 'metadata') or session.metadata is None:
                session.metadata = {}
            session.metadata.update(metadata)

            logger.info(f"Session {session_id} metadata content: {session.metadata}")

            # Start scaffolding in background
            asyncio.create_task(
                run_scaffolding(
                    session=session,
                    prompt=request.prompt,
                    working_directory=str(working_dir),
                    allowed_tools=request.allowed_tools,
                    max_turns=request.max_turns,
                    model=request.model,
                )
            )

            return ScaffoldResponse(
                session_id=session_id,
                status=session.status.value,
                message="Scaffolding started. Connect via WebSocket or poll /sessions/{id}",
            )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to start scaffolding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start scaffolding: {str(e)}")


@router.post("/scaffold-git", response_model=ScaffoldResponse)
async def start_scaffolding_git(request: ScaffoldGitRequest):
    """
    Start a new scaffolding session with Git repository.

    Args:
        request: Scaffolding request with Git URL

    Returns:
        ScaffoldResponse with session_id
    """
    session_id = request.session_id or str(uuid.uuid4())

    try:
        # Validate Git URL
        if not (
                request.git_url.startswith("https://")
                or request.git_url.startswith("git@")
                or request.git_url.startswith("ssh://")
        ):
            raise HTTPException(
                status_code=400,
                detail="git_url must start with https://, git@, or ssh://",
            )

        # Check disk space
        if not ensure_sufficient_disk_space():
            raise HTTPException(
                status_code=507,
                detail="Insufficient disk space. Please free up space and try again.",
            )

        # Clone repository
        work_id = str(uuid.uuid4())
        local_dir = Path(TEMP_DIR) / work_id
        repo_name = get_repo_name_from_url(request.git_url)
        repo_path = local_dir / repo_name
        local_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Cloning Git repository: {request.git_url}")

        github_token = GITHUB_TOKEN or os.getenv("GITHUB_TOKEN", "")
        git_info = await clone_git_repo(
            request.git_url,
            repo_path,
            branch=request.branch,
            commit=request.commit,
            github_token=github_token if github_token else None,
        )

        working_dir = str(repo_path.resolve())

        # Create session
        session = session_manager.create_session(
            session_id=session_id,
            working_directory=working_dir,
            prompt=request.prompt,
        )

        # Store Git info and cleanup flag in session metadata
        session.metadata = {
            "git_info": git_info,
            "git_url": request.git_url,
            "cleanup_on_completion": request.cleanup_on_completion,
            "local_dir": str(local_dir),
            "s3_bucket": request.s3_bucket,
            "s3_results_prefix": request.s3_results_prefix,
        }

        # Merge request.metadata if provided
        if hasattr(request, 'metadata') and request.metadata:
            session.metadata.update(request.metadata)

        # Override with top-level fields (these take precedence)
        if request.upload_to_s3:
            session.metadata["upload_to_s3"] = request.upload_to_s3
        if hasattr(request, 'upload_to_cloud_storage') and request.upload_to_cloud_storage:
            session.metadata["upload_to_cloud_storage"] = request.upload_to_cloud_storage
        if request.push_to_github:
            session.metadata["push_to_github"] = request.push_to_github
        if request.create_download:
            session.metadata["create_download"] = True
            session.metadata["download_format"] = "zip"  # Default format

        logger.info(f"Session {session_id} metadata configured with keys: {list(session.metadata.keys())}")
        logger.info(f"Session {session_id} metadata content: {session.metadata}")

        # Start scaffolding in background
        asyncio.create_task(
            run_scaffolding(
                session=session,
                prompt=request.prompt,
                working_directory=working_dir,
                allowed_tools=request.allowed_tools,
                max_turns=request.max_turns,
                model=request.model,
            )
        )

        return ScaffoldResponse(
            session_id=session_id,
            status=session.status.value,
            message=f"Scaffolding started with Git repository. Connect via WebSocket or poll /sessions/{session_id}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start scaffolding from Git: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start scaffolding: {str(e)}")


@router.post("/scaffold-s3", response_model=ScaffoldResponse)
async def start_scaffolding_s3(request: ScaffoldS3Request):
    """
    Start a new scaffolding session with S3 project files.

    In Celery mode (USE_CELERY=true):
        - Creates session in Redis
        - Submits task to Celery queue (S3 download happens in worker)
        - Returns immediately

    In default mode:
        - Downloads from S3 synchronously
        - Creates session in memory
        - Starts asyncio task
        - Returns immediately

    Args:
        request: Scaffolding request with S3 bucket/key

    Returns:
        ScaffoldResponse with session_id
    """
    session_id = request.session_id or str(uuid.uuid4())

    try:
        # Build metadata dict (consolidate request.metadata + top-level fields)
        metadata = {}
        if hasattr(request, 'metadata') and request.metadata:
            metadata.update(request.metadata)

        # Override with top-level fields (these take precedence)
        if request.upload_to_s3:
            metadata["upload_to_s3"] = request.upload_to_s3
        if hasattr(request, 'upload_to_cloud_storage') and request.upload_to_cloud_storage:
            metadata["upload_to_cloud_storage"] = request.upload_to_cloud_storage
        if request.push_to_github:
            metadata["push_to_github"] = request.push_to_github
        if request.create_download:
            metadata["create_download"] = True
            metadata["download_format"] = "zip"

        logger.info(f"Session {session_id} metadata configured with keys: {list(metadata.keys())}")

        if USE_CELERY:
            # === CELERY MODE ===
            # S3 download happens in WORKER, not here
            logger.info(f"Session {session_id} - Using CELERY mode for S3 scaffolding")
            redis_manager = get_redis_session_manager()
            celery_tasks = get_celery_tasks()

            # 1. Create session in Redis first
            logger.info(f"Session {session_id} - Creating session in Redis")
            await redis_manager.create_session(
                session_id=session_id,
                working_directory="",  # Worker sets this after S3 download
                prompt=request.prompt,
                metadata=metadata,
            )
            logger.info(f"Session {session_id} - Redis session created")

            # 2. Submit Celery task (handles S3 download internally)
            logger.info(f"Session {session_id} - Submitting S3 task to Celery queue")
            task_result = celery_tasks.run_scaffolding_s3_task.delay(
                session_id=session_id,
                prompt=request.prompt,
                s3_bucket=request.s3_bucket,
                s3_key=request.s3_key,
                allowed_tools=request.allowed_tools,
                max_turns=request.max_turns,
                model=request.model,
                metadata=metadata,
            )
            logger.info(f"Session {session_id} - Submitted to Celery, task_id={task_result.id}")

            # 3. Link celery_task_id to session
            await redis_manager.update_session(session_id, celery_task_id=task_result.id)

            return ScaffoldResponse(
                session_id=session_id,
                status="running",
                message="Scaffolding started (Celery). Poll /sessions/{id} for status",
            )
        else:
            # === IN-MEMORY MODE (existing behavior) ===
            # Download project from S3
            download_result = await download_from_s3_internal(request.s3_bucket, request.s3_key)
            if not download_result["success"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to download project from S3: {download_result.get('error')}",
                )

            working_dir = Path(download_result["local_path"]).resolve()

            # Create session
            session = session_manager.create_session(
                session_id=session_id,
                working_directory=str(working_dir),
                prompt=request.prompt,
            )

            # Ensure metadata is initialized and merge
            if not hasattr(session, 'metadata') or session.metadata is None:
                session.metadata = {}
            session.metadata.update(metadata)

            logger.info(f"Session {session_id} metadata content: {session.metadata}")

            # Start scaffolding in background
            asyncio.create_task(
                run_scaffolding(
                    session=session,
                    prompt=request.prompt,
                    working_directory=str(working_dir),
                    allowed_tools=request.allowed_tools,
                    max_turns=request.max_turns,
                    model=request.model,
                )
            )

            return ScaffoldResponse(
                session_id=session_id,
                status=session.status.value,
                message="Scaffolding started with S3 project. Poll /sessions/{id} for status",
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start scaffolding from S3: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to start scaffolding: {str(e)}")


@router.get("/sessions/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(session_id: str):
    """
    Get current session status.

    In Celery mode, reads from Redis.
    In default mode, reads from in-memory session manager.

    Args:
        session_id: Session identifier

    Returns:
        SessionStatusResponse
    """
    if USE_CELERY:
        # Celery mode: Read from Redis
        redis_manager = get_redis_session_manager()
        session_data = await redis_manager.get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")

        # Map Redis session data to response format
        metadata = session_data.get("metadata", {})
        return SessionStatusResponse(
            session_id=session_data["id"],
            status=session_data.get("status", "unknown"),
            pending_approval=session_data.get("pending_approval"),
            messages_count=len(session_data.get("messages", [])),
            result=session_data.get("result") or None,
            error=session_data.get("error") or None,
            created_at=session_data.get("created_at", ""),
            updated_at=session_data.get("updated_at", ""),
            working_directory=session_data.get("working_directory"),
            storage_url=metadata.get("storage_url"),
            s3_url=metadata.get("s3_url"),
            azure_url=metadata.get("azure_url"),
            gcs_url=metadata.get("gcs_url"),
            github_url=metadata.get("github_url"),
            download_url=metadata.get("download_url"),
            celery_task_id=session_data.get("celery_task_id"),
        )
    else:
        # Default mode: Read from in-memory session manager
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        return SessionStatusResponse(**session.to_dict())


@router.get("/sessions/{session_id}/messages", response_model=SessionMessagesResponse)
async def get_session_messages(session_id: str, skip: int = 0, limit: int = 100):
    """
    Get session messages with pagination.

    In Celery mode, reads from Redis.
    In default mode, reads from in-memory session manager.

    Args:
        session_id: Session identifier
        skip: Number of messages to skip
        limit: Maximum number of messages to return

    Returns:
        SessionMessagesResponse
    """
    if USE_CELERY:
        # Celery mode: Read from Redis
        redis_manager = get_redis_session_manager()
        session_data = await redis_manager.get_session(session_id)

        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")

        all_messages = session_data.get("messages", [])
        messages = all_messages[skip: skip + limit]

        return SessionMessagesResponse(
            messages=messages,
            total=len(all_messages),
            skip=skip,
            limit=limit,
        )
    else:
        # Default mode: Read from in-memory session manager
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        messages = session.messages[skip: skip + limit]
        return SessionMessagesResponse(
            messages=messages,
            total=len(session.messages),
            skip=skip,
            limit=limit,
        )


@router.get("/sessions/{session_id}/files/{file_path:path}")
async def get_session_file(session_id: str, file_path: str):
    """
    Get file content from session working directory.

    Args:
        session_id: Session identifier
        file_path: Relative file path within session directory

    Returns:
        File content as text
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.working_directory:
        raise HTTPException(status_code=400, detail="Session has no working directory")

    try:
        # Construct full file path
        full_path = Path(session.working_directory) / file_path

        # Security check: ensure file is within working directory
        if not str(full_path.resolve()).startswith(str(Path(session.working_directory).resolve())):
            raise HTTPException(status_code=403, detail="Access denied: path outside working directory")

        # Check if file exists
        if not full_path.exists():
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

        if not full_path.is_file():
            raise HTTPException(status_code=400, detail=f"Path is not a file: {file_path}")

        # Read and return file content
        content = full_path.read_text(encoding="utf-8")
        return {"content": content, "path": file_path}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading file {file_path} from session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")


@router.post("/sessions/{session_id}/approve", response_model=Dict[str, Any])
async def approve_action(session_id: str, response: ApprovalResponse):
    """
    Approve or reject pending action.

    In Celery mode, updates Redis and publishes approval event.
    In default mode, sets approval on in-memory session.

    Args:
        session_id: Session identifier
        response: Approval response

    Returns:
        Status dictionary
    """
    if USE_CELERY:
        # Celery mode: Update Redis and publish event
        redis_manager = get_redis_session_manager()
        session_data = await redis_manager.get_session(session_id)

        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")

        if session_data.get("status") != "waiting_approval":
            raise HTTPException(
                status_code=400,
                detail=f"Session not waiting for approval. Status: {session_data.get('status')}",
            )

        # Set approval response and publish event
        await redis_manager.set_approval_response(session_id, response.approved)

        return {"status": "response_sent", "approved": response.approved}
    else:
        # Default mode: Set approval on in-memory session
        session = session_manager.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        if session.status != SessionStatus.WAITING_APPROVAL:
            raise HTTPException(
                status_code=400,
                detail=f"Session not waiting for approval. Status: {session.status.value}",
            )

        session.approval_response = response.approved
        session.approval_event.set()

        return {"status": "response_sent", "approved": response.approved}


@router.post("/scaffold/oneoff", response_model=OneOffResponse)
async def oneoff_scaffold(request: OneOffRequest):
    """
    One-off scaffolding that skips all permissions.

    Results sent to callback_url if provided.

    Args:
        request: One-off scaffolding request

    Returns:
        OneOffResponse
    """
    import httpx

    try:
        from claude_agent_sdk import query, ClaudeAgentOptions

        # Ensure working directory exists and is absolute
        from pathlib import Path
        work_dir = Path(request.working_directory).resolve()
        if not work_dir.exists():
            work_dir.mkdir(parents=True, exist_ok=True)

        options = ClaudeAgentOptions(
            allowed_tools=request.allowed_tools,
            cwd=str(work_dir),
            system_prompt={"type": "preset", "preset": "claude_code"},
        )

        messages = []
        result = None

        async for message in query(prompt=request.prompt, options=options):
            from ...claude_code.executor import message_to_dict

            msg_dict = message_to_dict(message)
            messages.append(msg_dict)
            if hasattr(message, "type") and message.type == "result":
                result = getattr(message, "result", None)

        # Handle storage options after completion
        from ...claude_code.storage_utils import create_download_archive, push_to_github, upload_to_s3

        s3_url = None
        github_url = None
        download_url = None

        working_dir = Path(request.working_directory)
        if working_dir.exists():
            # Upload to S3 if configured
            if request.upload_to_s3:
                try:
                    s3_bucket = request.upload_to_s3.get("bucket")
                    s3_key = request.upload_to_s3.get("key", f"oneoff/{uuid.uuid4()}")
                    archive_format = request.upload_to_s3.get("format", "zip")
                    success, s3_url, error = await upload_to_s3(
                        str(working_dir),
                        s3_bucket,
                        s3_key,
                        aws_region=AWS_REGION,
                        archive_format=archive_format,
                    )
                    if not success:
                        logger.error(f"Failed to upload to S3: {error}")
                except Exception as e:
                    logger.error(f"Error uploading to S3: {e}")

            # Push to GitHub if configured
            if request.push_to_github:
                try:
                    repo_url = request.push_to_github.get("repo_url")
                    # Branch is optional; default to 'ace' if not provided
                    branch = request.push_to_github.get("branch", "ace")
                    commit_message = request.push_to_github.get(
                        "commit_message", "Generated code from Claude Code one-off scaffolding"
                    )
                    success, github_url, error = await push_to_github(
                        str(working_dir),
                        repo_url,
                        branch=branch,
                        commit_message=commit_message,
                        github_token=GITHUB_TOKEN or os.getenv("GITHUB_TOKEN", "") or None,
                    )
                    if not success:
                        logger.error(f"Failed to push to GitHub: {error}")
                except Exception as e:
                    logger.error(f"Error pushing to GitHub: {e}")

            # Create download if requested
            if request.create_download:
                try:
                    archive_format = "zip"  # Default
                    success, archive_path, error = await create_download_archive(
                        str(working_dir),
                        archive_format=archive_format,
                    )
                    if success:
                        download_url = f"/api/v1/sessions/oneoff-{uuid.uuid4()}/download"
                        logger.info(f"Download archive created: {archive_path}")
                    else:
                        logger.error(f"Failed to create download: {error}")
                except Exception as e:
                    logger.error(f"Error creating download: {e}")

        response_data = {
            "status": "completed",
            "result": result,
            "messages_count": len(messages),
            "s3_url": s3_url,
            "github_url": github_url,
            "download_url": download_url,
        }

        # Send to callback if provided
        if request.callback_url:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        request.callback_url,
                        json=response_data,
                        timeout=30,
                    )
            except Exception as e:
                logger.warning(f"Failed to send callback: {e}")

        return OneOffResponse(**response_data)

    except ImportError:
        return OneOffResponse(
            status="error",
            error="Claude Agent SDK not available. Install with: pip install claude-agent-sdk",
        )
    except Exception as e:
        logger.error(f"One-off scaffolding failed: {e}", exc_info=True)
        return OneOffResponse(status="error", error=str(e))


@router.post("/files/upload", response_model=FileUploadResponse)
async def upload_project_files(file: UploadFile = File(...)):
    """
    Upload and extract project files to EC2 instance.

    Args:
        file: Tar.gz archive of project files

    Returns:
        FileUploadResponse with remote path
    """
    try:
        # Validate file size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            return FileUploadResponse(
                success=False,
                error=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes",
            )

        # Create unique directory for this upload
        upload_id = str(uuid.uuid4())
        remote_dir = Path(TEMP_DIR) / upload_id
        remote_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Uploading project files to: {remote_dir}")

        # Save uploaded file
        temp_archive = remote_dir / file.filename or f"{upload_id}.tar.gz"
        with open(temp_archive, "wb") as f:
            f.write(content)

        # Extract archive (support both tar.gz and zip)
        extracted_dir = remote_dir / "project"
        extracted_dir.mkdir(exist_ok=True)

        filename_lower = temp_archive.name.lower()
        if filename_lower.endswith((".tar.gz", ".tgz")):
            with tarfile.open(temp_archive, "r:gz") as tar:
                tar.extractall(extracted_dir)
        elif filename_lower.endswith(".zip"):
            with zipfile.ZipFile(temp_archive, "r") as zip_ref:
                zip_ref.extractall(extracted_dir)
        else:
            # Try tar.gz first, then zip
            try:
                with tarfile.open(temp_archive, "r:gz") as tar:
                    tar.extractall(extracted_dir)
            except Exception:
                try:
                    with zipfile.ZipFile(temp_archive, "r") as zip_ref:
                        zip_ref.extractall(extracted_dir)
                except Exception as e:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Unsupported archive format. Use .tar.gz, .tgz, or .zip. Error: {e}",
                    )

        # Clean up archive
        temp_archive.unlink()

        # Find the actual project directory (might be nested)
        project_dirs = list(extracted_dir.iterdir())
        if len(project_dirs) == 1 and project_dirs[0].is_dir():
            actual_project_dir = project_dirs[0]
        else:
            actual_project_dir = extracted_dir

        logger.info(f"Project files extracted to: {actual_project_dir}")

        return FileUploadResponse(
            success=True,
            remote_path=str(actual_project_dir),
            file_size=len(content),
        )

    except Exception as e:
        logger.error(f"File upload failed: {str(e)}")
        return FileUploadResponse(success=False, error=str(e))


@router.post("/s3/download", response_model=S3DownloadResponse)
async def download_from_s3(s3_bucket: str, s3_key: str):
    """
    Download project files from S3 to EC2 instance.

    Args:
        s3_bucket: S3 bucket name
        s3_key: S3 object key

    Returns:
        S3DownloadResponse with local path
    """
    result = await download_from_s3_internal(s3_bucket, s3_key)
    return S3DownloadResponse(**result)


async def download_from_s3_internal(s3_bucket: str, s3_key: str) -> Dict[str, Any]:
    """
    Internal function to download from S3.

    Args:
        s3_bucket: S3 bucket name
        s3_key: S3 object key

    Returns:
        Dictionary with success, local_path, error, file_size
    """
    try:
        # Create unique directory for this download
        download_id = str(uuid.uuid4())
        remote_dir = Path(TEMP_DIR) / download_id
        remote_dir.mkdir(parents=True, exist_ok=True)

        # Download file from S3
        archive_path = remote_dir / Path(s3_key).name
        s3_client.download_file(s3_bucket, s3_key, str(archive_path))

        # Extract archive (support both tar.gz and zip)
        extracted_dir = remote_dir / "project"
        extracted_dir.mkdir(exist_ok=True)

        filename_lower = archive_path.name.lower()
        if filename_lower.endswith((".tar.gz", ".tgz")):
            with tarfile.open(archive_path, "r:gz") as tar:
                tar.extractall(extracted_dir)
        elif filename_lower.endswith(".zip"):
            with zipfile.ZipFile(archive_path, "r") as zip_ref:
                zip_ref.extractall(extracted_dir)
        else:
            # Try tar.gz first, then zip
            try:
                with tarfile.open(archive_path, "r:gz") as tar:
                    tar.extractall(extracted_dir)
            except Exception:
                try:
                    with zipfile.ZipFile(archive_path, "r") as zip_ref:
                        zip_ref.extractall(extracted_dir)
                except Exception as e:
                    return {
                        "success": False,
                        "error": f"Unsupported archive format. Use .tar.gz, .tgz, or .zip. Error: {e}",
                        "file_size": 0,
                    }

        # Clean up archive
        archive_path.unlink()

        # Find the actual project directory (might be nested)
        project_dirs = list(extracted_dir.iterdir())
        if len(project_dirs) == 1 and project_dirs[0].is_dir():
            actual_project_dir = project_dirs[0]
        else:
            actual_project_dir = extracted_dir

        file_size = sum(f.stat().st_size for f in actual_project_dir.rglob("*") if f.is_file())

        logger.info(f"Project files downloaded from S3 to: {actual_project_dir}")

        return {
            "success": True,
            "local_path": str(actual_project_dir),
            "file_size": file_size,
        }

    except Exception as e:
        logger.error(f"S3 download failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "file_size": 0,
        }


@router.post("/files/cleanup")
async def cleanup_files(request: CleanupRequest):
    """
    Clean up project files from EC2 instance.

    Args:
        request: Cleanup request with path to clean

    Returns:
        Success status
    """
    try:
        cleanup_path = Path(request.path)

        if not cleanup_path.exists():
            logger.warning(f"Cleanup path does not exist: {cleanup_path}")
            return {"success": True, "message": "Path already cleaned"}

        # Ensure we're only cleaning within temp directory
        temp_path = Path(TEMP_DIR)
        if not str(cleanup_path).startswith(str(temp_path)):
            raise HTTPException(status_code=403, detail="Cannot clean up outside temp directory")

        # Remove directory and all contents
        if cleanup_path.is_dir():
            shutil.rmtree(cleanup_path)
            logger.info(f"Cleaned up directory: {cleanup_path}")
        else:
            cleanup_path.unlink()
            logger.info(f"Cleaned up file: {cleanup_path}")

        return {"success": True, "message": f"Cleaned up: {cleanup_path}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Cleanup failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket connection for real-time session updates.

    In Celery mode, uses Redis pub/sub as a bridge.
    In default mode, uses direct session reference.

    Args:
        websocket: WebSocket connection
        session_id: Session identifier
    """
    if USE_CELERY:
        await _websocket_celery_mode(websocket, session_id)
    else:
        await _websocket_inmemory_mode(websocket, session_id)


async def _websocket_inmemory_mode(websocket: WebSocket, session_id: str):
    """In-memory WebSocket handler (original implementation)."""
    logger.info(f"WebSocket connection attempt for session: {session_id}")

    # Check session exists before accepting connection
    session = session_manager.get_session(session_id)
    if not session:
        logger.warning(f"WebSocket connection rejected: Session {session_id} not found")
        logger.info(f"Available sessions: {list(session_manager.sessions.keys())}")
        # Try to accept and then close with proper error code
        try:
            await websocket.accept()
            await websocket.close(code=4004, reason="Session not found")
        except Exception as e:
            logger.error(f"Error closing WebSocket: {e}")
        return

    # Accept the connection
    try:
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for session: {session_id}")
    except Exception as e:
        logger.error(f"Failed to accept WebSocket connection: {e}", exc_info=True)
        return

    session.websocket = websocket

    try:
        # Send existing messages
        if session.messages:
            logger.info(f"Sending {len(session.messages)} existing messages to WebSocket")
            for msg in session.messages:
                try:
                    await websocket.send_json(msg)
                except Exception as e:
                    logger.warning(f"Failed to send message to WebSocket: {e}")
                    break

        # Handle incoming messages (approvals)
        while True:
            try:
                data = await websocket.receive_json()
                logger.debug(f"Received WebSocket message: {data.get('type')}")

                if data.get("type") == "approval":
                    session.approval_response = data.get("approved", False)
                    session.approval_event.set()
                    logger.info(f"Approval response received: {session.approval_response}")

                elif data.get("type") == "cancel":
                    session.update_status(SessionStatus.CANCELLED)
                    session.error = "Cancelled by user"
                    logger.info(f"Session {session_id} cancelled via WebSocket")
                    break
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}", exc_info=True)
    finally:
        if session:
            session.websocket = None
            logger.info(f"WebSocket connection closed for session {session_id}")


async def _websocket_celery_mode(websocket: WebSocket, session_id: str):
    """Redis pub/sub bridge for Celery mode WebSocket."""
    logger.info(f"WebSocket connection attempt for session: {session_id} (Celery mode)")

    redis_manager = get_redis_session_manager()

    # Check session exists in Redis before accepting connection
    session_data = await redis_manager.get_session(session_id)
    if not session_data:
        logger.warning(f"WebSocket connection rejected: Session {session_id} not found in Redis")
        try:
            await websocket.accept()
            await websocket.close(code=4004, reason="Session not found")
        except Exception as e:
            logger.error(f"Error closing WebSocket: {e}")
        return

    # Accept the connection
    try:
        await websocket.accept()
        logger.info(f"WebSocket connection accepted for session: {session_id} (Celery mode)")
    except Exception as e:
        logger.error(f"Failed to accept WebSocket connection: {e}", exc_info=True)
        return

    # Send existing messages from Redis
    existing_messages = session_data.get("messages", [])
    if existing_messages:
        logger.info(f"Sending {len(existing_messages)} existing messages to WebSocket")
        for msg in existing_messages:
            try:
                await websocket.send_json(msg)
            except Exception as e:
                logger.warning(f"Failed to send message to WebSocket: {e}")
                break

    # Check if session already completed
    if session_data.get("status") in ("completed", "error", "cancelled"):
        logger.info(f"Session {session_id} already finished, closing WebSocket")
        await websocket.send_json({
            "type": session_data.get("status"),
            "result": session_data.get("result"),
            "error": session_data.get("error"),
        })
        await websocket.close()
        return

    # Run two tasks concurrently:
    # 1. Forward Redis pub/sub messages to WebSocket
    # 2. Receive WebSocket messages and handle approvals
    async def forward_redis_to_websocket():
        """Subscribe to Redis and forward updates to WebSocket."""
        r = await redis_manager._get_redis()
        pubsub = r.pubsub()
        channel = f"session_updates:{session_id}"

        try:
            await pubsub.subscribe(channel)
            logger.debug(f"Subscribed to Redis channel: {channel}")

            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0
                )

                if message and message.get("type") == "message":
                    try:
                        data = json.loads(message.get("data", "{}"))
                        await websocket.send_json(data)

                        # Close on completion/error
                        if data.get("type") in ("completed", "error"):
                            logger.info(f"Session {session_id} finished, closing WebSocket")
                            break
                    except Exception as e:
                        logger.warning(f"Error forwarding Redis message: {e}")
                        break

                await asyncio.sleep(0.1)

        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()

    async def receive_websocket_messages():
        """Receive WebSocket messages and handle approvals."""
        try:
            while True:
                data = await websocket.receive_json()
                logger.debug(f"Received WebSocket message: {data.get('type')}")

                if data.get("type") == "approval":
                    approved = data.get("approved", False)
                    await redis_manager.set_approval_response(session_id, approved)
                    logger.info(f"Approval received via WebSocket: {approved}")

                elif data.get("type") == "cancel":
                    await redis_manager.update_session(
                        session_id,
                        status="cancelled",
                        error="Cancelled by user"
                    )
                    await redis_manager.publish_session_update(
                        session_id, "error", {"message": "Cancelled by user"}
                    )
                    logger.info(f"Session {session_id} cancelled via WebSocket")
                    break

        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected for session {session_id}")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error receiving WebSocket message: {e}")

    try:
        # Run both tasks concurrently
        forward_task = asyncio.create_task(forward_redis_to_websocket())
        receive_task = asyncio.create_task(receive_websocket_messages())

        # Wait for either task to complete
        done, pending = await asyncio.wait(
            [forward_task, receive_task],
            return_when=asyncio.FIRST_COMPLETED
        )

        # Cancel the other task
        for task in pending:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}", exc_info=True)
    finally:
        logger.info(f"WebSocket connection closed for session {session_id} (Celery mode)")


@router.get("/scaffold/status", response_model=SystemStatusResponse)
async def get_system_status():
    """
    Get comprehensive system status.

    Returns:
        SystemStatusResponse with system information
    """
    tools = check_system_tools()
    disk_info = check_disk_space()

    # Check SDK availability
    sdk_available = False
    try:
        from claude_agent_sdk import query

        sdk_available = True
    except ImportError:
        pass

    # Get session counts based on mode
    if USE_CELERY:
        try:
            redis_manager = get_redis_session_manager()
            active_sessions = await redis_manager.get_active_sessions_count()
            all_sessions = await redis_manager.list_sessions()
            total_sessions = len(all_sessions)
        except Exception as e:
            logger.warning(f"Failed to get Redis session counts: {e}")
            active_sessions = 0
            total_sessions = 0
    else:
        active_sessions = session_manager.get_active_sessions_count()
        total_sessions = len(session_manager.sessions)

    return SystemStatusResponse(
        status="running",
        sdk_available=sdk_available,
        git_available=tools.get("git", False),
        github_cli_available=tools.get("github_cli", False),
        anthropic_api_configured=bool(ANTHROPIC_API_KEY),
        github_token_configured=bool(GITHUB_TOKEN),
        disk_usage=disk_info,
        temp_dir=TEMP_DIR,
        aws_region=AWS_REGION,
        timestamp=datetime.now(UTC).isoformat(),
        active_sessions=active_sessions,
        total_sessions=total_sessions,
    )


# ============== Compatibility Endpoints (EC2 Script API) ==============
# These endpoints match the EC2 script API but use interactive sessions internally


@router.post("/cli/execute", response_model=CLIExecutionResponse)
async def execute_cli(request: CLIExecutionRequest):
    """
    Execute CLI with project path (compatibility endpoint - synchronous mode).
    
    This endpoint provides full compatibility with the EC2 script API.
    It waits for completion and returns results immediately (blocking behavior).
    
    For interactive sessions with approvals, use /api/v1/scaffold instead.
    
    Args:
        request: CLI execution request
        
    Returns:
        CLIExecutionResponse with immediate results (synchronous execution)
    """
    from datetime import datetime, UTC

    start_time = datetime.now(UTC)

    try:
        # Validate project path
        project_path = Path(request.project_path)
        if not project_path.exists() or not project_path.is_dir():
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=f"Project path not found: {request.project_path}",
                duration=0.0,
                backend_used=request.backend,
                metadata={"error_type": "PathNotFound"},
            )

        # For compatibility mode, use one-off execution (non-interactive, auto-approve)
        # This matches the behavior of the old EC2 script
        try:
            from claude_agent_sdk import query, ClaudeAgentOptions

            # Use a sensible default tool set; caller does not need to supply this.
            # Ensure working directory exists
            work_dir = project_path.resolve()
            if not work_dir.exists():
                work_dir.mkdir(parents=True, exist_ok=True)

            options = ClaudeAgentOptions(
                allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
                cwd=str(work_dir),
                system_prompt={"type": "preset", "preset": "claude_code"},
            )

            messages = []
            result_output = None

            # Execute with timeout
            async def execute_with_timeout():
                nonlocal result_output
                async for message in query(prompt=request.prompt, options=options):
                    from ...claude_code.executor import message_to_dict

                    msg_dict = message_to_dict(message)
                    messages.append(msg_dict)
                    if hasattr(message, "type") and message.type == "result":
                        result_output = getattr(message, "result", None)
                    elif hasattr(message, "result"):
                        result_output = getattr(message, "result", None)

            await asyncio.wait_for(execute_with_timeout(), timeout=request.timeout)

            end_time = datetime.now(UTC)
            duration = (end_time - start_time).total_seconds()

            # Handle output file if specified
            if request.output_file and result_output:
                output_path = project_path / request.output_file
                output_path.write_text(str(result_output), encoding="utf-8")
                logger.info(f"Output written to file: {output_path}")

            # Extract text output from result
            if result_output:
                if isinstance(result_output, str):
                    output_text = result_output
                elif isinstance(result_output, dict):
                    output_text = result_output.get("text", str(result_output))
                else:
                    output_text = str(result_output)
            else:
                # Try to extract from messages
                for msg in reversed(messages):
                    if msg.get("type") == "result" or msg.get("type") == "message":
                        content = msg.get("result") or msg.get("content", "")
                        if content:
                            output_text = str(content)
                            break
                else:
                    output_text = "Completed"

            # Optional: upload textual result to S3 and/or push working dir to GitHub
            s3_url: Optional[str] = None
            github_url: Optional[str] = None
            metadata: Dict[str, Any] = {
                "project_path": str(project_path),
                "prompt_length": len(request.prompt),
                "output_length": len(output_text),
                "execution_time": duration,
            }

            if request.upload_to_s3:
                try:
                    bucket = request.upload_to_s3.get("bucket")
                    key = request.upload_to_s3.get(
                        "key",
                        f"cli-results/{request.request_id}.txt",
                    )
                    if not bucket:
                        raise ValueError("upload_to_s3.bucket is required")

                    s3_client.put_object(
                        Bucket=bucket,
                        Key=key,
                        Body=output_text.encode("utf-8"),
                        ContentType="text/plain; charset=utf-8",
                    )

                    s3_url = f"s3://{bucket}/{key}"
                    metadata["s3_bucket"] = bucket
                    metadata["s3_key"] = key
                    metadata["s3_url"] = s3_url
                    logger.info(f"CLI result uploaded to S3: {s3_url}")
                except Exception as e:
                    logger.error(f"Failed to upload CLI result to S3: {e}", exc_info=True)
                    metadata["s3_upload_error"] = str(e)

            if request.push_to_github:
                try:
                    from ...claude_code.storage_utils import push_to_github  # lazy import to avoid cycles

                    repo_url = request.push_to_github.get("repo_url")
                    # Branch is optional; default to 'ace' if not provided
                    branch = request.push_to_github.get("branch", "ace")
                    commit_message = request.push_to_github.get(
                        "commit_message",
                        f"Generated docs from Claude CLI (request: {request.request_id})",
                    )

                    if not repo_url:
                        raise ValueError("push_to_github.repo_url is required")

                    github_token = os.getenv("GITHUB_TOKEN", "")

                    success, gh_url, error = await push_to_github(
                        str(project_path.resolve()),
                        repo_url,
                        branch=branch,
                        commit_message=commit_message,
                        github_token=github_token or None,
                    )

                    if success:
                        github_url = gh_url
                        metadata["github_url"] = gh_url
                        metadata["github_branch"] = branch
                        logger.info(f"CLI result pushed to GitHub: {gh_url} (branch: {branch})")
                    else:
                        logger.error(f"Failed to push CLI result to GitHub: {error}")
                        metadata["github_push_error"] = error
                except Exception as e:
                    logger.error(f"Error pushing CLI result to GitHub: {e}", exc_info=True)
                    metadata["github_push_error"] = str(e)

            return CLIExecutionResponse(
                request_id=request.request_id,
                success=True,
                output=output_text,
                error=None,
                duration=duration,
                backend_used=request.backend,
                s3_url=s3_url,
                github_url=github_url,
                metadata=metadata,
            )

        except asyncio.TimeoutError:
            duration = (datetime.now(UTC) - start_time).total_seconds()
            error_msg = f"CLI execution timed out after {request.timeout} seconds"
            logger.error(error_msg)
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=error_msg,
                duration=duration,
                backend_used=request.backend,
                metadata={"timeout": request.timeout, "project_path": str(project_path)},
            )
        except ImportError:
            duration = (datetime.now(UTC) - start_time).total_seconds()
            error_msg = "Claude Agent SDK not available. Install with: pip install claude-agent-sdk"
            logger.error(error_msg)
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=error_msg,
                duration=duration,
                backend_used=request.backend,
                metadata={"error_type": "SDKNotAvailable"},
            )

    except Exception as e:
        duration = (datetime.now(UTC) - start_time).total_seconds()
        logger.error(f"CLI execution error: {e}", exc_info=True)
        return CLIExecutionResponse(
            request_id=request.request_id,
            success=False,
            output=None,
            error=str(e),
            duration=duration,
            backend_used=request.backend,
            metadata={"error_type": type(e).__name__},
        )


@router.post("/cli/execute-s3", response_model=CLIExecutionResponse)
async def execute_cli_from_s3(request: S3CLIExecutionRequest):
    """
    Execute CLI with S3 project files (compatibility endpoint - synchronous mode).
    
    This endpoint provides full compatibility with the EC2 script API.
    It waits for completion and returns results immediately (blocking behavior).
    
    For interactive sessions with approvals, use /api/v1/scaffold-s3 instead.
    
    Args:
        request: S3-based CLI execution request
        
    Returns:
        CLIExecutionResponse with immediate results (synchronous execution)
    """
    from datetime import datetime, UTC

    start_time = datetime.now(UTC)

    try:
        # Download project from S3
        download_result = await download_from_s3_internal(request.s3_bucket, request.s3_key)
        if not download_result["success"]:
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=f"S3 download failed: {download_result.get('error')}",
                duration=(datetime.now(UTC) - start_time).total_seconds(),
                backend_used=request.backend,
                metadata={
                    "s3_bucket": request.s3_bucket,
                    "s3_key": request.s3_key,
                    "download_error": download_result.get("error"),
                },
            )

        working_dir = Path(download_result["local_path"]).resolve()

        # Ensure working directory exists
        if not working_dir.exists():
            working_dir.mkdir(parents=True, exist_ok=True)

        # For compatibility mode, use one-off execution (non-interactive, auto-approve)
        # This matches the behavior of the old EC2 script
        try:
            from claude_agent_sdk import query, ClaudeAgentOptions

            options = ClaudeAgentOptions(
                allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
                cwd=str(working_dir),
                system_prompt={"type": "preset", "preset": "claude_code"},
            )

            messages = []
            result_output = None

            # Execute with timeout
            async def execute_with_timeout():
                nonlocal result_output
                async for message in query(prompt=request.prompt, options=options):
                    from ...claude_code.executor import message_to_dict

                    msg_dict = message_to_dict(message)
                    messages.append(msg_dict)
                    if hasattr(message, "type") and message.type == "result":
                        result_output = getattr(message, "result", None)
                    elif hasattr(message, "result"):
                        result_output = getattr(message, "result", None)

            await asyncio.wait_for(execute_with_timeout(), timeout=request.timeout)

            end_time = datetime.now(UTC)
            duration = (end_time - start_time).total_seconds()

            # Handle output file if specified
            if request.output_file and result_output:
                output_path = working_dir / request.output_file
                output_path.write_text(str(result_output), encoding="utf-8")
                logger.info(f"Output written to file: {output_path}")

            # Extract text output from result
            if result_output:
                if isinstance(result_output, str):
                    output_text = result_output
                elif isinstance(result_output, dict):
                    output_text = result_output.get("text", str(result_output))
                else:
                    output_text = str(result_output)
            else:
                # Try to extract from messages
                for msg in reversed(messages):
                    if msg.get("type") == "result" or msg.get("type") == "message":
                        content = msg.get("result") or msg.get("content", "")
                        if content:
                            output_text = str(content)
                            break
                else:
                    output_text = "Completed"

            return CLIExecutionResponse(
                request_id=request.request_id,
                success=True,
                output=output_text,
                error=None,
                duration=duration,
                backend_used=request.backend,
                metadata={
                    "s3_bucket": request.s3_bucket,
                    "s3_key": request.s3_key,
                    "local_path": str(working_dir),
                    "prompt_length": len(request.prompt),
                    "output_length": len(output_text),
                    "execution_time": duration,
                    "file_size": download_result.get("file_size", 0),
                },
            )

        except asyncio.TimeoutError:
            duration = (datetime.now(UTC) - start_time).total_seconds()
            error_msg = f"CLI execution timed out after {request.timeout} seconds"
            logger.error(error_msg)
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=error_msg,
                duration=duration,
                backend_used=request.backend,
                metadata={
                    "timeout": request.timeout,
                    "s3_bucket": request.s3_bucket,
                    "s3_key": request.s3_key,
                },
            )
        except ImportError:
            duration = (datetime.now(UTC) - start_time).total_seconds()
            error_msg = "Claude Agent SDK not available. Install with: pip install claude-agent-sdk"
            logger.error(error_msg)
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=error_msg,
                duration=duration,
                backend_used=request.backend,
                metadata={"error_type": "SDKNotAvailable"},
            )

    except Exception as e:
        duration = (datetime.now(UTC) - start_time).total_seconds()
        logger.error(f"S3 CLI execution error: {e}", exc_info=True)
        return CLIExecutionResponse(
            request_id=request.request_id,
            success=False,
            output=None,
            error=str(e),
            duration=duration,
            backend_used=request.backend,
            metadata={"error_type": type(e).__name__},
        )


@router.post("/cli/execute-git", response_model=CLIExecutionResponse)
async def execute_cli_from_git(request: GitCLIExecutionRequest):
    """
    Execute CLI with Git repository (compatibility endpoint - synchronous mode).
    
    This endpoint provides full compatibility with the EC2 script API.
    It waits for completion and returns results immediately (blocking behavior).
    
    For interactive sessions with approvals, use /api/v1/scaffold-git instead.
    
    Args:
        request: Git-based CLI execution request
        
    Returns:
        CLIExecutionResponse with immediate results (synchronous execution)
    """
    from datetime import datetime, UTC

    start_time = datetime.now(UTC)
    local_dir: Optional[Path] = None

    try:
        # Validate Git URL
        if not (
                request.git_url.startswith("https://")
                or request.git_url.startswith("git@")
                or request.git_url.startswith("ssh://")
        ):
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error="git_url must start with https://, git@, or ssh://",
                duration=(datetime.now(UTC) - start_time).total_seconds(),
                backend_used=request.backend,
            )

        # Check disk space
        if not ensure_sufficient_disk_space():
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error="Insufficient disk space",
                duration=(datetime.now(UTC) - start_time).total_seconds(),
                backend_used=request.backend,
            )

        # Clone repository
        work_id = str(uuid.uuid4())
        local_dir = Path(TEMP_DIR) / work_id
        repo_name = get_repo_name_from_url(request.git_url)
        repo_path = local_dir / repo_name
        local_dir.mkdir(parents=True, exist_ok=True)

        github_token = GITHUB_TOKEN or os.getenv("GITHUB_TOKEN", "")
        git_info = await clone_git_repo(
            request.git_url,
            repo_path,
            branch=request.branch,
            commit=request.commit,
            github_token=github_token if github_token else None,
        )

        working_dir_path = repo_path.resolve()

        # Ensure working directory exists
        if not working_dir_path.exists():
            working_dir_path.mkdir(parents=True, exist_ok=True)

        working_dir = str(working_dir_path)

        # For compatibility mode, use one-off execution (non-interactive, auto-approve)
        try:
            from claude_agent_sdk import query, ClaudeAgentOptions

            options = ClaudeAgentOptions(
                allowed_tools=["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
                cwd=working_dir,
                system_prompt={"type": "preset", "preset": "claude_code"},
            )

            messages = []
            result_output = None

            # Execute with timeout
            async def execute_with_timeout():
                nonlocal result_output
                async for message in query(prompt=request.prompt, options=options):
                    from ...claude_code.executor import message_to_dict

                    msg_dict = message_to_dict(message)
                    messages.append(msg_dict)
                    if hasattr(message, "type") and message.type == "result":
                        result_output = getattr(message, "result", None)
                    elif hasattr(message, "result"):
                        result_output = getattr(message, "result", None)

            await asyncio.wait_for(execute_with_timeout(), timeout=request.timeout)

            end_time = datetime.now(UTC)
            duration = (end_time - start_time).total_seconds()

            # Handle output file if specified
            if request.output_file and result_output:
                output_path = Path(working_dir) / request.output_file
                output_path.write_text(str(result_output), encoding="utf-8")
                logger.info(f"Output written to file: {output_path}")

            # Extract text output from result
            if result_output:
                if isinstance(result_output, str):
                    output_text = result_output
                elif isinstance(result_output, dict):
                    output_text = result_output.get("text", str(result_output))
                else:
                    output_text = str(result_output)
            else:
                # Try to extract from messages
                for msg in reversed(messages):
                    if msg.get("type") == "result" or msg.get("type") == "message":
                        content = msg.get("result") or msg.get("content", "")
                        if content:
                            output_text = str(content)
                            break
                else:
                    output_text = "Completed"

            # Cleanup if requested
            if request.cleanup_on_completion and local_dir:
                try:
                    if local_dir.exists():
                        shutil.rmtree(local_dir)
                        logger.info(f"Cleaned up directory: {local_dir}")
                except Exception as cleanup_error:
                    logger.warning(f"Failed to cleanup directory {local_dir}: {cleanup_error}")

            return CLIExecutionResponse(
                request_id=request.request_id,
                success=True,
                output=output_text,
                error=None,
                duration=duration,
                backend_used=request.backend,
                git_info=git_info,
                disk_usage=check_disk_space(),
                metadata={
                    "git_url": request.git_url,
                    "prompt_length": len(request.prompt),
                    "output_length": len(output_text),
                    "execution_time": duration,
                },
            )

        except asyncio.TimeoutError:
            duration = (datetime.now(UTC) - start_time).total_seconds()
            error_msg = f"CLI execution timed out after {request.timeout} seconds"
            logger.error(error_msg)
            # Cleanup on timeout
            if request.cleanup_on_completion and local_dir:
                try:
                    if local_dir.exists():
                        shutil.rmtree(local_dir)
                except Exception:
                    pass
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=error_msg,
                duration=duration,
                backend_used=request.backend,
                disk_usage=check_disk_space(),
                metadata={"timeout": request.timeout, "git_url": request.git_url},
            )
        except ImportError:
            duration = (datetime.now(UTC) - start_time).total_seconds()
            error_msg = "Claude Agent SDK not available. Install with: pip install claude-agent-sdk"
            logger.error(error_msg)
            return CLIExecutionResponse(
                request_id=request.request_id,
                success=False,
                output=None,
                error=error_msg,
                duration=duration,
                backend_used=request.backend,
                disk_usage=check_disk_space(),
                metadata={"error_type": "SDKNotAvailable"},
            )

    except Exception as e:
        duration = (datetime.now(UTC) - start_time).total_seconds()
        logger.error(f"Git CLI execution error: {e}", exc_info=True)
        # Cleanup on error
        if local_dir and request.cleanup_on_completion:
            try:
                if local_dir.exists():
                    shutil.rmtree(local_dir)
            except Exception:
                pass
        return CLIExecutionResponse(
            request_id=request.request_id,
            success=False,
            output=None,
            error=str(e),
            duration=duration,
            backend_used=request.backend,
            disk_usage=check_disk_space(),
            metadata={"error_type": type(e).__name__},
        )


@router.get("/sessions/{session_id}/download")
async def download_generated_code(session_id: str, format: str = "zip"):
    """
    Download generated code as a zip or tar.gz archive.

    Args:
        session_id: Session identifier
        format: Archive format ('zip' or 'tar.gz')

    Returns:
        File download response
    """
    from ...claude_code.storage_utils import create_download_archive

    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != SessionStatus.COMPLETED:
        raise HTTPException(
            status_code=400, detail=f"Session not completed. Current status: {session.status.value}"
        )

    if not session.working_directory:
        raise HTTPException(status_code=400, detail="Working directory not available")

    try:
        # Check if download already exists in metadata
        metadata = getattr(session, "metadata", {})
        download_path = metadata.get("download_path")

        if download_path and Path(download_path).exists():
            # Return existing archive
            return FileResponse(
                download_path,
                media_type="application/zip" if format == "zip" else "application/gzip",
                filename=f"scaffold_{session_id}.{format}",
            )

        # Create new archive
        success, archive_path, error = await create_download_archive(
            session.working_directory,
            archive_format=format,
        )

        if not success:
            raise HTTPException(status_code=500, detail=f"Failed to create archive: {error}")

        # Store in metadata for future requests
        metadata["download_path"] = archive_path
        metadata["download_url"] = f"/api/v1/sessions/{session_id}/download"

        return FileResponse(
            archive_path,
            media_type="application/zip" if format == "zip" else "application/gzip",
            filename=f"scaffold_{session_id}.{format}",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create download: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup")
async def cleanup_temp_files():
    """
    Clean up all temporary files.

    Returns:
        Cleanup status
    """
    try:
        if not Path(TEMP_DIR).exists():
            return {
                "success": True,
                "message": "Temp directory does not exist",
                "deleted_items": 0,
            }

        deleted_count = 0
        for item in Path(TEMP_DIR).iterdir():
            try:
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
                deleted_count += 1
            except Exception as e:
                logger.error(f"Failed to delete {item}: {e}")

        disk_info = check_disk_space()

        return {
            "success": True,
            "deleted_items": deleted_count,
            "temp_dir": TEMP_DIR,
            "disk_usage": disk_info,
        }

    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return {"success": False, "error": str(e)}
