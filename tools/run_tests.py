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
import re
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


_BUNDLE_DIR_RE = re.compile(r"^crystord-interface-v(\d+)\.(\d+)\.(\d+)$")


def _find_latest_bundle(bundles_dir):
    """Return (verify_script, archive_file, version) for the highest-versioned bundle."""
    candidates = []
    if not bundles_dir.exists():
        return None
    for entry in bundles_dir.iterdir():
        if not entry.is_dir():
            continue
        match = _BUNDLE_DIR_RE.fullmatch(entry.name)
        if not match:
            continue
        version = ".".join(match.groups())
        archive = entry / f"crystord-interface-v{version}.tgz"
        verify = entry / "verify.py"
        if archive.exists() and verify.exists():
            candidates.append((tuple(int(g) for g in match.groups()), verify, archive, version))

    if not candidates:
        return None
    candidates.sort(key=lambda c: c[0], reverse=True)
    _, verify, archive, version = candidates[0]
    return verify, archive, version


def run_interface_preflight():
    """Verify the newest backend interface bundle against the client-supported schema range.

    Auto-discovers the highest-versioned bundle dropped under docs/backend-integration/
    and verifies it with a range derived from the bundle's own major version
    (^MAJOR.0.0), mirroring tools/install_interface.py and the crystord_access installer.
    """
    root = Path(os.getcwd())
    bundles_dir = root / "docs" / "backend-integration"

    latest = _find_latest_bundle(bundles_dir)
    if latest is None:
        print(
            "Skipping backend interface preflight: no interface bundle found "
            "under docs/backend-integration/."
        )
        return True

    verify_script, archive_file, version = latest
    supported_range = f"^{version.split('.')[0]}.0.0"

    command = (
        f'python3 "{verify_script}" "{archive_file}" '
        f'--supported-range "{supported_range}" --json'
    )
    return run_command(
        command, f"backend interface compatibility preflight (v{version})"
    )

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
        print("Running full test suite (--all)...")
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
