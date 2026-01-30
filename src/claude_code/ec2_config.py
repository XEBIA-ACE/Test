"""
EC2 Configuration for Claude Code Wrapper Service.

Configuration class matching the pattern from project-analysis service.
"""

import os
from dataclasses import dataclass
from urllib.parse import urlparse

try:
    from x_sdlc_core.settings import get_unified_config

    CORE_AVAILABLE = True
except ImportError:
    CORE_AVAILABLE = False


@dataclass
class EC2ClaudeCodeConfig:
    """Configuration for EC2 Claude Code execution."""

    ec2_host: str
    ec2_port: int = 8080
    ec2_api_path: str = "/api/v1/scaffold"
    timeout: int = 600  # Longer timeout for scaffolding
    max_retries: int = 3
    retry_delay: float = 1.0
    temp_dir: str = "/tmp/claude-scaffold"

    @classmethod
    def from_env(cls) -> "EC2ClaudeCodeConfig":
        """
        Get configuration from environment variables.

        Normalizes EC2_CLAUDE_CODE_HOST (strips scheme, optional port) and supports EC2_CLAUDE_CODE_BASE_URL.
        """
        if CORE_AVAILABLE:
            cfg = get_unified_config()
            base_url = os.getenv("EC2_CLAUDE_CODE_BASE_URL")
            env_host = os.getenv("EC2_CLAUDE_CODE_HOST", getattr(cfg, "EC2_CLAUDE_CODE_HOST", None))
            env_port = os.getenv("EC2_CLAUDE_CODE_PORT") or str(
                getattr(cfg, "EC2_CLAUDE_CODE_PORT", 8080)
            )
        else:
            base_url = os.getenv("EC2_CLAUDE_CODE_BASE_URL")
            env_host = os.getenv("EC2_CLAUDE_CODE_HOST")
            env_port = os.getenv("EC2_CLAUDE_CODE_PORT", "8080")

        resolved_host = env_host.strip() if env_host else "localhost"
        resolved_port = int(env_port) if env_port else 8080

        if base_url:
            parsed = urlparse(base_url)
            if parsed.hostname:
                resolved_host = parsed.hostname
            if parsed.port:
                resolved_port = parsed.port
        else:
            # If EC2_CLAUDE_CODE_HOST includes scheme or port, normalize
            if env_host and "://" in env_host:
                parsed = urlparse(env_host, scheme="http")
                if parsed.hostname:
                    resolved_host = parsed.hostname
                if parsed.port and not env_port:
                    resolved_port = parsed.port

        return cls(
            ec2_host=resolved_host,
            ec2_port=resolved_port,
            ec2_api_path=os.getenv("EC2_CLAUDE_CODE_API_PATH", "/api/v1/scaffold"),
            timeout=int(os.getenv("EC2_CLAUDE_CODE_TIMEOUT", "600")),
            max_retries=int(os.getenv("EC2_CLAUDE_CODE_MAX_RETRIES", "3")),
            retry_delay=float(os.getenv("EC2_CLAUDE_CODE_RETRY_DELAY", "1.0")),
            temp_dir=os.getenv("EC2_CLAUDE_CODE_TEMP_DIR", "/tmp/claude-scaffold"),
        )
