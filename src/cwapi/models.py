"""
Pydantic models for Claude Code API requests and responses.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class ScaffoldRequest(BaseModel):
    """Request model for starting a scaffolding session."""

    prompt: str = Field(..., description="Scaffolding prompt")
    working_directory: str = Field(default=".", description="Working directory for project")
    allowed_tools: List[str] = Field(
        default=["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"],
        description="List of allowed tools",
    )
    model: str = Field(default="sonnet", description="Claude model to use")
    max_turns: int = Field(default=50, description="Maximum number of turns")
    session_id: Optional[str] = Field(None, description="Optional session ID (if not provided, will be generated)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    # Storage options
    upload_to_s3: Optional[Dict[str, Any]] = Field(
        None,
        description="[DEPRECATED] Upload generated code to S3. Use 'upload_to_cloud_storage' instead. Format: {'bucket': 'bucket-name', 'key': 'path/to/key', 'format': 'zip'|'tar.gz'}",
    )
    upload_to_cloud_storage: Optional[Dict[str, Any]] = Field(
        None,
        description="Upload generated code to cloud storage (S3, GCS, or Azure Blob). Format: {'provider': 's3'|'gcs'|'azure', 'bucket': 'bucket-name', 'key': 'path/to/key', 'format': 'zip'|'tar.gz', ...}. Provider-specific options: S3: {'aws_region': 'us-east-1'}, GCS: {'gcp_project_id': 'project-id'}, Azure: {'connection_string': '...'} or {'account_name': '...', 'account_key': '...'}",
    )
    push_to_github: Optional[Dict[str, Any]] = Field(
        None,
        description="Push generated code to GitHub. Format: {'repo_name': 'my-service', 'branch': 'main', 'commit_message': '...', 'private': true|false} OR {'repo_url': 'https://github.com/user/repo.git', ...}. If repo_name is provided, repo will be auto-created. If neither repo_name nor repo_url is provided, uses metadata.service_name as repo name.",
    )
    create_download: bool = Field(
        False, description="Create downloadable archive after completion"
    )


class ScaffoldS3Request(BaseModel):
    """Request model for S3-based scaffolding session."""

    prompt: str = Field(..., description="Scaffolding prompt")
    s3_bucket: str = Field(..., description="S3 bucket containing project files")
    s3_key: str = Field(..., description="S3 key for project archive")
    session_id: Optional[str] = Field(None, description="Optional session ID (if not provided, will be generated)")
    allowed_tools: List[str] = Field(
        default=["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"],
        description="List of allowed tools",
    )
    model: str = Field(default="sonnet", description="Claude model to use")
    max_turns: int = Field(default=50, description="Maximum number of turns")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    # Storage options
    upload_to_s3: Optional[Dict[str, Any]] = Field(
        None,
        description="[DEPRECATED] Upload generated code to S3. Use 'upload_to_cloud_storage' instead. Format: {'bucket': 'bucket-name', 'key': 'path/to/key', 'format': 'zip'|'tar.gz'}",
    )
    upload_to_cloud_storage: Optional[Dict[str, Any]] = Field(
        None,
        description="Upload generated code to cloud storage (S3, GCS, or Azure Blob). Format: {'provider': 's3'|'gcs'|'azure', 'bucket': 'bucket-name', 'key': 'path/to/key', 'format': 'zip'|'tar.gz', ...}. Provider-specific options: S3: {'aws_region': 'us-east-1'}, GCS: {'gcp_project_id': 'project-id'}, Azure: {'connection_string': '...'} or {'account_name': '...', 'account_key': '...'}",
    )
    push_to_github: Optional[Dict[str, Any]] = Field(
        None,
        description="Push generated code to GitHub. Format: {'repo_name': 'my-service', 'branch': 'main', 'commit_message': '...', 'private': true|false} OR {'repo_url': 'https://github.com/user/repo.git', ...}. If repo_name is provided, repo will be auto-created. If neither repo_name nor repo_url is provided, uses metadata.service_name as repo name.",
    )
    create_download: bool = Field(
        False, description="Create downloadable archive after completion"
    )


class ScaffoldResponse(BaseModel):
    """Response model for starting a scaffolding session."""

    session_id: str = Field(..., description="Session identifier")
    status: str = Field(..., description="Session status")
    message: str = Field(..., description="Status message")


class ApprovalResponse(BaseModel):
    """Response model for approval action."""

    approved: bool = Field(..., description="Whether to approve the action")
    message: Optional[str] = Field(None, description="Optional message with approval")


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
    # Storage information
    s3_url: Optional[str] = None
    gcs_url: Optional[str] = None
    azure_url: Optional[str] = None
    storage_url: Optional[str] = None  # Provider-agnostic storage URL
    github_url: Optional[str] = None
    download_url: Optional[str] = None
    # Celery task correlation (only in Celery mode)
    celery_task_id: Optional[str] = None


class SessionMessagesResponse(BaseModel):
    """Response model for session messages."""

    messages: List[Dict[str, Any]]
    total: int
    skip: int = 0
    limit: int = 100


class OneOffRequest(BaseModel):
    """Request model for one-off scaffolding (no approvals)."""

    prompt: str = Field(..., description="Scaffolding prompt")
    working_directory: str = Field(default=".", description="Working directory for project")
    callback_url: Optional[str] = Field(None, description="Webhook URL for results")
    skip_all_permissions: bool = Field(default=True, description="Skip all permission checks")
    allowed_tools: List[str] = Field(
        default=["Read", "Write", "Edit", "Bash", "Grep", "Glob"],
        description="List of allowed tools",
    )
    model: str = Field(default="sonnet", description="Claude model to use")
    max_turns: int = Field(default=50, description="Maximum number of turns")
    # Storage options
    upload_to_s3: Optional[Dict[str, Any]] = Field(
        None,
        description="Upload generated code to S3. Format: {'bucket': 'bucket-name', 'key': 'path/to/key', 'format': 'zip'|'tar.gz'}",
    )
    push_to_github: Optional[Dict[str, Any]] = Field(
        None,
        description="Push generated code to GitHub. Format: {'repo_name': 'my-service', 'branch': 'main', 'commit_message': '...', 'private': true|false} OR {'repo_url': 'https://github.com/user/repo.git', ...}. If repo_name is provided, repo will be auto-created. If neither repo_name nor repo_url is provided, uses metadata.service_name as repo name.",
    )
    create_download: bool = Field(
        False, description="Create downloadable archive after completion"
    )


class OneOffResponse(BaseModel):
    """Response model for one-off scaffolding."""

    status: str
    result: Optional[str] = None
    messages_count: int = 0
    error: Optional[str] = None
    s3_url: Optional[str] = None
    gcs_url: Optional[str] = None
    azure_url: Optional[str] = None
    storage_url: Optional[str] = None  # Provider-agnostic storage URL
    github_url: Optional[str] = None
    download_url: Optional[str] = None


class CleanupRequest(BaseModel):
    """Request model for cleanup."""

    path: str = Field(..., description="Path to clean up")


class FileUploadResponse(BaseModel):
    """Response model for file upload."""

    success: bool
    remote_path: Optional[str] = None
    error: Optional[str] = None
    file_size: int = 0


class S3DownloadResponse(BaseModel):
    """Response model for S3 download."""

    success: bool
    local_path: Optional[str] = None
    error: Optional[str] = None
    file_size: int = 0


class ScaffoldGitRequest(BaseModel):
    """Request model for Git-based scaffolding session."""

    prompt: str = Field(..., description="Scaffolding prompt")
    git_url: str = Field(..., description="Git repository URL (https, git@, or ssh://)")
    branch: Optional[str] = Field(None, description="Git branch to checkout")
    commit: Optional[str] = Field(None, description="Specific commit SHA to checkout")
    session_id: Optional[str] = Field(None, description="Optional session ID (if not provided, will be generated)")
    allowed_tools: List[str] = Field(
        default=["Read", "Write", "Edit", "Bash(npm:*)", "Bash(git:*)"],
        description="List of allowed tools",
    )
    model: str = Field(default="sonnet", description="Claude model to use")
    max_turns: int = Field(default=50, description="Maximum number of turns")
    cleanup_on_completion: bool = Field(default=True, description="Clean up repo after completion")
    s3_bucket: Optional[str] = Field(None, description="S3 bucket for results upload")
    s3_results_prefix: Optional[str] = Field("results", description="S3 prefix for results")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    # Storage options
    upload_to_s3: Optional[Dict[str, Any]] = Field(
        None,
        description="[DEPRECATED] Upload generated code to S3. Use 'upload_to_cloud_storage' instead. Format: {'bucket': 'bucket-name', 'key': 'path/to/key', 'format': 'zip'|'tar.gz'}",
    )
    upload_to_cloud_storage: Optional[Dict[str, Any]] = Field(
        None,
        description="Upload generated code to cloud storage (S3, GCS, or Azure Blob). Format: {'provider': 's3'|'gcs'|'azure', 'bucket': 'bucket-name', 'key': 'path/to/key', 'format': 'zip'|'tar.gz', ...}. Provider-specific options: S3: {'aws_region': 'us-east-1'}, GCS: {'gcp_project_id': 'project-id'}, Azure: {'connection_string': '...'} or {'account_name': '...', 'account_key': '...'}",
    )
    push_to_github: Optional[Dict[str, Any]] = Field(
        None,
        description="Push generated code to GitHub. Format: {'repo_name': 'my-service', 'branch': 'main', 'commit_message': '...', 'private': true|false} OR {'repo_url': 'https://github.com/user/repo.git', ...}. If repo_name is provided, repo will be auto-created. If neither repo_name nor repo_url is provided, uses metadata.service_name as repo name.",
    )
    create_download: bool = Field(
        False, description="Create downloadable archive after completion"
    )


class SystemStatusResponse(BaseModel):
    """Response model for system status."""

    status: str
    sdk_available: bool
    git_available: bool
    github_cli_available: bool
    anthropic_api_configured: bool
    github_token_configured: bool
    disk_usage: Dict[str, Any]
    temp_dir: str
    aws_region: str
    timestamp: str
    active_sessions: int
    total_sessions: int


# Compatibility models for EC2 script API
class CLIExecutionRequest(BaseModel):
    """Request model for CLI execution (compatibility with EC2 script)."""

    request_id: str
    prompt: str
    project_path: str
    output_file: Optional[str] = None
    timeout: int = 300
    backend: str = "claude"
    metadata: Dict[str, Any] = {}
    # Storage options
    upload_to_s3: Optional[Dict[str, Any]] = None
    push_to_github: Optional[Dict[str, Any]] = None
    create_download: bool = False

    @field_validator('timeout')
    @classmethod
    def validate_timeout(cls, v: int) -> int:
        """Validate timeout is within reasonable bounds."""
        if v < 10:
            raise ValueError("Timeout must be at least 10 seconds")
        if v > 3600:  # 1 hour max
            raise ValueError("Timeout cannot exceed 3600 seconds (1 hour)")
        return v


class CLIExecutionResponse(BaseModel):
    """Response model for CLI execution (compatibility with EC2 script)."""

    request_id: str
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    duration: float
    backend_used: str
    s3_url: Optional[str] = None
    gcs_url: Optional[str] = None
    azure_url: Optional[str] = None
    storage_url: Optional[str] = None  # Provider-agnostic storage URL
    git_info: Optional[Dict[str, str]] = None
    disk_usage: Optional[Dict[str, Any]] = None
    github_url: Optional[str] = None
    download_url: Optional[str] = None
    metadata: Dict[str, Any] = {}


class S3CLIExecutionRequest(BaseModel):
    """Request model for S3-based CLI execution (compatibility)."""

    request_id: str
    prompt: str
    s3_bucket: str
    s3_key: str
    output_file: Optional[str] = "analysis.txt"
    timeout: int = 300
    backend: str = "claude"
    s3_results_prefix: Optional[str] = "results"
    metadata: Dict[str, Any] = {}
    # Storage options
    upload_to_s3: Optional[Dict[str, Any]] = None
    push_to_github: Optional[Dict[str, Any]] = None
    create_download: bool = False


class GitCLIExecutionRequest(BaseModel):
    """Request model for Git-based CLI execution (compatibility)."""

    request_id: str
    prompt: str
    git_url: str
    branch: Optional[str] = None
    commit: Optional[str] = None
    output_file: Optional[str] = "analysis.txt"
    timeout: int = 300
    backend: str = "claude"
    s3_bucket: Optional[str] = None
    s3_results_prefix: Optional[str] = "results"
    cleanup_on_completion: bool = True
    metadata: Dict[str, Any] = {}
    # Storage options
    upload_to_s3: Optional[Dict[str, Any]] = None
    push_to_github: Optional[Dict[str, Any]] = None
    create_download: bool = False


class DownloadResponse(BaseModel):
    """Response model for download endpoint."""

    success: bool
    download_url: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error: Optional[str] = None
