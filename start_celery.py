#!/usr/bin/env python3
"""
Celery startup script for Claude Code Wrapper.

Provides convenient commands to start Celery workers with appropriate settings
for different environments (local development, macOS, Linux, Docker).

Usage:
    # Start single worker (auto-detects platform)
    python start_celery.py

    # Start with custom concurrency
    python start_celery.py --concurrency 4

    # Start multiple workers
    python start_celery.py --workers 3

    # Start with specific queue
    python start_celery.py --queues claude_scaffold_high
"""

import argparse
import os
import subprocess
import sys
from typing import List, Optional


def get_platform_settings():
    """Get platform-specific Celery settings."""
    if sys.platform == "darwin":
        # macOS: Use solo pool to avoid fork issues with Objective-C runtime
        return {
            "pool": "solo",
            "default_concurrency": 1,
            "note": "macOS detected - using solo pool (no fork)"
        }
    elif sys.platform == "win32":
        # Windows: Use solo pool
        return {
            "pool": "solo",
            "default_concurrency": 1,
            "note": "Windows detected - using solo pool"
        }
    else:
        # Linux: Use prefork pool (default)
        return {
            "pool": "prefork",
            "default_concurrency": 2,
            "note": "Linux detected - using prefork pool"
        }


def start_worker(
    queues: Optional[List[str]] = None,
    concurrency: Optional[int] = None,
    loglevel: str = "info",
    pool: Optional[str] = None,
    detach: bool = False,
) -> subprocess.Popen:
    """
    Start a Celery worker.

    Args:
        queues: List of queues to consume from
        concurrency: Number of worker processes
        loglevel: Logging level
        pool: Pool type (prefork, solo, threads, eventlet, gevent)
        detach: Run in background

    Returns:
        Subprocess handle
    """
    platform_settings = get_platform_settings()

    # Build command
    cmd = [
        "celery",
        "-A", "worker",
        "worker",
        f"--loglevel={loglevel}",
    ]

    # Set concurrency
    effective_concurrency = concurrency or platform_settings["default_concurrency"]
    cmd.append(f"--concurrency={effective_concurrency}")

    # Set pool type
    effective_pool = pool or platform_settings["pool"]
    if effective_pool != "prefork":
        cmd.extend(["-P", effective_pool])

    # Set queues
    if queues:
        cmd.extend(["-Q", ",".join(queues)])

    # Detach mode
    if detach:
        cmd.append("--detach")

    print(f"Platform: {platform_settings['note']}")
    print(f"Starting: {' '.join(cmd)}")
    print()

    return subprocess.Popen(cmd)


def start_multiple_workers(
    count: int,
    queues: Optional[List[str]] = None,
    loglevel: str = "info",
) -> List[subprocess.Popen]:
    """
    Start multiple Celery workers for parallel execution.

    Args:
        count: Number of workers to start
        queues: List of queues to consume from
        loglevel: Logging level

    Returns:
        List of subprocess handles
    """
    processes = []
    platform_settings = get_platform_settings()

    print(f"Starting {count} workers...")
    print(f"Platform: {platform_settings['note']}")
    print()

    for i in range(count):
        cmd = [
            "celery",
            "-A", "worker",
            "worker",
            f"--loglevel={loglevel}",
            "--concurrency=1",  # One task per worker process
            "-P", platform_settings["pool"],
            f"--hostname=worker{i+1}@%h",
        ]

        if queues:
            cmd.extend(["-Q", ",".join(queues)])

        print(f"Starting worker {i+1}: {' '.join(cmd)}")
        proc = subprocess.Popen(cmd)
        processes.append(proc)

    return processes


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Start Celery workers for Claude Code Wrapper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python start_celery.py                    # Start single worker
  python start_celery.py --workers 3        # Start 3 workers
  python start_celery.py --concurrency 4    # Single worker with 4 processes
  python start_celery.py --queues claude_scaffold_high  # Specific queue
        """
    )

    parser.add_argument(
        "--workers", "-w",
        type=int,
        default=1,
        help="Number of workers to start (default: 1)"
    )
    parser.add_argument(
        "--concurrency", "-c",
        type=int,
        help="Concurrency per worker (default: auto-detect based on platform)"
    )
    parser.add_argument(
        "--queues", "-Q",
        nargs="+",
        help="Queues to consume from"
    )
    parser.add_argument(
        "--loglevel", "-l",
        default="info",
        choices=["debug", "info", "warning", "error"],
        help="Log level (default: info)"
    )
    parser.add_argument(
        "--pool", "-P",
        choices=["prefork", "solo", "threads", "eventlet", "gevent"],
        help="Pool type (default: auto-detect based on platform)"
    )
    parser.add_argument(
        "--detach", "-d",
        action="store_true",
        help="Run workers in background"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("Claude Code Wrapper - Celery Worker Launcher")
    print("=" * 60)
    print()

    try:
        if args.workers > 1:
            # Start multiple workers
            processes = start_multiple_workers(
                count=args.workers,
                queues=args.queues,
                loglevel=args.loglevel,
            )
            print()
            print(f"Started {len(processes)} workers")
            print("Press Ctrl+C to stop all workers")

            # Wait for all processes
            try:
                for proc in processes:
                    proc.wait()
            except KeyboardInterrupt:
                print("\nStopping workers...")
                for proc in processes:
                    proc.terminate()
        else:
            # Start single worker
            proc = start_worker(
                queues=args.queues,
                concurrency=args.concurrency,
                loglevel=args.loglevel,
                pool=args.pool,
                detach=args.detach,
            )

            if not args.detach:
                print("Press Ctrl+C to stop worker")
                try:
                    proc.wait()
                except KeyboardInterrupt:
                    print("\nStopping worker...")
                    proc.terminate()

    except FileNotFoundError:
        print("ERROR: Celery not found. Install with: pip install celery[redis]")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
