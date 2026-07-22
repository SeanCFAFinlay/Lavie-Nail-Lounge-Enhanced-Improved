#!/usr/bin/env python3
"""
Regenerate the responsive image derivatives the site serves.

Sources live at the repo root and are never modified. Derivatives are written to
assets/img/ as <name>-<width>.jpg. Re-running is safe and idempotent: identical
input produces byte-identical output, so a clean tree stays clean.

    python tools/build_images.py            # build anything missing or stale
    python tools/build_images.py --force    # rebuild everything
    python tools/build_images.py --check    # verify only; non-zero exit if stale

Crops are declared here rather than applied by hand so they survive a rebuild.
Staleness is keyed on a hash of the source bytes plus the build settings, not on
mtime, because git does not preserve mtime across a fresh checkout.
"""
from __future__ import annotations

import argparse
import hashlib
import json
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

# name -> (source file, crop as (left, top, right, bottom) fractions, or None)
SOURCES: dict[str, tuple[str, tuple[float, float, float, float] | None]] = {
    "1":      ("1.jpg", None),
    "2":      ("2.jpg", (0.0, 0.26, 1.0, 1.0)),   # crops out a LaVie logo sticker
    "3":      ("3.jpg", None),
    "5":      ("5.jpg", None),
    "6":      ("6.jpg", None),
    "7":      ("7.jpg", None),
    "9":      ("9.jpg", None),
    "11":     ("11.jpg", None),
    "12":     ("12.jpg", None),
    "14":     ("14.jpg", None),
    "16":     ("16.jpg", None),
    "17":     ("17.jpg", None),
    "21":     ("21.jpg", None),
    "22":     ("22.jpg", None),
    "26":     ("26.jpg", None),
    "29":     ("29.jpg", None),
    "30":     ("30.jpg", None),
    "32":     ("32.jpg", None),
    "33":     ("33.jpg", None),
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


def planned_widths(spec) -> list[int]:
    """Widths worth emitting. A source narrower than a target would produce a
    byte-identical duplicate, so that width is dropped rather than shipped twice."""
    with Image.open(ROOT / spec[0]) as probe:
        w = probe.width
    if spec[1]:
        w = int(w * (spec[1][2] - spec[1][0]))
    out, seen = [], set()
    for target in WIDTHS:
        actual = min(target, w)
        if actual in seen:
            continue
        seen.add(actual)
        out.append(target)
    return out


def fingerprint(spec) -> dict:
    digest = hashlib.sha256((ROOT / spec[0]).read_bytes()).hexdigest()[:16]
    # crop is normalised to a list: JSON has no tuple, so a tuple here would never
    # compare equal to the value read back from the manifest and every cropped
    # image would rebuild on every run.
    return {"source": spec[0], "crop": list(spec[1]) if spec[1] else None,
            "sha": digest, "widths": planned_widths(spec), "quality": QUALITY}


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

        fp = fingerprint(spec)
        current[name] = fp
        outputs = [OUT / f"{name}-{w}.jpg" for w in fp["widths"]]
        missing = [p for p in outputs if not p.exists()]

        if not args.force and previous.get(name) == fp and not missing:
            total += sum(p.stat().st_size for p in outputs)
            continue
        if args.check:
            stale.append(name)
            continue

        im = load_source(spec)
        for width in fp["widths"]:
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

    expected = {"manifest.json"} | {
        f"{n}-{w}.jpg" for n, sp in SOURCES.items() for w in planned_widths(sp)
    }
    removed = 0
    for p in sorted(OUT.iterdir()):
        if p.name not in expected:
            p.unlink()
            removed += 1
            print(f"  removed {p.relative_to(ROOT)}  (not built from any source)")

    src_bytes = sum((ROOT / s).stat().st_size for s, _ in SOURCES.values())
    print(f"\n{built} rebuilt, {removed} removed. "
          f"sources {src_bytes // 1024}KB -> derivatives {total // 1024}KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
