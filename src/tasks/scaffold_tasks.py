"""
Scaffolding Celery tasks for Claude Code Wrapper.

These tasks enable distributed scaffolding execution across multiple workers,
using Redis for session state and approval coordination.
"""

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

from src.celery_app import app
from src.claude_code.redis_session import get_redis_session_manager

logger = logging.getLogger(__name__)


def run_async(coro):
    """
    Run async coroutine in sync context.

    Creates a new event loop for each call to avoid issues with
    running in Celery's worker process.
    """
    # Apply Windows fix if needed
    if sys.platform == "win32":
        try:
            from src.claude_code.windows_fix import apply_windows_event_loop_fix
            apply_windows_event_loop_fix()
        except ImportError:
            pass

    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@app.task(bind=True, max_retries=3, soft_time_limit=1800, time_limit=2400)
def run_scaffolding_task(
    self,
    session_id: str,
    prompt: str,
    working_directory: str,
    allowed_tools: Optional[List[str]] = None,
    max_turns: int = 50,
    model: str = "sonnet",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute scaffolding as a Celery task.

    This wraps the existing run_scaffolding logic but:
    - Uses Redis for session state instead of in-memory
    - Uses Redis pub/sub for approval instead of asyncio.Event
    - Returns result dict instead of modifying Session object directly

    Args:
        self: Celery task instance (bound)
        session_id: Unique session identifier
        prompt: Scaffolding prompt
        working_directory: Working directory for project
        allowed_tools: List of allowed tools
        max_turns: Maximum number of turns
        model: Claude model to use
        metadata: Session metadata (storage config, etc.)

    Returns:
        Result dictionary with status, result, and error fields
    """
    logger.info(f"[Celery] Starting scaffolding task for session {session_id}")

    return run_async(_run_scaffolding_async(
        self, session_id, prompt, working_directory,
        allowed_tools, max_turns, model, metadata
    ))


async def _run_scaffolding_async(
    task,
    session_id: str,
    prompt: str,
    working_directory: str,
    allowed_tools: Optional[List[str]],
    max_turns: int,
    model: str,
    metadata: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Async implementation of scaffolding task.

    This mirrors the logic in executor.run_scaffolding but uses Redis
    for session state and approval coordination.
    """
    from src.claude_code.executor import (
        message_to_dict,
        needs_user_approval,
        extract_approval_info,
        extract_final_result,
        handle_post_completion,
    )
    from src.claude_code.session import Session, SessionStatus

    redis_manager = get_redis_session_manager()

    # Update session status to running
    await redis_manager.update_session(session_id, status="running")
    await redis_manager.publish_session_update(session_id, "status", {"status": "running"})

    try:
        # Check if SDK is available
        try:
            from claude_agent_sdk import query, ClaudeAgentOptions
            SDK_AVAILABLE = True
        except ImportError:
            SDK_AVAILABLE = False
            logger.error("Claude Agent SDK not available")
            await redis_manager.update_session(
                session_id,
                status="error",
                error="Claude Agent SDK not installed. Install with: pip install claude-agent-sdk"
            )
            return {"status": "error", "error": "SDK not available"}

        # Run environment diagnostics
        diagnostics = []
        import subprocess

        # Check Node.js
        try:
            node_result = subprocess.run(['node', '--version'], capture_output=True, text=True, timeout=5)
            if node_result.returncode == 0:
                diagnostics.append(f"Node.js: {node_result.stdout.strip()}")
            else:
                diagnostics.append(f"Node.js: FAILED - {node_result.stderr.strip()}")
        except FileNotFoundError:
            diagnostics.append("Node.js: NOT INSTALLED (command not found)")
        except Exception as e:
            diagnostics.append(f"Node.js: ERROR checking - {e}")

        # Check ANTHROPIC_API_KEY
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if api_key:
            diagnostics.append(f"ANTHROPIC_API_KEY: SET (length={len(api_key)})")
        else:
            diagnostics.append("ANTHROPIC_API_KEY: NOT SET")

        logger.info(f"Session {session_id} - Environment diagnostics:\n" + "\n".join(diagnostics))

        # Ensure working directory exists
        work_dir = Path(working_directory).resolve()
        if not work_dir.exists():
            work_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created working directory: {work_dir}")

        # Default allowed tools
        if allowed_tools is None:
            allowed_tools = ["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"]

        # Capture stderr
        stderr_captured: List[str] = []

        def capture_stderr(msg: str) -> None:
            stderr_captured.append(msg)
            logger.info(f"Session {session_id} - SDK stderr: {msg}")

        # Configure Claude Agent options
        logger.info(f"Session {session_id} - Configuring Claude Agent with:")
        logger.info(f"  - Working directory: {working_directory}")
        logger.info(f"  - Allowed tools: {allowed_tools}")
        logger.info(f"  - Max turns: {max_turns}")
        logger.info(f"  - Model: {model}")

        options = ClaudeAgentOptions(
            max_turns=max_turns,
            allowed_tools=allowed_tools,
            cwd=str(work_dir),
            system_prompt={"type": "preset", "preset": "claude_code"},
            stderr=capture_stderr,
        )

        messages_collected = []
        logger.info(f"Session {session_id} - Starting message stream from Claude")

        # Stream messages from Claude
        async for message in query(prompt=prompt, options=options):
            msg_dict = message_to_dict(message)
            messages_collected.append(msg_dict)

            # Store message in Redis
            await redis_manager.add_message(session_id, msg_dict)
            await redis_manager.publish_session_update(session_id, "message", msg_dict)

            # Log message type
            msg_type = msg_dict.get("type", "unknown")
            logger.debug(f"Session {session_id} - Received message type: {msg_type}")

            # Check for tool use that needs approval
            if needs_user_approval(message):
                approval_info = extract_approval_info(message)

                # Set pending approval in Redis
                await redis_manager.update_session(
                    session_id,
                    status="waiting_approval",
                    pending_approval=approval_info
                )
                await redis_manager.publish_session_update(session_id, "approval_required", approval_info)

                logger.info(f"Session {session_id} waiting for approval")

                # Wait for approval via Redis pub/sub
                approved = await redis_manager.wait_for_approval(
                    session_id, timeout=300
                )

                # Clear pending approval
                await redis_manager.update_session(
                    session_id,
                    status="running",
                    pending_approval=None
                )

                if approved is None:
                    # Timeout - auto-approve (configurable)
                    logger.warning(f"Approval timeout for {session_id}, auto-approving")
                    approved = True

                if not approved:
                    await redis_manager.update_session(
                        session_id,
                        status="cancelled",
                        error="User rejected the operation"
                    )
                    logger.info(f"Session {session_id} cancelled by user")
                    return {"status": "cancelled", "error": "User rejected"}

        # Extract final result
        result = extract_final_result(messages_collected)
        logger.info(f"Session {session_id} execution finished, running post-completion tasks")

        # Get current session data for post-completion
        session_data = await redis_manager.get_session(session_id)
        current_metadata = session_data.get("metadata", {}) if session_data else {}

        # Merge provided metadata with existing
        if metadata:
            current_metadata.update(metadata)

        # Create a mock Session object for backward compatibility with handle_post_completion
        mock_session = Session(
            id=session_id,
            working_directory=working_directory,
        )
        mock_session.result = result
        mock_session.metadata = current_metadata

        # Run post-completion tasks (S3, GitHub, etc.)
        logger.info(f"Session {session_id} starting post-completion tasks")
        try:
            await handle_post_completion(mock_session)
            logger.info(f"Session {session_id} post-completion tasks finished")
        except Exception as e:
            logger.error(f"Session {session_id} post-completion error: {e}", exc_info=True)

        # Update final status with URLs from metadata
        await redis_manager.update_session(
            session_id,
            status="completed",
            result=result,
            metadata=mock_session.metadata
        )
        await redis_manager.publish_session_update(session_id, "completed", {
            "result": result,
            "metadata": mock_session.metadata
        })

        logger.info(f"Session {session_id} completed successfully")
        return {
            "status": "completed",
            "result": result,
            "metadata": mock_session.metadata
        }

    except asyncio.CancelledError:
        await redis_manager.update_session(
            session_id,
            status="cancelled",
            error="Execution cancelled"
        )
        logger.info(f"Session {session_id} execution cancelled")
        return {"status": "cancelled", "error": "Execution cancelled"}

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Scaffolding failed for {session_id}: {e}", exc_info=True)

        await redis_manager.update_session(
            session_id,
            status="error",
            error=error_msg
        )
        await redis_manager.publish_session_update(session_id, "error", {"message": error_msg})

        return {"status": "error", "error": error_msg}


@app.task(bind=True, max_retries=3, soft_time_limit=1800, time_limit=2400)
def run_scaffolding_s3_task(
    self,
    session_id: str,
    prompt: str,
    s3_bucket: str,
    s3_key: str,
    allowed_tools: Optional[List[str]] = None,
    max_turns: int = 50,
    model: str = "sonnet",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute scaffolding with S3 project files as a Celery task.

    Downloads project from S3, runs scaffolding, and uploads results.

    Args:
        self: Celery task instance (bound)
        session_id: Unique session identifier
        prompt: Scaffolding prompt
        s3_bucket: S3 bucket containing project files
        s3_key: S3 key for project archive
        allowed_tools: List of allowed tools
        max_turns: Maximum number of turns
        model: Claude model to use
        metadata: Session metadata

    Returns:
        Result dictionary with status, result, and error fields
    """
    logger.info(f"[Celery] Starting S3 scaffolding task for session {session_id}")

    return run_async(_run_scaffolding_s3_async(
        self, session_id, prompt, s3_bucket, s3_key,
        allowed_tools, max_turns, model, metadata
    ))


async def _run_scaffolding_s3_async(
    task,
    session_id: str,
    prompt: str,
    s3_bucket: str,
    s3_key: str,
    allowed_tools: Optional[List[str]],
    max_turns: int,
    model: str,
    metadata: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Async implementation of S3 scaffolding task."""
    import uuid
    import tarfile
    import zipfile
    import boto3

    redis_manager = get_redis_session_manager()
    TEMP_DIR = os.getenv("EC2_TEMP_DIR", "/tmp/claude-scaffold")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

    try:
        # Download project from S3
        download_id = str(uuid.uuid4())
        remote_dir = Path(TEMP_DIR) / download_id
        remote_dir.mkdir(parents=True, exist_ok=True)

        # Download file from S3
        s3_client = boto3.client("s3", region_name=AWS_REGION)
        archive_path = remote_dir / Path(s3_key).name
        s3_client.download_file(s3_bucket, s3_key, str(archive_path))

        # Extract archive
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
                with zipfile.ZipFile(archive_path, "r") as zip_ref:
                    zip_ref.extractall(extracted_dir)

        # Clean up archive
        archive_path.unlink()

        # Find actual project directory
        project_dirs = list(extracted_dir.iterdir())
        if len(project_dirs) == 1 and project_dirs[0].is_dir():
            working_directory = str(project_dirs[0])
        else:
            working_directory = str(extracted_dir)

        logger.info(f"Session {session_id} - Project downloaded to: {working_directory}")

        # Merge metadata with S3 info
        if metadata is None:
            metadata = {}
        metadata["s3_bucket"] = s3_bucket
        metadata["s3_key"] = s3_key
        metadata["local_dir"] = str(remote_dir)

        # Run scaffolding
        return await _run_scaffolding_async(
            task, session_id, prompt, working_directory,
            allowed_tools, max_turns, model, metadata
        )

    except Exception as e:
        error_msg = f"S3 download failed: {str(e)}"
        logger.error(error_msg, exc_info=True)

        await redis_manager.update_session(
            session_id,
            status="error",
            error=error_msg
        )

        return {"status": "error", "error": error_msg}


@app.task(bind=True, max_retries=3, soft_time_limit=1800, time_limit=2400)
def run_scaffolding_git_task(
    self,
    session_id: str,
    prompt: str,
    git_url: str,
    branch: Optional[str] = None,
    commit: Optional[str] = None,
    allowed_tools: Optional[List[str]] = None,
    max_turns: int = 50,
    model: str = "sonnet",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Execute scaffolding with Git repository as a Celery task.

    Clones repository, runs scaffolding, and optionally pushes results.

    Args:
        self: Celery task instance (bound)
        session_id: Unique session identifier
        prompt: Scaffolding prompt
        git_url: Git repository URL
        branch: Branch to clone (optional)
        commit: Specific commit to checkout (optional)
        allowed_tools: List of allowed tools
        max_turns: Maximum number of turns
        model: Claude model to use
        metadata: Session metadata

    Returns:
        Result dictionary with status, result, and error fields
    """
    logger.info(f"[Celery] Starting Git scaffolding task for session {session_id}")

    return run_async(_run_scaffolding_git_async(
        self, session_id, prompt, git_url, branch, commit,
        allowed_tools, max_turns, model, metadata
    ))


async def _run_scaffolding_git_async(
    task,
    session_id: str,
    prompt: str,
    git_url: str,
    branch: Optional[str],
    commit: Optional[str],
    allowed_tools: Optional[List[str]],
    max_turns: int,
    model: str,
    metadata: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Async implementation of Git scaffolding task."""
    import uuid

    from src.claude_code.git_utils import clone_git_repo, get_repo_name_from_url

    redis_manager = get_redis_session_manager()
    TEMP_DIR = os.getenv("EC2_TEMP_DIR", "/tmp/claude-scaffold")
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

    try:
        # Validate Git URL
        if not (git_url.startswith("https://") or git_url.startswith("git@") or git_url.startswith("ssh://")):
            error_msg = "git_url must start with https://, git@, or ssh://"
            await redis_manager.update_session(
                session_id,
                status="error",
                error=error_msg
            )
            return {"status": "error", "error": error_msg}

        # Clone repository
        work_id = str(uuid.uuid4())
        local_dir = Path(TEMP_DIR) / work_id
        repo_name = get_repo_name_from_url(git_url)
        repo_path = local_dir / repo_name
        local_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Session {session_id} - Cloning Git repository: {git_url}")

        git_info = await clone_git_repo(
            git_url,
            repo_path,
            branch=branch,
            commit=commit,
            github_token=GITHUB_TOKEN if GITHUB_TOKEN else None,
        )

        working_directory = str(repo_path.resolve())
        logger.info(f"Session {session_id} - Repository cloned to: {working_directory}")

        # Merge metadata with Git info
        if metadata is None:
            metadata = {}
        metadata["git_info"] = git_info
        metadata["git_url"] = git_url
        metadata["local_dir"] = str(local_dir)

        # Run scaffolding
        return await _run_scaffolding_async(
            task, session_id, prompt, working_directory,
            allowed_tools, max_turns, model, metadata
        )

    except Exception as e:
        error_msg = f"Git clone failed: {str(e)}"
        logger.error(error_msg, exc_info=True)

        await redis_manager.update_session(
            session_id,
            status="error",
            error=error_msg
        )

        return {"status": "error", "error": error_msg}
