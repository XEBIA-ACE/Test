#!/usr/bin/env python3
"""
Environment diagnostic script for Claude Code Wrapper.

This script helps diagnose issues with command execution in the Claude Agent SDK environment.
"""

import asyncio
import logging
import os
import subprocess
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def test_basic_commands():
    """Test basic command execution."""
    logger.info("=== Testing Basic Commands ===")

    commands = [
        ["which", "bash"],
        ["which", "sh"],
        ["which", "node"],
        ["which", "npm"],
        ["which", "git"],
        ["pwd"],
        ["whoami"],
        ["id"],
        ["ls", "-la", "/tmp"],
        ["echo", "Hello World"],
        ["bash", "-c", "echo 'Bash test'"],
        ["sh", "-c", "echo 'Shell test'"],
    ]

    results = {}
    for cmd in commands:
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10,
                cwd="/app"
            )
            results[" ".join(cmd)] = {
                "returncode": result.returncode,
                "stdout": result.stdout.strip(),
                "stderr": result.stderr.strip(),
                "success": result.returncode == 0
            }
            status = "✅" if result.returncode == 0 else "❌"
            logger.info(f"{status} {' '.join(cmd)}: {result.returncode}")
            if result.stdout.strip():
                logger.info(f"   stdout: {result.stdout.strip()}")
            if result.stderr.strip():
                logger.info(f"   stderr: {result.stderr.strip()}")
        except Exception as e:
            results[" ".join(cmd)] = {
                "returncode": -1,
                "stdout": "",
                "stderr": str(e),
                "success": False
            }
            logger.error(f"❌ {' '.join(cmd)}: Exception - {e}")

    return results


def test_environment_variables():
    """Test environment variables."""
    logger.info("=== Testing Environment Variables ===")

    important_vars = [
        "PATH",
        "HOME",
        "USER",
        "SHELL",
        "PWD",
        "ANTHROPIC_API_KEY",
        "NODE_PATH",
        "NPM_CONFIG_PREFIX"
    ]

    for var in important_vars:
        value = os.getenv(var, "NOT SET")
        if var == "ANTHROPIC_API_KEY" and value != "NOT SET":
            # Mask the API key for security
            masked_value = f"{value[:10]}...{value[-10:]}" if len(value) > 20 else "SET"
            logger.info(f"{var}: {masked_value}")
        else:
            logger.info(f"{var}: {value}")


def test_file_permissions():
    """Test file system permissions."""
    logger.info("=== Testing File Permissions ===")

    test_paths = [
        "/app",
        "/tmp",
        "/tmp/claude-scaffold",
        "/usr/local/bin",
        "/bin",
        "/usr/bin"
    ]

    for path in test_paths:
        path_obj = Path(path)
        try:
            exists = path_obj.exists()
            is_dir = path_obj.is_dir() if exists else False
            is_readable = os.access(path, os.R_OK) if exists else False
            is_writable = os.access(path, os.W_OK) if exists else False
            is_executable = os.access(path, os.X_OK) if exists else False

            status = "✅" if exists else "❌"
            perms = []
            if is_readable: perms.append("R")
            if is_writable: perms.append("W")
            if is_executable: perms.append("X")

            logger.info(f"{status} {path}: exists={exists}, dir={is_dir}, perms={''.join(perms) or 'NONE'}")

            # Try to create a test file in writable directories
            if is_writable and is_dir:
                test_file = path_obj / "test_write.txt"
                try:
                    test_file.write_text("test")
                    test_file.unlink()
                    logger.info(f"   ✅ Write test successful")
                except Exception as e:
                    logger.error(f"   ❌ Write test failed: {e}")

        except Exception as e:
            logger.error(f"❌ {path}: Error checking - {e}")


def test_claude_agent_sdk():
    """Test Claude Agent SDK availability and basic functionality."""
    logger.info("=== Testing Claude Agent SDK ===")

    try:
        from claude_agent_sdk import query, ClaudeAgentOptions
        logger.info("✅ Claude Agent SDK import successful")

        # Test basic options creation
        try:
            import os
            current_dir = os.getcwd()

            options = ClaudeAgentOptions(
                max_turns=1,
                allowed_tools=["Read"],
                cwd=current_dir,
                system_prompt={"type": "preset", "preset": "claude_code"},
            )
            logger.info("✅ ClaudeAgentOptions creation successful")
        except Exception as e:
            logger.error(f"❌ ClaudeAgentOptions creation failed: {e}")

    except ImportError as e:
        logger.error(f"❌ Claude Agent SDK import failed: {e}")


async def test_simple_claude_query():
    """Test a simple Claude query that shouldn't require command execution."""
    logger.info("=== Testing Simple Claude Query ===")

    try:
        from claude_agent_sdk import query, ClaudeAgentOptions

        # Create a simple query that should not require bash commands
        # Use current directory instead of /app
        import os
        current_dir = os.getcwd()

        options = ClaudeAgentOptions(
            max_turns=1,
            allowed_tools=["Read"],  # Only allow reading, no bash
            cwd=current_dir,
            system_prompt={"type": "preset", "preset": "claude_code"},
        )

        simple_prompt = "Please just say hello and explain what you can do. Do not execute any commands."

        logger.info("Sending simple query to Claude...")
        messages = []

        try:
            async for message in query(prompt=simple_prompt, options=options):
                logger.info(f"Received message type: {type(message).__name__}")
                if hasattr(message, 'content'):
                    logger.info(f"Message content preview: {str(message.content)[:200]}...")
                messages.append(message)

            logger.info(f"✅ Simple Claude query completed successfully. Received {len(messages)} messages.")

        except Exception as e:
            logger.error(f"❌ Simple Claude query failed: {e}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")

    except ImportError:
        logger.error("❌ Cannot test Claude query - SDK not available")


def test_working_directory_setup():
    """Test working directory setup and permissions."""
    logger.info("=== Testing Working Directory Setup ===")

    test_dir = Path("/tmp/claude-scaffold/test-session")

    try:
        # Create test directory
        test_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Created test directory: {test_dir}")

        # Test file operations
        test_file = test_dir / "test.txt"
        test_file.write_text("Hello, World!")
        content = test_file.read_text()
        logger.info(f"✅ File operations successful: {content}")

        # Test subdirectory creation
        sub_dir = test_dir / "subdir"
        sub_dir.mkdir(exist_ok=True)
        logger.info(f"✅ Subdirectory creation successful")

        # Test command execution in the directory
        result = subprocess.run(
            ["ls", "-la"],
            cwd=str(test_dir),
            capture_output=True,
            text=True
        )

        if result.returncode == 0:
            logger.info(f"✅ Command execution in working directory successful")
            logger.info(f"   Directory contents: {result.stdout.strip()}")
        else:
            logger.error(f"❌ Command execution failed: {result.stderr}")

        # Cleanup
        import shutil
        shutil.rmtree(test_dir)
        logger.info(f"✅ Cleanup successful")

    except Exception as e:
        logger.error(f"❌ Working directory test failed: {e}")


async def main():
    """Run all diagnostic tests."""
    logger.info("Starting Claude Code Wrapper Environment Diagnostics")
    logger.info("=" * 60)

    # Basic system info
    logger.info(f"Python version: {sys.version}")
    logger.info(f"Platform: {sys.platform}")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Process ID: {os.getpid()}")
    logger.info(f"User ID: {os.getuid() if hasattr(os, 'getuid') else 'N/A'}")
    logger.info("=" * 60)

    # Run tests
    test_environment_variables()
    test_file_permissions()
    test_basic_commands()
    test_working_directory_setup()
    test_claude_agent_sdk()
    await test_simple_claude_query()

    logger.info("=" * 60)
    logger.info("Diagnostics completed!")


if __name__ == "__main__":
    asyncio.run(main())
