#!/usr/bin/env node
/**
 * Fetch every external URL the site links to and report what comes back.
 *
 *     node tools/check_links.js            # check everything
 *     node tools/check_links.js --booking  # booking + map URLs only (fast)
 *
 * This exists because the failure it catches is invisible from the markup: the
 * Langley studio's old "3d-nails-spa" booking calendar started returning 404
 * when the salon rebranded, and every "Book" button pointing at it silently
 * sent clients to a dead page. Run it before any deploy that touches links.
 *
 * Social networks throttle datacentre traffic, so a 4xx from Instagram or
 * Facebook is reported but does not fail the run. A dead booking or map link
 * does.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'services.html', 'fleetwood.html', 'newton.html', 'langley.html',
               'terms.html', 'privacy.html', 'links.html'];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const onlyBooking = process.argv.includes('--booking');

/* ---------- collect ---------- */

const ORIGIN = JSON.parse(fs.readFileSync(path.join(__dirname, 'site-data.json'), 'utf8')).site.origin;

const found = new Map();                       // url -> Set(pages)
let selfRefs = 0;
PAGES.forEach((page) => {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, 'utf8');
  [...html.matchAll(/(?:href|src|data-src)="(https?:\/\/[^"]+)"/g)].forEach((m) => {
    const url = m[1].replace(/&amp;/g, '&');
    if (/fonts\.(googleapis|gstatic)\.com/.test(url)) return;   // asset CDNs, not content links
    if (/schema\.org/.test(url)) return;                        // vocabulary URIs
    // Canonical, og:url and structured-data URLs point at our own origin. The
    // domain still serves the pre-rebuild site, so fetching them proves nothing
    // until it is switched over. tools/verify.js checks these as file paths.
    if (url.startsWith(ORIGIN)) { selfRefs++; return; }
    if (!found.has(url)) found.set(url, new Set());
    found.get(url).add(page);
  });
});

const kind = (url) => (/dashbooking\.com/.test(url) ? 'booking'
  : /google\.[a-z.]+\/maps/.test(url) ? 'map'
    : /instagram\.com|facebook\.com/.test(url) ? 'social' : 'other');

let urls = [...found.keys()].sort();
if (onlyBooking) urls = urls.filter((u) => ['booking', 'map'].includes(kind(u)));

/* ---------- check ---------- */

async function head(url) {
  const started = Date.now();
  try {
    // Google Maps rejects HEAD; GET everything and discard the body.
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml', 'accept-language': 'en-CA,en;q=0.9' }, redirect: 'follow' });
    return { status: res.status, ok: res.ok, ms: Date.now() - started, final: res.url };
  } catch (err) {
    return { status: 0, ok: false, ms: Date.now() - started, error: err.message };
  }
}

async function main() {
  console.log(`checking ${urls.length} external URLs from ${PAGES.length} pages`);
  console.log(`(${selfRefs} self-referencing ${ORIGIN} URLs skipped — canonicals, og:url, structured data)\n`);
  const results = [];

  // Small concurrency: enough to be quick, polite enough not to get throttled.
  const queue = urls.slice();
  const workers = Array.from({ length: 4 }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      const r = await head(url);
      results.push({ url, kind: kind(url), pages: [...found.get(url)], ...r });
    }
  });
  await Promise.all(workers);

  results.sort((a, b) => a.kind.localeCompare(b.kind) || a.url.localeCompare(b.url));

  let hardFail = 0, softFail = 0;
  let group = '';
  results.forEach((r) => {
    if (r.kind !== group) { group = r.kind; console.log(`— ${group} —`); }
    const mark = r.ok ? '✓' : (r.kind === 'social' ? '!' : '✗');
    if (!r.ok) { if (r.kind === 'social') softFail++; else hardFail++; }
    const detail = r.error ? ` (${r.error})` : '';
    console.log(`  ${mark} ${String(r.status).padStart(3)} ${String(r.ms).padStart(5)}ms  ${r.url}${detail}`);
    if (!r.ok) console.log(`        linked from: ${r.pages.join(', ')}`);
  });

  console.log('');
  if (softFail) console.log(`${softFail} social link(s) did not respond — networks throttle automated traffic; check by hand.`);
  if (hardFail) {
    console.error(`${hardFail} booking/map link(s) are broken. Fix before deploying.`);
    return 1;
  }
  console.log('every booking and map link resolves.');
  return 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error(e); process.exit(1); });
