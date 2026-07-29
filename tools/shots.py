#!/usr/bin/env python3
"""
Screenshot every page at desktop and mobile widths, for design review.

    python tools/shots.py                 # all pages, both widths
    python tools/shots.py langley links   # just those pages
    python tools/shots.py --full          # full-page instead of first viewport

Writes PNGs to .shots/ (git-ignored). Serves the repo over localhost first, so
relative links, the price-menu tabs and the reveal animations all behave as they
do in production — file:// would break the JS-gated layout.

Reveal animations are disabled for the capture: .rv elements start at opacity 0
and only animate in on scroll, so an un-nudged screenshot is mostly blank page.
"""
import http.server
import functools
import socket
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / ".shots"

PAGES = {
    "home": "/index.html",
    "services": "/services.html",
    "fleetwood": "/fleetwood.html",
    "newton": "/newton.html",
    "langley": "/langley.html",
    "terms": "/terms.html",
    "privacy": "/privacy.html",
    "links": "/links.html",
}

SIZES = {"desktop": (1440, 900), "mobile": (390, 844)}

# The reveal layer holds content at opacity 0 until an IntersectionObserver fires.
# Screenshots need it settled, not mid-animation.
SETTLE = """
document.querySelectorAll('.rv,.rv-mask,.rv-line,.reveal-mask,.gal__fig')
        .forEach(el => el.classList.add('in'));
document.querySelectorAll('.hero__figure img').forEach(i => i.style.transform = 'none');
"""


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def serve(port):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.log_message = lambda *a, **k: None
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    full = "--full" in sys.argv
    wanted = {k: v for k, v in PAGES.items() if not args or k in args}
    if not wanted:
        sys.exit(f"no such page. known: {', '.join(PAGES)}")

    OUT.mkdir(exist_ok=True)
    port = free_port()
    httpd = serve(port)
    base = f"http://127.0.0.1:{port}"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome")
            for label, (w, h) in SIZES.items():
                page = browser.new_page(viewport={"width": w, "height": h},
                                        device_scale_factor=2 if label == "mobile" else 1)
                for name, path in wanted.items():
                    page.goto(base + path, wait_until="networkidle")
                    page.evaluate(SETTLE)
                    page.wait_for_timeout(450)
                    dest = OUT / f"{name}-{label}.png"
                    page.screenshot(path=str(dest), full_page=full)
                    print(f"  {dest.relative_to(ROOT)}  {w}x{h}{'  (full page)' if full else ''}")
                page.close()
            browser.close()
    finally:
        httpd.shutdown()

    print(f"\n{len(wanted) * len(SIZES)} screenshots in {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
