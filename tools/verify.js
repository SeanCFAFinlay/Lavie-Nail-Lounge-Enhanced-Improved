#!/usr/bin/env node
/**
 * Static checks over the built site.
 *
 *     node tools/verify.js
 *
 * Catches the mistakes that are easy to make across nine hand- and
 * machine-written pages: a link to a file that does not exist, a phone number
 * that does not belong to any studio, a booking URL pointing at the retired
 * 3D Nails Spa calendar, malformed JSON-LD, a missing canonical.
 *
 * Network reachability of external links is checked separately by
 * tools/check_links.js, which needs the internet; this script does not.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'site-data.json'), 'utf8'));

const PAGES = ['index.html', 'services.html', 'fleetwood.html', 'newton.html', 'langley.html',
               'terms.html', 'privacy.html', 'links.html'];

const KNOWN_PHONES = new Set(Object.values(DATA.locations).map((l) => l.phoneTel));
const KNOWN_BOOKING = new Set(Object.values(DATA.locations).map((l) => l.booking));

const problems = [];
const note = (page, msg) => problems.push(`${page}: ${msg}`);

let checked = 0;

PAGES.forEach((page) => {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) { note(page, 'FILE MISSING'); return; }
  const html = fs.readFileSync(file, 'utf8');
  // Structural checks run against the markup the browser actually builds a DOM
  // from. The pages carry deliberate commented-out templates — the review
  // <figure>, the Search Console <meta> — which are not elements yet.
  const dom = html.replace(/<!--[\s\S]*?-->/g, '');
  checked++;

  /* canonical */
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonical) note(page, 'no <link rel="canonical">');
  else if (!canonical[1].startsWith(DATA.site.origin)) note(page, `canonical is not on ${DATA.site.origin}: ${canonical[1]}`);

  /* title + description */
  if (!/<title>[^<]{10,70}<\/title>/.test(html)) note(page, 'missing or oddly-sized <title>');
  const desc = html.match(/<meta name="description" content="([^"]+)"/);
  if (!desc) note(page, 'no meta description');
  else if (desc[1].length > 320) note(page, `meta description is ${desc[1].length} chars`);

  /* JSON-LD parses */
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
  if (!blocks.length) note(page, 'no JSON-LD');
  blocks.forEach((b, i) => {
    const body = b.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    try { JSON.parse(body); } catch (err) { note(page, `JSON-LD block ${i + 1} does not parse: ${err.message}`); }
  });

  /* every local href resolves */
  const hrefs = [...dom.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  hrefs.forEach((href) => {
    if (/^(https?:|tel:|mailto:|#|data:)/.test(href)) return;
    const target = href.split('#')[0].split('?')[0];
    if (!target) return;
    if (!fs.existsSync(path.join(ROOT, target))) note(page, `broken local link → ${href}`);
  });

  /* phone numbers belong to a studio */
  [...html.matchAll(/href="tel:([^"]+)"/g)].forEach((m) => {
    if (!KNOWN_PHONES.has(m[1])) note(page, `unknown phone number ${m[1]}`);
  });

  /* booking URLs are the live ones */
  const seenBooking = new Set();
  [...html.matchAll(/https:\/\/www\.dashbooking\.com\/salon\/[a-z0-9-]+\/booking/g)].forEach((m) => {
    if (!KNOWN_BOOKING.has(m[0]) && !seenBooking.has(m[0])) {
      seenBooking.add(m[0]);
      note(page, `stale booking URL ${m[0]}`);
    }
  });

  /* Retired branding may only appear where it is marked as a former name.
     The Langley studio traded as 3D Nails Spa, and its old booking calendar
     now 404s, so an unqualified mention would send clients nowhere. */
  [...html.matchAll(/3D Nails Spa/g)].forEach((m) => {
    const before = html.slice(Math.max(0, m.index - 90), m.index);
    if (!/formerly|previously|alternateName/i.test(before)) {
      note(page, `"3D Nails Spa" used as a current name near: …${before.slice(-50).replace(/\s+/g, ' ')}‹here›`);
    }
  });

  /* accessibility basics */
  [...html.matchAll(/<img (?![^>]*\balt=)[^>]*>/g)].forEach((m) => note(page, `img without alt: ${m[0].slice(0, 90)}`));
  if (!/<html lang="en">/.test(html)) note(page, 'missing lang on <html>');
  if (!/class="skip"/.test(html) && page !== 'links.html') note(page, 'no skip link');

  /* every page loads the measurement layer */
  if (!/assets\/analytics\.js/.test(html)) note(page, 'analytics.js not loaded');

  /* exactly one h1, and no heading level skipped on the way down */
  const headings = [...dom.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  const h1s = headings.filter((h) => h === 1).length;
  if (h1s !== 1) note(page, `${h1s} <h1> elements (expected exactly 1)`);
  headings.reduce((prev, h) => {
    if (h > prev + 1) note(page, `heading level jumps h${prev} → h${h}`);
    return h;
  }, 1);

  /* ids are unique — duplicates break in-page anchors and label references */
  const ids = [...dom.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  [...new Set(dupes)].forEach((id) => note(page, `duplicate id="${id}"`));

  /* every in-page anchor has a target on the same page */
  [...dom.matchAll(/href="#([^"]+)"/g)].forEach((m) => {
    if (!ids.includes(m[1])) note(page, `anchor #${m[1]} has no matching id`);
  });

  /* container tags balance — a stray </div> silently reflows a whole page */
  ['div', 'section', 'article', 'ul', 'ol', 'li', 'figure', 'main', 'nav'].forEach((tag) => {
    const open = (dom.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const close = (dom.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) note(page, `<${tag}> opened ${open}× but closed ${close}×`);
  });

  /* external links that open a new tab carry rel="noopener" */
  [...dom.matchAll(/<a [^>]*target="_blank"[^>]*>/g)].forEach((m) => {
    if (!/rel="[^"]*noopener/.test(m[0])) note(page, `target="_blank" without rel=noopener: ${m[0].slice(0, 80)}`);
  });
});

/* ---------- structured data says what it should ---------- */

const REQUIRED_SALON = ['name', 'url', 'telephone', 'address', 'openingHoursSpecification', 'aggregateRating'];
const salonsSeen = new Set();

PAGES.forEach((page) => {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, 'utf8');
  const nodes = [];
  (html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []).forEach((b) => {
    let parsed;
    try { parsed = JSON.parse(b.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')); } catch { return; }
    (Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed]).forEach((n) => nodes.push(n));
  });

  nodes.filter((n) => n['@type'] === 'NailSalon').forEach((n) => {
    salonsSeen.add(n['@id']);
    REQUIRED_SALON.forEach((k) => { if (!n[k]) note(page, `NailSalon ${n['@id'] || n.name} missing "${k}"`); });
    const days = (n.openingHoursSpecification || [])
      .flatMap((s) => (Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek]));
    if (days.length !== new Set(days).size) note(page, `NailSalon ${n.name}: a day appears twice in openingHoursSpecification`);
    if (days.length !== 7) note(page, `NailSalon ${n.name}: ${days.length} days specified, expected 7`);

    const slug = Object.values(DATA.locations).find((l) => l.name === n.name);
    if (!slug) { note(page, `NailSalon "${n.name}" is not a known studio`); return; }
    if (n.telephone !== slug.phoneE164) note(page, `${n.name}: schema telephone ${n.telephone} ≠ ${slug.phoneE164}`);
    if (n.address.postalCode !== slug.postal) note(page, `${n.name}: schema postcode ${n.address.postalCode} ≠ ${slug.postal}`);
    if (slug.rating) {
      if (n.aggregateRating.reviewCount !== slug.rating.count) {
        note(page, `${n.name}: schema reviewCount ${n.aggregateRating.reviewCount} ≠ ${slug.rating.count}`);
      }
      if (Math.abs(n.aggregateRating.ratingValue - slug.rating.value) > 0.051) {
        note(page, `${n.name}: schema ratingValue ${n.aggregateRating.ratingValue} ≠ ${slug.rating.value}`);
      }
    }
    /* hours in the schema must match the hours in the data */
    (n.openingHoursSpecification || []).forEach((s) => {
      (Array.isArray(s.dayOfWeek) ? s.dayOfWeek : [s.dayOfWeek]).forEach((d) => {
        const idx = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          .indexOf(String(d).replace('https://schema.org/', ''));
        const want = slug.hours[idx];
        if (!want) { note(page, `${n.name}: schema opens on a day the data marks closed`); return; }
        if (want[0] !== s.opens || want[1] !== s.closes) {
          note(page, `${n.name}: ${d} schema ${s.opens}–${s.closes} ≠ data ${want[0]}–${want[1]}`);
        }
      });
    });
  });
});

Object.values(DATA.locations).forEach((l) => {
  const id = `${DATA.site.origin}/${l.slug}.html#salon`;
  if (!salonsSeen.has(id)) note('structured data', `no NailSalon node with @id ${id}`);
});

/* sitemap lists exactly what exists, and nothing that does not */
const sitemapFile = path.join(ROOT, 'sitemap.xml');
if (!fs.existsSync(sitemapFile)) note('sitemap.xml', 'FILE MISSING');
else {
  const xml = fs.readFileSync(sitemapFile, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!locs.length) note('sitemap.xml', 'no <loc> entries');
  locs.forEach((loc) => {
    const rel = loc.replace(DATA.site.origin, '').replace(/^\//, '') || 'index.html';
    const candidate = rel === 'links' ? 'links.html' : rel;
    if (!fs.existsSync(path.join(ROOT, candidate))) note('sitemap.xml', `lists ${loc} but ${candidate} does not exist`);
  });
  PAGES.forEach((p) => {
    const url = p === 'index.html' ? `${DATA.site.origin}/`
      : p === 'links.html' ? `${DATA.site.origin}/links`
        : `${DATA.site.origin}/${p}`;
    if (!locs.includes(url)) note('sitemap.xml', `does not list ${url}`);
  });
}

/* robots points at the sitemap */
const robotsFile = path.join(ROOT, 'robots.txt');
if (!fs.existsSync(robotsFile)) note('robots.txt', 'FILE MISSING');
else if (!fs.readFileSync(robotsFile, 'utf8').includes(`${DATA.site.origin}/sitemap.xml`)) {
  note('robots.txt', 'does not reference the sitemap');
}

/* analytics config is present and parseable even while blank */
const an = fs.readFileSync(path.join(ROOT, 'assets', 'analytics.js'), 'utf8');
['ga4', 'gtm', 'clarity'].forEach((k) => {
  if (!new RegExp(`${k}:\\s*'`).test(an)) note('assets/analytics.js', `no ${k} key in CONFIG`);
});

console.log(`checked ${checked}/${PAGES.length} pages`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error('  ✗ ' + p));
  process.exit(1);
}
console.log('no problems found');
