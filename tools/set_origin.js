#!/usr/bin/env node
/**
 * Point the whole site at a different domain, in one step.
 *
 *     node tools/set_origin.js https://lavienaillounge.ca      # set it
 *     node tools/set_origin.js --show                          # what is it now?
 *
 * The origin appears about eighty times across canonical tags, og:url, JSON-LD
 * @ids, the sitemap and robots.txt. Three of those files are generated and three
 * are hand-written, so a find-and-replace over one set silently leaves the other
 * half pointing at the old domain — and a wrong canonical is the one SEO mistake
 * that quietly undoes everything else on the page.
 *
 * Run this, then `node tools/verify.js`, which fails if any canonical disagrees.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(__dirname, 'site-data.json');

/* Hand-written files. The studio pages and sitemap.xml are not listed: they are
   regenerated from site-data.json at the end of this script. fetch_dash.js is
   listed for its DEFAULT_ORIGIN, which only applies to a first run but would
   otherwise disagree with the rest of the repo. */
const HAND_WRITTEN = ['index.html', 'services.html', 'terms.html', 'privacy.html',
                      'links.html', 'robots.txt', 'tools/fetch_dash.js'];

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const current = data.site.origin;

const arg = process.argv[2];

if (!arg || arg === '--show') {
  console.log(`current origin: ${current}`);
  if (!arg) console.log('\nusage: node tools/set_origin.js https://your-domain.ca');
  process.exit(0);
}

let next;
try {
  const u = new URL(arg);
  if (!/^https?:$/.test(u.protocol)) throw new Error('not http(s)');
  next = `${u.protocol}//${u.host}`;            // scheme + host only, never a path
} catch {
  console.error(`"${arg}" is not a valid absolute URL. Example: https://lavienaillounge.ca`);
  process.exit(1);
}

if (next === current) {
  console.log(`origin is already ${next} — nothing to do`);
  process.exit(0);
}

console.log(`${current}  →  ${next}\n`);

let touched = 0, replaced = 0;

/* site-data.json first: it drives the generated pages. */
{
  const before = fs.readFileSync(DATA_FILE, 'utf8');
  const after = before.split(current).join(next);
  if (before !== after) {
    fs.writeFileSync(DATA_FILE, after);
    const n = before.split(current).length - 1;
    replaced += n; touched++;
    console.log(`  ${String(n).padStart(3)}×  tools/site-data.json`);
  }
}

HAND_WRITTEN.forEach((rel) => {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) { console.log(`   —   ${rel} (missing, skipped)`); return; }
  const before = fs.readFileSync(file, 'utf8');
  const after = before.split(current).join(next);
  if (before === after) return;
  fs.writeFileSync(file, after);
  const n = before.split(current).length - 1;
  replaced += n; touched++;
  console.log(`  ${String(n).padStart(3)}×  ${rel}`);
});

console.log(`\n${replaced} references in ${touched} file(s). Regenerating the studio pages…\n`);
execFileSync(process.execPath, [path.join(__dirname, 'build_pages.js')], { stdio: 'inherit' });

/* Nothing anywhere should still mention the old domain. */
const strays = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
  if (/^(\.git|_archive|_scrape|node_modules|assets)$/.test(entry.name)) return;
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  if (entry.name === 'set_origin.js') return;          // its own usage examples
  if (!/\.(html|xml|txt|json|js)$/.test(entry.name)) return;
  if (fs.readFileSync(full, 'utf8').includes(current)) strays.push(path.relative(ROOT, full));
});
walk(ROOT);

if (strays.length) {
  console.error(`\nStill mentioning ${current}:`);
  strays.forEach((s) => console.error(`  ✗ ${s}`));
  console.error('\nAdd these to HAND_WRITTEN in tools/set_origin.js, or edit them by hand.');
  process.exit(1);
}

console.log(`\nDone. Every reference now says ${next}.`);
console.log('Next: node tools/verify.js   (fails if a canonical disagrees)');
console.log('      …then re-verify the property in Google Search Console.');
