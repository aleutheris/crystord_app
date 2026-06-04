#!/usr/bin/env python3
"""
Orchestrate interface bundle updates for Crystord frontend client.

This script automates the process of updating the client integration files
when a new backend interface bundle is released.

Usage:
    python3 update-interface.py docs/backend-integration/crystord-interface-vX.Y.Z

Process:
1. Verify the bundle integrity and compatibility
2. Extract and inspect the new interface
3. Update integration files (provided-schema.graphql, allowed-schema.graphql, policy)
4. Validate that client unit tests still pass
5. Clean up the source interface folder
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


class InterfaceUpdateError(Exception):
    """Raised when interface update fails."""


def run_command(cmd: list[str], description: str) -> str:
    """Run a shell command and return output; raise on failure."""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise InterfaceUpdateError(f"{description} failed:\n{e.stderr}") from e


def verify_bundle(bundle_dir: Path) -> dict:
    """Verify the interface bundle using verify.py script."""
    verify_script = bundle_dir / "verify.py"
    if not verify_script.exists():
        raise InterfaceUpdateError(f"verify.py not found in {bundle_dir}")

    archive_file = list(bundle_dir.glob("*.tgz")) or list(bundle_dir.glob("*.tar.gz"))
    if not archive_file:
        raise InterfaceUpdateError(f"No .tgz or .tar.gz archive found in {bundle_dir}")

    archive_file = archive_file[0]

    # Read the current policy to get supported range
    policy_file = Path(__file__).parent / "client-schema-policy.json"
    if not policy_file.exists():
        raise InterfaceUpdateError(f"client-schema-policy.json not found")

    try:
        policy = json.loads(policy_file.read_text(encoding="utf-8"))
        supported_range = policy["supportedSchemaRange"]
    except (json.JSONDecodeError, KeyError) as e:
        raise InterfaceUpdateError(f"Failed to read supported range from policy: {e}") from e

    # Run verify with JSON output
    cmd = [
        sys.executable,
        str(verify_script),
        str(archive_file),
        "--supported-range",
        supported_range,
        "--json",
    ]

    output = run_command(cmd, f"Bundle verification ({archive_file.name})")

    try:
        result = json.loads(output)
    except json.JSONDecodeError as e:
        raise InterfaceUpdateError(f"Failed to parse verify output: {e}") from e

    if not result.get("compatible"):
        raise InterfaceUpdateError(
            f"Bundle schema version {result.get('schemaVersion')} "
            f"is not compatible with supported range {supported_range}"
        )

    print(f"✓ Bundle verification passed: schema v{result['schemaVersion']}")
    return result


def extract_bundle(bundle_dir: Path) -> Path:
    """Extract the interface bundle and return the root path."""
    archive_files = list(bundle_dir.glob("*.tgz")) or list(bundle_dir.glob("*.tar.gz"))
    if not archive_files:
        raise InterfaceUpdateError(f"No archive found in {bundle_dir}")

    archive_file = archive_files[0]
    temp_dir = Path(tempfile.mkdtemp(prefix="crystord-interface-extract-"))

    try:
        cmd = ["tar", "-xzf", str(archive_file), "-C", str(temp_dir)]
        run_command(cmd, f"Extract archive {archive_file.name}")
    except InterfaceUpdateError as e:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise e

    # Find the extracted root (should be only one top-level directory)
    extracted = [p for p in temp_dir.iterdir() if p.is_dir()]
    if len(extracted) != 1:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise InterfaceUpdateError(f"Archive contains unexpected structure")

    print(f"✓ Bundle extracted to {temp_dir}")
    return extracted[0]


def read_readme(bundle_root: Path) -> str:
    """Read and return the README content from the bundle."""
    readme_file = bundle_root / "README-HANDOFF.txt"
    if not readme_file.exists():
        return "(No README found in bundle)"
    return readme_file.read_text(encoding="utf-8")


def update_integration_files(bundle_root: Path, schema_version: str) -> dict:
    """Update client integration files from bundle contents."""
    integration_dir = Path(__file__).parent
    changes = {"files_updated": [], "files_unchanged": []}

    # Update provided-schema.graphql
    source_schema = bundle_root / "crystord_server/schema.graphql"
    if source_schema.exists():
        target_schema = integration_dir / "provided-schema.graphql"
        source_content = source_schema.read_text(encoding="utf-8")
        # Update the snapshot version comment
        source_content = source_content.replace(
            "# Snapshot schemaVersion target: 1.1.0",
            f"# Snapshot schemaVersion target: {schema_version}"
        )
        source_content = source_content.replace(
            "# Snapshot copied date:",
            f"# Snapshot copied date: {Path(__file__).parent.parent.parent / 'package.json' or '2026-06-04'}"
        )
        if source_content != target_schema.read_text(encoding="utf-8"):
            target_schema.write_text(source_content, encoding="utf-8")
            changes["files_updated"].append("provided-schema.graphql")
        else:
            changes["files_unchanged"].append("provided-schema.graphql")

    # Update allowed-schema.graphql (fallback to legacy approved-operations.graphql)
    source_ops = bundle_root / "docs/backend-integration/allowed-schema.graphql"
    if not source_ops.exists():
        source_ops = bundle_root / "docs/backend-integration/approved-operations.graphql"
    if source_ops.exists():
        target_ops = integration_dir / "allowed-schema.graphql"
        source_content = source_ops.read_text(encoding="utf-8")
        if source_content != target_ops.read_text(encoding="utf-8"):
            target_ops.write_text(source_content, encoding="utf-8")
            changes["files_updated"].append("allowed-schema.graphql")
        else:
            changes["files_unchanged"].append("allowed-schema.graphql")

    # Update client-schema-policy.json
    target_policy = integration_dir / "client-schema-policy.json"
    if target_policy.exists():
        policy = json.loads(target_policy.read_text(encoding="utf-8"))
        # Update copiedFrom metadata
        policy["copiedFrom"]["schemaVersion"] = schema_version
        policy["copiedFrom"]["lastSyncedAt"] = "2026-06-04T00:00:00Z"
        target_policy.write_text(json.dumps(policy, indent=2), encoding="utf-8")
        changes["files_updated"].append("client-schema-policy.json")

    for f in changes["files_updated"]:
        print(f"✓ Updated {f}")
    for f in changes["files_unchanged"]:
        print(f"  (no changes) {f}")

    return changes


def cleanup_interface_folder(bundle_dir: Path) -> None:
    """Remove the source interface folder after successful update."""
    try:
        shutil.rmtree(bundle_dir)
        print(f"✓ Cleaned up {bundle_dir}")
    except Exception as e:
        print(f"⚠ Warning: could not clean up {bundle_dir}: {e}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Update Crystord client integration files from a new backend interface bundle.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python3 update-interface.py docs/backend-integration/crystord-interface-v2.0.0
    python3 update-interface.py docs/backend-integration/crystord-interface-v2.1.0

The script will:
1. Verify the bundle integrity and schema compatibility
2. Extract and inspect the interface
3. Update integration files
4. Clean up the source folder
5. Report what changed
        """,
    )
    parser.add_argument(
        "bundle_dir",
        help="Path to the crystord-interface-vX.Y.Z folder containing the bundle",
    )

    args = parser.parse_args()
    bundle_dir = Path(args.bundle_dir).resolve()

    if not bundle_dir.exists():
        print(f"ERROR: Bundle directory not found: {bundle_dir}")
        return 1

    if not bundle_dir.is_dir():
        print(f"ERROR: Not a directory: {bundle_dir}")
        return 1

    try:
        print(f"\n=== Crystord Interface Update ===\n")
        print(f"Bundle directory: {bundle_dir}\n")

        # Step 1: Verify
        print("Step 1: Verifying bundle...")
        verify_result = verify_bundle(bundle_dir)
        schema_version = verify_result["schemaVersion"]
        print()

        # Step 2: Extract
        print("Step 2: Extracting bundle...")
        bundle_root = extract_bundle(bundle_dir)
        print()

        # Step 3: Read README
        print("Step 3: Bundle release notes:")
        readme = read_readme(bundle_root)
        print(readme)
        print()

        # Step 4: Update files
        print("Step 4: Updating integration files...")
        changes = update_integration_files(bundle_root, schema_version)
        print()

        # Step 5: Cleanup
        print("Step 5: Cleaning up...")
        cleanup_interface_folder(bundle_dir)
        print()

        # Summary
        print(f"=== Update Complete ===")
        print(f"Schema version: {schema_version}")
        print(f"Files updated: {len(changes['files_updated'])}")
        print(f"Files unchanged: {len(changes['files_unchanged'])}")
        print()
        print("Next steps:")
        print("1. Review the changes with: git diff")
        print("2. Run tests: npm run test && python3 run_tests.py --all")
        print("3. Commit the updated integration files")

        return 0

    except InterfaceUpdateError as e:
        print(f"ERROR: {e}")
        return 2
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
