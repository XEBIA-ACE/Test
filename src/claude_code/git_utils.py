"""
Git utilities for Claude Code Wrapper Service.

Handles Git repository cloning, info extraction, and validation.
"""

import asyncio
import logging
import os
from pathlib import Path
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Configuration
CLONE_TIMEOUT = int(os.getenv("CLONE_TIMEOUT", "600"))  # 10 minutes
MAX_REPO_SIZE_GB = float(os.getenv("MAX_REPO_SIZE_GB", "5"))  # Maximum repo size


def get_repo_name_from_url(git_url: str) -> str:
    """
    Extract repository name from Git URL.

    Args:
        git_url: Git repository URL

    Returns:
        Repository name
    """
    url = git_url.rstrip("/")
    if url.endswith(".git"):
        url = url[:-4]
    return url.split("/")[-1]


def get_directory_size(path: Path) -> float:
    """
    Get directory size in GB.

    Args:
        path: Directory path

    Returns:
        Size in GB
    """
    try:
        total_size = sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
        return round(total_size / (1024 ** 3), 2)
    except Exception as e:
        logger.error(f"Failed to get directory size: {e}")
        return 0.0


async def get_git_info(repo_path: Path) -> Dict[str, str]:
    """
    Get Git repository information.

    Args:
        repo_path: Path to Git repository

    Returns:
        Dictionary with commit, branch, and remote_url
    """
    result = {"commit": "unknown", "branch": "unknown", "remote_url": "unknown"}

    try:
        # Get commit
        proc = await asyncio.create_subprocess_exec(
            "git",
            "rev-parse",
            "HEAD",
            cwd=str(repo_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        if proc.returncode == 0:
            result["commit"] = stdout.decode().strip()

        # Get branch
        proc = await asyncio.create_subprocess_exec(
            "git",
            "rev-parse",
            "--abbrev-ref",
            "HEAD",
            cwd=str(repo_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        if proc.returncode == 0:
            result["branch"] = stdout.decode().strip()

        # Get remote URL
        proc = await asyncio.create_subprocess_exec(
            "git",
            "config",
            "--get",
            "remote.origin.url",
            cwd=str(repo_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await proc.communicate()
        if proc.returncode == 0:
            result["remote_url"] = stdout.decode().strip()

    except Exception as e:
        logger.error(f"Failed to get git info: {e}")
        result["error"] = str(e)

    return result


async def clone_git_repo(
        git_url: str,
        dest_dir: Path,
        branch: Optional[str] = None,
        commit: Optional[str] = None,
        github_token: Optional[str] = None,
) -> Dict[str, str]:
    """
    Clone a Git repository with authentication and error handling.

    Args:
        git_url: Git repository URL
        dest_dir: Destination directory
        branch: Optional branch to checkout
        commit: Optional commit SHA to checkout
        github_token: Optional GitHub token for authentication

    Returns:
        Git info dictionary

    Raises:
        Exception: If clone fails
    """
    logger.info(f"Cloning repository: {git_url} -> {dest_dir}")

    env = os.environ.copy()
    git_url_with_token = git_url

    # Add GitHub token if provided and URL is GitHub
    if github_token and git_url.startswith("https://github.com"):
        git_url_with_token = git_url.replace("https://", f"https://{github_token}@")
        env["GH_TOKEN"] = github_token
        env["GITHUB_TOKEN"] = github_token

    cmd = ["git", "clone"]

    if branch:
        cmd += ["--branch", branch]

    cmd += ["--depth", "1", git_url_with_token, str(dest_dir)]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )

        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=CLONE_TIMEOUT)

        if proc.returncode != 0:
            err = stderr.decode("utf-8", errors="ignore") if stderr else "unknown git clone error"
            logger.error(f"Git clone failed: {err}")
            raise Exception(f"Git clone failed: {err}")

        logger.info(f"Repository cloned successfully to {dest_dir}")

        # Checkout specific commit if provided
        if commit:
            proc = await asyncio.create_subprocess_exec(
                "git",
                "checkout",
                commit,
                cwd=str(dest_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()
            if proc.returncode != 0:
                logger.warning(f"Failed to checkout commit {commit} — continuing")

        # Get Git info
        git_info = await get_git_info(dest_dir)

        # Check repository size
        repo_size = get_directory_size(dest_dir)
        logger.info(f"Repository size: {repo_size}GB")

        if repo_size > MAX_REPO_SIZE_GB:
            raise Exception(
                f"Repository too large: {repo_size}GB (max: {MAX_REPO_SIZE_GB}GB)"
            )

        return git_info

    except asyncio.TimeoutError:
        logger.error(f"Git clone timed out after {CLONE_TIMEOUT} seconds")
        raise Exception(f"Git clone timed out after {CLONE_TIMEOUT} seconds")
    except Exception as e:
        logger.error(f"Git clone exception: {e}")
        raise
