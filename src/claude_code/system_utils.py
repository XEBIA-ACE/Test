"""
System utilities for Claude Code Wrapper Service.

Handles disk space checking and system status.
"""

import logging
import os
import shutil
from typing import Dict, Any

try:
    import psutil

    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)

# Configuration
MIN_FREE_SPACE_GB = int(os.getenv("MIN_FREE_SPACE_GB", "2"))  # Minimum free disk space required
TEMP_DIR = os.getenv("EC2_TEMP_DIR", "/tmp/claude-scaffold")


def check_disk_space() -> Dict[str, Any]:
    """
    Check disk space usage.

    Returns:
        Dictionary with disk usage information
    """
    if not PSUTIL_AVAILABLE:
        return {"error": "psutil not available", "available": False}

    try:
        usage = psutil.disk_usage(TEMP_DIR)
        return {
            "total_gb": round(usage.total / (1024 ** 3), 2),
            "used_gb": round(usage.used / (1024 ** 3), 2),
            "free_gb": round(usage.free / (1024 ** 3), 2),
            "percent_used": usage.percent,
            "available": True,
        }
    except Exception as e:
        logger.error(f"Failed to check disk space: {e}")
        return {"error": str(e), "available": False}


def ensure_sufficient_disk_space() -> bool:
    """
    Check if sufficient disk space is available.

    Returns:
        True if sufficient space available
    """
    disk_info = check_disk_space()
    if not disk_info.get("available", False) or "error" in disk_info:
        return False

    free_gb = disk_info.get("free_gb", 0)
    if free_gb < MIN_FREE_SPACE_GB:
        logger.error(
            f"Insufficient disk space: {free_gb}GB free, need {MIN_FREE_SPACE_GB}GB"
        )
        return False

    return True


def check_system_tools() -> Dict[str, bool]:
    """
    Check availability of system tools.

    Returns:
        Dictionary with tool availability
    """
    return {
        "git": shutil.which("git") is not None,
        "github_cli": shutil.which("gh") is not None,
    }
