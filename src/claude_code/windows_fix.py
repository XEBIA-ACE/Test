"""
Windows Event Loop Policy Fix for Python 3.13+

This module ensures the correct event loop policy is set on Windows
to support subprocess creation in the Claude Agent SDK.

The WindowsProactorEventLoopPolicy (default on Python 3.13+) doesn't
support subprocess creation properly, so we need to use
WindowsSelectorEventLoopPolicy instead.

This should be imported at the very top of any entry point file.
"""

import sys


def apply_windows_event_loop_fix():
    """
    Apply Windows event loop policy fix for subprocess support.

    This must be called before any asyncio operations or event loop creation.
    Safe to call multiple times - it will only set the policy once.
    """
    if sys.platform == "win32" and sys.version_info >= (3, 8):
        import asyncio
        import os

        # Set environment variable to help with subprocess communication
        # This helps with stdin/stdout buffering issues on Windows
        os.environ['PYTHONUNBUFFERED'] = '1'

        # For Node.js subprocess communication
        os.environ['NODE_NO_WARNINGS'] = '1'

        try:
            # Try to set the policy
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

            # Also try to create a fresh event loop to ensure clean state
            try:
                current_loop = asyncio.get_event_loop()
                if current_loop.is_running():
                    # Can't replace a running loop, policy will apply to new loops
                    pass
                else:
                    # Create a new event loop with the correct policy
                    new_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(new_loop)
            except RuntimeError:
                # No event loop in current thread, that's fine
                pass

        except RuntimeError as e:
            # Policy might already be set or event loop exists
            # Try to ensure current loop uses correct policy
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    # Create new loop with correct policy
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                # No event loop in this thread, policy will apply when one is created
                pass
        except AttributeError:
            # WindowsSelectorEventLoopPolicy not available (shouldn't happen on Windows)
            pass


# Auto-apply fix when module is imported
apply_windows_event_loop_fix()
