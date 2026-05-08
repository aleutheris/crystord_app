#!/usr/bin/env python3
"""Run the Crystord web development server.

This script launches the normal Vite development server via npm.
"""

from __future__ import annotations

import shutil
import subprocess
import sys


def main() -> int:
    npm_executable = shutil.which("npm")
    if npm_executable is None:
        print("Error: npm is not installed or not available in PATH.", file=sys.stderr)
        return 1

    command = [npm_executable, "run", "dev"]
    try:
        return subprocess.call(command)
    except OSError as exc:
        print(f"Failed to execute {command}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
