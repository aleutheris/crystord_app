#!/usr/bin/env python3
"""Run the Crystord web development server.

This script launches the normal Vite development server via npm.

An optional profile name may be passed as the first argument to select which
deploy_config.json profile is used to generate config.json:

    ./serve              # uses the "active" profile from deploy_config.json
    ./serve local        # overrides to the "local" profile

When no profile is given, CRYSTORD_PROFILE is left unset and scripts/config.mjs
falls back to deploy_config.json's "active" field.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys


def main() -> int:
    npm_executable = shutil.which("npm")
    if npm_executable is None:
        print("Error: npm is not installed or not available in PATH.", file=sys.stderr)
        return 1

    env = os.environ.copy()
    args = sys.argv[1:]
    if args:
        env["CRYSTORD_PROFILE"] = args[0]

    command = [npm_executable, "run", "dev"]
    try:
        return subprocess.call(command, env=env)
    except OSError as exc:
        print(f"Failed to execute {command}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
