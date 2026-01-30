"""
EC2 Executor for Claude Code Wrapper Service.

HTTP client to call EC2 service APIs from ECS containers.
Similar to project-analysis/src/pa_agent/ec2_cli_executor.py
"""

import asyncio
import logging
import os
import tarfile
import tempfile
import uuid
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
from pydantic import BaseModel

from .ec2_config import EC2ClaudeCodeConfig

logger = logging.getLogger(__name__)

# Load environment variables from .env if present (local dev) without overriding existing env
try:
    from dotenv import load_dotenv, find_dotenv  # type: ignore

    load_dotenv(find_dotenv(), override=False)
except Exception:
    # dotenv is optional; ignore if not installed
    pass


class ScaffoldRequest(BaseModel):
    """Request model for EC2 scaffolding execution."""

    prompt: str
    working_directory: Optional[str] = None
    allowed_tools: List[str] = ["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"]
    model: str = "sonnet"
    max_turns: int = 50
    metadata: Dict[str, Any] = {}


class ScaffoldS3Request(BaseModel):
    """Request model for S3-based EC2 scaffolding execution."""

    prompt: str
    s3_bucket: str
    s3_key: str
    allowed_tools: List[str] = ["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"]
    model: str = "sonnet"
    max_turns: int = 50
    metadata: Dict[str, Any] = {}


class ScaffoldResponse(BaseModel):
    """Response model from EC2 scaffolding execution."""

    session_id: str
    status: str
    message: str


class SessionStatusResponse(BaseModel):
    """Response model for session status."""

    session_id: str
    status: str
    pending_approval: Optional[Dict[str, Any]] = None
    messages_count: int
    result: Optional[str] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str
    working_directory: Optional[str] = None


class ApprovalResponse(BaseModel):
    """Response model for approval."""

    approved: bool
    message: Optional[str] = None


class EC2ClaudeCodeExecutor:
    """
    Executes Claude Code scaffolding on EC2 instance instead of in the container.

    This class handles:
    1. Project file synchronization to EC2 (via S3)
    2. Scaffolding execution on EC2 instance
    3. Session management and approval handling
    4. Result retrieval and processing
    5. Error handling and fallback mechanisms
    """

    def __init__(self, config: Optional[EC2ClaudeCodeConfig] = None):
        self.logger = logging.getLogger(__name__)
        self.config = config or EC2ClaudeCodeConfig.from_env()
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(None),  # No default timeout, use per-request timeouts
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
        )
        self.logger.info(f"EC2ClaudeCodeExecutor initialized with host: {self.config.ec2_host}")

    def _get_default_config(self) -> EC2ClaudeCodeConfig:
        """Get default configuration from environment variables."""
        return EC2ClaudeCodeConfig.from_env()

    def _resolve_default_s3_bucket(self) -> Optional[str]:
        """
        Resolve the S3 bucket to use for EC2 uploads when none is provided.

        Strategy:
        - Prefer a bucket that starts with "ace-claude-code-" in the current region.
        - If multiple matches, prefer the one whose location matches the configured region.
        - Returns None if no suitable bucket is found.
        """
        try:
            import boto3

            s3 = boto3.client("s3")
            resp = s3.list_buckets()
            candidate_buckets = []
            for b in resp.get("Buckets", []):
                name = b.get("Name")
                if not name:
                    continue
                if name.startswith("ace-claude-code-") or name == "ace-claude-code":
                    candidate_buckets.append(name)

            if not candidate_buckets:
                return None

            # Filter by region when possible
            target_region = os.getenv("AWS_REGION", "us-east-1")
            same_region = []
            for name in candidate_buckets:
                try:
                    lr = s3.get_bucket_location(Bucket=name)
                    loc = lr.get("LocationConstraint") or "us-east-1"
                    if loc == target_region:
                        same_region.append(name)
                except Exception:
                    # Ignore location errors; keep as candidate
                    pass

            if same_region:
                return sorted(same_region)[0]
            return sorted(candidate_buckets)[0]
        except Exception as e:
            self.logger.warning(f"Failed to auto-resolve S3 bucket: {e}")
            return None

    async def validate_ec2_connection(self) -> Tuple[bool, Optional[str]]:
        """
        Validate connection to EC2 instance.

        Returns:
            Tuple of (is_connected, error_message)
        """
        url = f"http://{self.config.ec2_host}:{self.config.ec2_port}/health"
        attempts = self.config.max_retries
        for attempt in range(1, attempts + 1):
            try:
                response = await self.http_client.get(url, timeout=20)
                if response.status_code == 200:
                    self.logger.info("EC2 instance connection validated successfully")
                    return True, None
                error_msg = f"EC2 health check failed with status {response.status_code}"
                self.logger.warning(error_msg)
            except httpx.TimeoutException:
                error_msg = "EC2 instance connection timed out"
                self.logger.warning(error_msg)
            except httpx.ConnectError:
                error_msg = f"Cannot connect to EC2 instance at {self.config.ec2_host}:{self.config.ec2_port}"
                self.logger.warning(error_msg)
            except Exception as e:
                error_msg = f"EC2 connection validation failed: {str(e)}"
                self.logger.error(error_msg)
            # Backoff before next attempt if not last
            if attempt < attempts:
                await asyncio.sleep(self.config.retry_delay * attempt)
            else:
                return False, error_msg
        return False, "Connection validation failed"

    async def sync_project_files_to_s3(
            self, project_path: str, s3_bucket: str, s3_key: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Upload project files to S3 for EC2 instance to download.

        Args:
            project_path: Local project path to upload
            s3_bucket: S3 bucket name
            s3_key: S3 object key

        Returns:
            Tuple of (success, error_message)
        """
        try:
            project_path = Path(project_path).resolve()
            if not project_path.exists():
                return False, f"Project path does not exist: {project_path}"

            # Create a temporary archive of the project
            with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as temp_file:
                temp_archive = temp_file.name

            # Create tar archive of the project
            with tarfile.open(temp_archive, "w:gz") as tar:
                tar.add(project_path, arcname=project_path.name)

            # Upload archive to S3
            import boto3

            s3_client = boto3.client("s3")
            s3_client.upload_file(temp_archive, s3_bucket, s3_key)

            # Clean up local archive
            os.unlink(temp_archive)

            self.logger.info(f"Project files uploaded to S3: s3://{s3_bucket}/{s3_key}")
            return True, None

        except Exception as e:
            error_msg = f"Project file upload to S3 failed: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg

    async def start_scaffolding(
            self,
            prompt: str,
            project_path: Optional[str] = None,
            s3_bucket: Optional[str] = None,
            s3_key: Optional[str] = None,
            allowed_tools: Optional[List[str]] = None,
            model: str = "sonnet",
            max_turns: int = 50,
            upload_to_s3: Optional[Dict[str, Any]] = None,
            push_to_github: Optional[Dict[str, Any]] = None,
            create_download: bool = False,
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Start scaffolding session on EC2 instance.

        Args:
            prompt: Scaffolding prompt
            project_path: Local project path (will be uploaded to S3 if provided)
            s3_bucket: S3 bucket name (if None and project_path provided, will generate)
            s3_key: S3 object key (if None and project_path provided, will generate)
            allowed_tools: List of allowed tools
            model: Claude model to use
            max_turns: Maximum number of turns
            upload_to_s3: S3 upload configuration
            push_to_github: GitHub push configuration
            create_download: Create downloadable archive

        Returns:
            Tuple of (session_id, error_message)
        """
        request_id = str(uuid.uuid4())

        self.logger.info(f"Starting Claude Code scaffolding on EC2 for request: {request_id}")

        try:
            # If project_path provided, upload to S3 first
            if project_path:
                if not s3_bucket or not s3_key:
                    # For scaffolding: use upload_to_s3 bucket if provided, otherwise auto-resolve
                    # This keeps project analysis separate (which uses s3_bucket/s3_key directly)
                    if not s3_bucket:
                        if upload_to_s3 and upload_to_s3.get("bucket"):
                            s3_bucket = upload_to_s3["bucket"]
                        else:
                            s3_bucket = os.getenv(
                                "EC2_CLAUDE_CODE_S3_BUCKET") or self._resolve_default_s3_bucket() or "ace-claude-code"

                    if not s3_key:
                        s3_key = f"projects/{request_id}/{Path(project_path).name}.tar.gz"

                self.logger.info(f"Uploading project files to S3: s3://{s3_bucket}/{s3_key}")
                sync_success, sync_error = await self.sync_project_files_to_s3(
                    project_path, s3_bucket, s3_key
                )

                if not sync_success:
                    return None, f"Failed to upload project files to S3: {sync_error}"

                # Use S3-based endpoint
                scaffold_request = ScaffoldS3Request(
                    prompt=prompt,
                    s3_bucket=s3_bucket,
                    s3_key=s3_key,
                    allowed_tools=allowed_tools or ["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"],
                    model=model,
                    max_turns=max_turns,
                    upload_to_s3=upload_to_s3,
                    push_to_github=push_to_github,
                    create_download=create_download,
                    metadata={
                        "local_project_path": str(project_path),
                        "prompt_length": len(prompt),
                        "timestamp": datetime.now(UTC).isoformat(),
                        "upload_to_s3": upload_to_s3,
                        "push_to_github": push_to_github,
                        "create_download": create_download,
                    },
                )

                execute_url = f"http://{self.config.ec2_host}:{self.config.ec2_port}/api/v1/scaffold-s3"
            else:
                # Use direct endpoint (no project files)
                # Use temp directory from env or default
                temp_dir = os.getenv("EC2_CLAUDE_CODE_TEMP_DIR", "/tmp/claude-scaffold")
                working_dir = f"{temp_dir}/{request_id}"

                scaffold_request = ScaffoldRequest(
                    prompt=prompt,
                    working_directory=working_dir,
                    allowed_tools=allowed_tools or ["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"],
                    model=model,
                    max_turns=max_turns,
                    upload_to_s3=upload_to_s3,
                    push_to_github=push_to_github,
                    create_download=create_download,
                    metadata={
                        "prompt_length": len(prompt),
                        "timestamp": datetime.now(UTC).isoformat(),
                        "upload_to_s3": upload_to_s3,
                        "push_to_github": push_to_github,
                        "create_download": create_download,
                    },
                )

                execute_url = f"http://{self.config.ec2_host}:{self.config.ec2_port}/api/v1/scaffold"

            # Start scaffolding on EC2 instance
            self.logger.info(f"Starting scaffolding on EC2 instance...")
            request_data = scaffold_request.dict()
            # self.logger.info(f"Request data keys: {list(request_data.keys())}")
            # self.logger.info(f"upload_to_s3 in request: {request_data.get('upload_to_s3')}")
            # self.logger.info(f"metadata in request: {request_data.get('metadata')}")
            # self.logger.info(f"Full request_data: {request_data}")

            response = await self.http_client.post(
                execute_url,
                json=request_data,
                timeout=self.config.timeout + 30,  # Add buffer for network overhead
            )

            if response.status_code == 200:
                result = ScaffoldResponse(**response.json())
                self.logger.info(f"Scaffolding started successfully on EC2: {result.session_id}")
                return result.session_id, None
            else:
                error_msg = f"EC2 scaffolding request failed: {response.status_code} - {response.text}"
                self.logger.error(error_msg)
                return None, error_msg

        except httpx.TimeoutException:
            error_msg = f"EC2 scaffolding request timed out after {self.config.timeout}s"
            self.logger.error(error_msg)
            return None, error_msg
        except Exception as e:
            error_msg = f"EC2 scaffolding request failed: {str(e)}"
            self.logger.error(error_msg)
            return None, error_msg

    async def get_session_status(self, session_id: str) -> Tuple[Optional[SessionStatusResponse], Optional[str]]:
        """
        Get session status from EC2 instance.

        Args:
            session_id: Session identifier

        Returns:
            Tuple of (SessionStatusResponse, error_message)
        """
        try:
            status_url = f"http://{self.config.ec2_host}:{self.config.ec2_port}/api/v1/sessions/{session_id}"
            response = await self.http_client.get(status_url, timeout=30)

            if response.status_code == 200:
                return SessionStatusResponse(**response.json()), None
            elif response.status_code == 404:
                return None, "Session not found"
            else:
                error_msg = f"Failed to get session status: {response.status_code} - {response.text}"
                return None, error_msg

        except Exception as e:
            error_msg = f"Failed to get session status: {str(e)}"
            self.logger.error(error_msg)
            return None, error_msg

    async def approve_action(
            self, session_id: str, approved: bool, message: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Approve or reject pending action.

        Args:
            session_id: Session identifier
            approved: Whether to approve
            message: Optional message

        Returns:
            Tuple of (success, error_message)
        """
        try:
            approve_url = (
                f"http://{self.config.ec2_host}:{self.config.ec2_port}/api/v1/sessions/{session_id}/approve"
            )
            response = await self.http_client.post(
                approve_url,
                json={"approved": approved, "message": message},
                timeout=30,
            )

            if response.status_code == 200:
                return True, None
            elif response.status_code == 404:
                return False, "Session not found"
            elif response.status_code == 400:
                return False, response.json().get("detail", "Bad request")
            else:
                error_msg = f"Failed to approve action: {response.status_code} - {response.text}"
                return False, error_msg

        except Exception as e:
            error_msg = f"Failed to approve action: {str(e)}"
            self.logger.error(error_msg)
            return False, error_msg

    async def cleanup_s3_object(self, s3_bucket: str, s3_key: str) -> bool:
        """
        Clean up S3 object that was uploaded for EC2 execution.

        Args:
            s3_bucket: S3 bucket name
            s3_key: S3 object key

        Returns:
            True if cleanup successful, False otherwise
        """
        try:
            import boto3
            from botocore.exceptions import ClientError

            s3_client = boto3.client("s3")
            s3_client.delete_object(Bucket=s3_bucket, Key=s3_key)
            self.logger.info(f"S3 object cleaned up successfully: s3://{s3_bucket}/{s3_key}")
            return True
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            if error_code == "NoSuchKey":
                self.logger.info(f"S3 object already deleted: s3://{s3_bucket}/{s3_key}")
                return True
            self.logger.warning(f"Failed to cleanup S3 object s3://{s3_bucket}/{s3_key}: {error_code}")
            return False
        except Exception as e:
            self.logger.warning(f"S3 cleanup failed: {str(e)}")
            return False

    async def close(self):
        """Close HTTP client connections."""
        await self.http_client.aclose()


class EC2ClaudeCodeService:
    """
    Service class for EC2 Claude Code execution.

    This service provides a high-level interface for executing Claude Code scaffolding
    on EC2 instance.
    """

    def __init__(self, config: Optional[EC2ClaudeCodeConfig] = None):
        self.logger = logging.getLogger(__name__)
        self.executor = EC2ClaudeCodeExecutor(config)
        self.logger.info("EC2ClaudeCodeService initialized")

    async def start_scaffolding(
            self,
            prompt: str,
            project_path: Optional[str] = None,
            s3_bucket: Optional[str] = None,
            s3_key: Optional[str] = None,
            allowed_tools: Optional[List[str]] = None,
            model: str = "sonnet",
            max_turns: int = 50,
            upload_to_s3: Optional[Dict[str, Any]] = None,
            push_to_github: Optional[Dict[str, Any]] = None,
            create_download: bool = False,
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Start scaffolding with EC2 instance.

        Args:
            prompt: Scaffolding prompt
            project_path: Local project path
            s3_bucket: S3 bucket name
            s3_key: S3 object key
            allowed_tools: List of allowed tools
            model: Claude model to use
            max_turns: Maximum number of turns
            upload_to_s3: S3 upload configuration
            push_to_github: GitHub push configuration
            create_download: Create downloadable archive

        Returns:
            Tuple of (session_id, error_message)
        """
        try:
            self.logger.info(f"Starting Claude Code scaffolding on EC2 instance")

            # Validate EC2 connection first
            is_connected, error = await self.executor.validate_ec2_connection()
            if not is_connected:
                error_msg = f"EC2 connection failed: {error}"
                self.logger.error(error_msg)
                return None, error_msg

            # Start scaffolding on EC2
            session_id, error = await self.executor.start_scaffolding(
                prompt=prompt,
                project_path=project_path,
                s3_bucket=s3_bucket,
                s3_key=s3_key,
                allowed_tools=allowed_tools,
                model=model,
                max_turns=max_turns,
                upload_to_s3=upload_to_s3,
                push_to_github=push_to_github,
                create_download=create_download,
            )

            if session_id:
                self.logger.info("EC2 Claude Code scaffolding started successfully")
                return session_id, None
            else:
                error_msg = f"EC2 Claude Code scaffolding failed: {error}"
                self.logger.error(error_msg)
                return None, error_msg

        except Exception as e:
            error_msg = f"EC2 Claude Code scaffolding error: {str(e)}"
            self.logger.error(error_msg)
            return None, error_msg

    async def close(self):
        """Close the service and cleanup resources."""
        await self.executor.close()


# Convenience function for easy integration
async def start_claude_code_scaffolding_on_ec2(
        prompt: str,
        project_path: Optional[str] = None,
        s3_bucket: Optional[str] = None,
        s3_key: Optional[str] = None,
        config: Optional[EC2ClaudeCodeConfig] = None,
) -> Tuple[Optional[str], Optional[str]]:
    """
    Convenience function to start Claude Code scaffolding on EC2 instance.

    Args:
        prompt: Scaffolding prompt
        project_path: Local project path
        s3_bucket: S3 bucket name
        s3_key: S3 object key
        config: Optional EC2 configuration

    Returns:
        Tuple of (session_id, error_message)
    """
    service = EC2ClaudeCodeService(config)
    try:
        return await service.start_scaffolding(
            prompt=prompt, project_path=project_path, s3_bucket=s3_bucket, s3_key=s3_key
        )
    finally:
        await service.close()
