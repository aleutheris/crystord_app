#!/usr/bin/env python3
"""
Test runner script for Crystord Web project.

Usage:
    python run_tests.py --help
    python run_tests.py --unit
    python run_tests.py --e2e
    python run_tests.py --all
    python run_tests.py --unit --watch
"""

import argparse
import json
from pathlib import Path
import subprocess
import sys
import os

def run_command(command, description):
    """Run a shell command and print status."""
    print(f"Running {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, cwd=os.getcwd())
        print(f"{description} completed successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error running {description}: {e}")
        return False


def run_interface_preflight():
    """Verify the bundled backend interface against the client-supported schema range."""
    root = Path(os.getcwd())
    policy_file = root / "docs" / "backend-integration" / "client-schema-policy.json"
    verify_script = root / "backend_intf" / "crystord-interface-v1.1.0" / "verify.py"
    archive_file = root / "backend_intf" / "crystord-interface-v1.1.0" / "crystord-interface-v1.1.0.tgz"

    if not policy_file.exists():
        print(f"Interface preflight failed: missing policy file at {policy_file}")
        return False

    try:
        policy = json.loads(policy_file.read_text(encoding="utf-8"))
        supported_range = policy["supportedSchemaRange"]
    except (json.JSONDecodeError, KeyError) as exc:
        print(f"Interface preflight failed: invalid policy file ({exc})")
        return False

    if not verify_script.exists() or not archive_file.exists():
        print("Interface preflight failed: verify script or bundle archive is missing.")
        return False

    command = (
        f'python3 "{verify_script}" "{archive_file}" '
        f'--supported-range "{supported_range}" --json'
    )
    return run_command(command, "backend interface compatibility preflight")

def main():
    parser = argparse.ArgumentParser(
        description="Run tests for Crystord Web project",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py --unit          # Run unit/component tests once
  python run_tests.py --unit --watch  # Run unit tests in watch mode
  python run_tests.py --e2e           # Run E2E tests
  python run_tests.py --all           # Run all tests (unit + E2E)
        """
    )

    parser.add_argument(
        '--unit',
        action='store_true',
        help='Run unit/component tests (Vitest)'
    )

    parser.add_argument(
        '--e2e',
        action='store_true',
        help='Run end-to-end tests (Playwright)'
    )

    parser.add_argument(
        '--all',
        action='store_true',
        help='Run all tests (unit + E2E)'
    )

    parser.add_argument(
        '--watch',
        action='store_true',
        help='Run unit tests in watch mode (only with --unit)'
    )

    args = parser.parse_args()

    if not any([args.unit, args.e2e, args.all]):
        parser.print_help()
        sys.exit(1)

    success = True

    if args.all:
        if not run_interface_preflight():
            success = False
        # Run unit tests first
        if success and not run_command("npm run test", "unit/component tests"):
            success = False
        # Then E2E tests
        if success and not run_command("npm run test:e2e", "E2E tests"):
            success = False
    elif args.unit:
        if args.watch:
            # Watch mode doesn't return, so just run it
            print("Running unit tests in watch mode...")
            subprocess.run("npm run test:watch", shell=True, cwd=os.getcwd())
        else:
            success = run_command("npm run test", "unit/component tests")
    elif args.e2e:
        success = run_command("npm run test:e2e", "E2E tests")

    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
