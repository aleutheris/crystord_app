#!/usr/bin/env python3
"""
Install the latest Crystord interface bundle into docs/.

Finds the highest-versioned bundle dropped under docs/backend-integration/,
verifies its integrity with the bundle's own verify.py, then extracts its
files into docs/.

This mirrors the installer used by the crystord_access project. The only
project-specific adaptation is the bundle source directory: here dist/ is the
Vite build output, so incoming bundles are read from docs/backend-integration/
instead.

Run:
  python3 tools/install_interface.py
"""

from __future__ import annotations

import re
import sys
import tarfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BUNDLES_DIR = PROJECT_ROOT / "docs" / "backend-integration"
DOCS_DIR = PROJECT_ROOT / "docs"

_SEMVER_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")
_BUNDLE_DIR_RE = re.compile(r"^crystord-interface-v(\d+\.\d+\.\d+)$")


def _parse_semver(version: str) -> tuple[int, int, int]:
    m = _SEMVER_RE.fullmatch(version)
    if not m:
        raise ValueError(f"Invalid semver: {version!r}")
    return int(m.group(1)), int(m.group(2)), int(m.group(3))


def _find_latest_bundle() -> tuple[Path, str]:
    candidates: list[tuple[tuple[int, int, int], Path, str]] = []
    for entry in BUNDLES_DIR.iterdir():
        if not entry.is_dir():
            continue
        m = _BUNDLE_DIR_RE.fullmatch(entry.name)
        if not m:
            continue
        version = m.group(1)
        tgz = entry / f"crystord-interface-v{version}.tgz"
        verify = entry / "verify.py"
        if tgz.exists() and verify.exists():
            candidates.append((_parse_semver(version), tgz, version))

    if not candidates:
        raise RuntimeError(f"No valid interface bundles found in {BUNDLES_DIR}")

    candidates.sort(key=lambda c: c[0], reverse=True)
    _, tgz_path, version = candidates[0]
    return tgz_path, version


def _verify(tgz_path: Path, version: str) -> None:
    verify_script = tgz_path.parent / "verify.py"
    spec_source = verify_script.read_text(encoding="utf-8")
    spec_globals: dict = {}
    exec(compile(spec_source, str(verify_script), "exec"), spec_globals)  # noqa: S102

    verify_bundle = spec_globals["verify_bundle"]
    VerificationError = spec_globals["VerificationError"]

    major = _parse_semver(version)[0]
    supported_range = f"^{major}.0.0"

    try:
        result = verify_bundle(tgz_path, supported_range)
    except VerificationError as exc:
        raise RuntimeError(f"Verification failed: {exc}") from exc

    if not result["compatible"]:
        raise RuntimeError(
            f"Bundle version {result['schemaVersion']} is not compatible "
            f"with range {supported_range}."
        )

    print(f"Verified: schema v{result['schemaVersion']} released {result['releasedAt']}")


def _extract(tgz_path: Path) -> list[str]:
    extracted: list[str] = []
    with tarfile.open(tgz_path, "r:gz") as archive:
        for member in archive.getmembers():
            if not member.isfile():
                continue

            # Strip the top-level bundle directory name.
            parts = Path(member.name).parts
            if len(parts) < 2:
                continue

            rel_path = Path(*parts[1:])

            if rel_path.name == "manifest.json" and len(rel_path.parts) == 1:
                continue

            # .github/ contract files go to docs/contracts/ (filename only, no nesting).
            if rel_path.parts[0] == ".github":
                dest_root = DOCS_DIR
                rel_path = Path("contracts") / rel_path.name
            # Paths already under docs/ land naturally at project root.
            # All other paths are remapped under docs/.
            elif rel_path.parts[0] == "docs":
                dest_root = PROJECT_ROOT
            else:
                dest_root = DOCS_DIR

            dest = dest_root / rel_path
            member.name = str(rel_path)
            dest.parent.mkdir(parents=True, exist_ok=True)
            archive.extract(member, path=dest_root, filter="fully_trusted")
            extracted.append(str(dest.relative_to(PROJECT_ROOT)))

    return extracted


def main() -> int:
    try:
        tgz_path, version = _find_latest_bundle()
        print(f"Found bundle: crystord-interface-v{version}")

        _verify(tgz_path, version)

        extracted = _extract(tgz_path)
        print(f"Installed {len(extracted)} file(s) into docs/:")
        for path in extracted:
            print(f"  {path}")

        return 0
    except (RuntimeError, OSError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
