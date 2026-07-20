#!/usr/bin/env python3
"""
Regenerate the responsive image derivatives the site serves.

Sources live at the repo root and are never modified. Derivatives are written to
assets/img/ as <name>-<width>.jpg. Safe to re-run: identical output for identical
input, so a clean tree stays clean.

    python tools/build_images.py            # build anything missing or stale
    python tools/build_images.py --force    # rebuild everything
    python tools/build_images.py --check    # verify only; non-zero exit if stale

Crops are declared here rather than applied by hand so they survive a rebuild.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img"
MANIFEST = OUT / "manifest.json"

WIDTHS = (800, 1600)
QUALITY = 80

# name -> (source file, crop)
# crop is (left, top, right, bottom) as fractions of the source, or None.
SOURCES: dict[str, tuple[str, tuple[float, float, float, float] | None]] = {
    "1":      ("1.jpg", None),
    "2":      ("2.jpg", (0.0, 0.26, 1.0, 1.0)),   # crops out a LaVie logo sticker
    "3":      ("3.jpg", None),
    "5":      ("5.jpg", None),
    "6":      ("6.jpg", None),
    "9":      ("9.jpg", None),
    "26":     ("26.jpg", None),
    "35":     ("35.jpg", None),
    # crops out a third-party "NAILSBYTONY_T" watermark down the right edge
    "charms": ("1717607568416-Lavielg.webp", (0.0, 0.0, 0.875, 1.0)),
}


def load_source(spec):
    src, crop = spec
    im = Image.open(ROOT / src).convert("RGB")
    if crop:
        w, h = im.size
        l, t, r, b = crop
        im = im.crop((int(w * l), int(h * t), int(w * r), int(h * b)))
    return im


def fingerprint(name: str, spec) -> dict:
    src, crop = spec
    st = (ROOT / src).stat()
    return {"source": src, "crop": crop, "bytes": st.st_size, "mtime": int(st.st_mtime)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="rebuild every derivative")
    ap.add_argument("--check", action="store_true", help="verify only, build nothing")
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    current, stale, built, total = {}, [], 0, 0

    for name, spec in SOURCES.items():
        if not (ROOT / spec[0]).exists():
            print(f"  MISSING SOURCE  {spec[0]}")
            return 1

        current[name] = fingerprint(name, spec)
        outputs = [OUT / f"{name}-{w}.jpg" for w in WIDTHS]
        changed = args.force or previous.get(name) != current[name]
        missing = [p for p in outputs if not p.exists()]

        if not changed and not missing:
            total += sum(p.stat().st_size for p in outputs)
            continue

        if args.check:
            stale.append(name)
            continue

        im = load_source(spec)
        for width in WIDTHS:
            tw = min(width, im.width)
            th = round(im.height * tw / im.width)
            path = OUT / f"{name}-{width}.jpg"
            im.resize((tw, th), Image.LANCZOS).save(
                path, "JPEG", quality=QUALITY, optimize=True, progressive=True
            )
            total += path.stat().st_size
            built += 1
            print(f"  built  {path.relative_to(ROOT)}  {tw}x{th}  {path.stat().st_size // 1024}KB")

    if args.check:
        if stale:
            print("STALE (run without --check to rebuild): " + ", ".join(stale))
            return 1
        print("images up to date")
        return 0

    MANIFEST.write_text(json.dumps(current, indent=2, sort_keys=True) + "\n")

    # Anything in assets/img not produced by this script is dead weight.
    expected = {f"{n}-{w}.jpg" for n in SOURCES for w in WIDTHS} | {"manifest.json"}
    orphans = [p.name for p in OUT.iterdir() if p.name not in expected]
    if orphans:
        print("\n  orphaned files in assets/img (not built from any source):")
        for o in orphans:
            print(f"    {o}")

    src_bytes = sum((ROOT / s).stat().st_size for s, _ in SOURCES.values())
    print(
        f"\n{built} derivative(s) rebuilt. "
        f"sources {src_bytes // 1024}KB -> derivatives {total // 1024}KB"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
