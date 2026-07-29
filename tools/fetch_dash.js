#!/usr/bin/env node
/**
 * Refresh tools/site-data.json from the salon's own Dash Booking pages.
 *
 *     node tools/fetch_dash.js            # fetch and rewrite site-data.json
 *     node tools/fetch_dash.js --check    # fetch and diff only; non-zero exit if stale
 *
 * Dash renders each salon through Next.js, so the whole record — service
 * catalogue, opening hours, staff roster, review aggregate, promotions — is
 * embedded in the page as __NEXT_DATA__. That is the only source used here.
 * Nothing on the site is written from memory or from a third-party directory:
 * review aggregators mis-attribute between salons, and the pre-rebuild site
 * carried template placeholders from an unrelated business.
 *
 * PLACE is hand-authored: addresses, phone numbers, imagery and prose are
 * editorial decisions, not booking-system fields. Everything else is derived.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'site-data.json');

/* ---------- hand-authored, never derived ---------- */

const PLACE = {
  fleetwood: {
    dash: 'lavie-nail-lounge',
    slug: 'fleetwood',
    name: 'LaVie Nail Lounge Fleetwood',
    short: 'Fleetwood',
    street: '15988 Fraser Hwy Unit #202',
    locality: 'Surrey', region: 'BC', postal: 'V4N 0X8',
    neighbourhood: 'Fleetwood, Surrey',
    phoneDisplay: '778‑565‑3515', phoneTel: '+17785653515', phoneE164: '+1-778-565-3515',
    mapQuery: '15988+Fraser+Hwy+Unit+%23202,+Surrey,+BC+V4N+0X8',
    dirQuery: '15988+Fraser+Hwy+Unit+202,+Surrey,+BC+V4N+0X8',
    reviewQuery: 'LaVie+Nail+Lounge+15988+Fraser+Hwy+Unit+202+Surrey+BC',
    img: '29',
    imgAlt: 'Long coffin nails in white and gold marble with fine gold-foil veining.',
    instagram: 'https://www.instagram.com/lavie_nail_lounge21/',
    lead: 'Our original Surrey studio, on Fraser Highway in Fleetwood. The only LaVie location offering Head Spa treatments, alongside nails, lashes and waxing.',
    nearby: 'On Fraser Highway near 160 Street, upstairs in the Fleetwood shops.'
  },
  newton: {
    dash: 'lavie-nail-lounge-newton',
    slug: 'newton',
    name: 'LaVie Nail Lounge Newton',
    short: 'Newton',
    street: '7218 King George Blvd #118',
    locality: 'Surrey', region: 'BC', postal: 'V3W 5A5',
    neighbourhood: 'Newton, Surrey',
    phoneDisplay: '778‑592‑1049', phoneTel: '+17785921049', phoneE164: '+1-778-592-1049',
    mapQuery: '7218+King+George+Blvd+%23118,+Surrey,+BC+V3W+5A5',
    dirQuery: '7218+King+George+Blvd+118,+Surrey,+BC+V3W+5A5',
    reviewQuery: 'LaVie+Nail+Lounge+7218+King+George+Blvd+118+Surrey+BC',
    img: '3',
    imgAlt: 'Long lilac coffin nails with blue butterfly decals, textured pale blue tips, pearls and small 3D flowers.',
    instagram: 'https://www.instagram.com/lavie_nail_lounge25/',
    lead: 'Our King George Boulevard studio in Newton, and the latest-opening of the three — until 9pm on weekdays. The only location offering dipping powder.',
    nearby: 'On King George Boulevard near 72 Avenue.'
  },
  langley: {
    dash: 'lavie-nail-lounge-langley',
    slug: 'langley',
    name: 'LaVie Nail Lounge Langley',
    short: 'Langley',
    street: '8850 Walnut Grove Dr',
    locality: 'Langley Twp', region: 'BC', postal: 'V1M 2C9',
    neighbourhood: 'Walnut Grove, Langley',
    phoneDisplay: '604‑888‑1619', phoneTel: '+16048881619', phoneE164: '+1-604-888-1619',
    mapQuery: '8850+Walnut+Grove+Dr,+Langley+Twp,+BC+V1M+2C9',
    dirQuery: '8850+Walnut+Grove+Dr,+Langley+Twp,+BC+V1M+2C9',
    reviewQuery: 'LaVie+Nail+Lounge+Langley+8850+Walnut+Grove+Dr+Langley+BC',
    img: '33',
    imgAlt: 'Coral-pink ombré nails with a fine French line, a butterfly accent and scattered gems.',
    instagram: 'https://www.instagram.com/lavie_nail_lounge21/',
    formerly: '3D Nails Spa',
    lead: 'Our Walnut Grove studio in Langley Township, previously trading as 3D Nails Spa. The widest menu of the three, including children’s services and waxing.',
    nearby: 'On Walnut Grove Drive in the Walnut Grove town centre.'
  }
};

/* Used only when site-data.json does not exist yet. Once it does, the origin
   already in it wins, so `node tools/set_origin.js` is never undone by a refresh. */
const DEFAULT_ORIGIN = 'https://lavie-nail-lounge.vercel.app';

const SITE = {
  brand: 'LaVie Nail Lounge',
  facebook: 'https://www.facebook.com/p/Lavie-Nail-Lounge-100075865032810/',
  instagram: [
    'https://www.instagram.com/lavie_nail_lounge21/',
    'https://www.instagram.com/lavie_nail_lounge25/'
  ]
};

function currentOrigin() {
  try {
    return JSON.parse(fs.readFileSync(OUT, 'utf8')).site.origin || DEFAULT_ORIGIN;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

/* Promotions carry a name and a free-text description written for the salon's own
   dashboard. Only the name is retitled here — the description is the salon's own
   wording and is reproduced as written, tidied for spacing. The conditions shown
   beside it (minimum spend, days) come from the structured fields, not prose. */
const PROMO_TITLE = {
  'Happy Hour': 'Happy Hour',
  '15% OFF for multiple booking (10 visits)': 'Every tenth visit',
  '10% OFF for your Birthday': 'Birthday discount'
};

const tidy = (s) => String(s || '').trim()
  .replace(/(\d)\s*%\s*OFF/gi, '$1% off')
  .replace(/(\d)\s*(am|pm)/gi, '$1$2')
  .replace(/\s*-\s*(\d)/g, '–$1')
  .replace(/\s+/g, ' ')
  .replace(/([^.!?])$/, '$1.');

/* ---------- house style ---------- */

const WORDS = [
  [/\bColor\b/g, 'Colour'], [/\bOmbre\b/gi, 'Ombré'], [/\bGel X\b/g, 'Gel‑X'],
  [/\bAcylic\b/g, 'Acrylic'], [/\bFullset\b/g, 'Full Set'], [/\bADD\b/g, 'Add'],
  [/\bUv\b/g, 'UV'], [/\bBiab\b/g, 'BIAB'], [/\s+/g, ' ']
];

const GROUP = {
  'Nails Extension': 'Nail Extensions',
  'Shellac | Gel Colour': 'Shellac & Gel Colour',
  'Pedicure, Manicure': 'Pedicure & Manicure',
  'Hello Kitty (Under 8 Years Old )': 'Hello Kitty — under 8s',
  'Hello Kiddy': 'Hello Kiddy — children',
  'Eyelash Extension': 'Lash Extensions',
  'Acrylic, Solar, Gel Extension Nails': 'Acrylic, Solar & Gel Extensions',
  'Pedicure & Manicure With Gel Colour': 'Pedicure & Manicure with Gel Colour'
};

/* Only orthography and disambiguation. No price, duration or meaning is changed;
   where a label is ambiguous in the booking system it is reproduced verbatim so
   the site never disagrees with the screen the client actually books on. */
const ITEM = {
  'Manicure/Pedicure Set': 'Manicure / Pedicure Set',
  'Deluxe Manicure/Pedicure Set': 'Deluxe Manicure / Pedicure Set',
  'Shellac/Gel Colour - New': 'Shellac / Gel Colour — New',
  'Shellac/Gel Colour - Gel French': 'Gel French',
  'Shellac/Gel Colour - Manicure': 'With Manicure',
  'Shellac/Gel Colour - Pedicure': 'With Pedicure',
  'Shellac/Gel Colour - Manicure/Pedicure Set': 'With Manicure / Pedicure Set',
  'Shellac/Gel Colour Take Off': 'Shellac / Gel Colour Take Off',
  'Volume set': 'Volume Set', 'Volume fill': 'Volume Fill',
  'Full Set with shellac': 'Full Set with Shellac',
  'Fill with shellac': 'Fill with Shellac',
  'Full Set Ombré (pink-white)': 'Full Set Ombré (Pink & White)',
  'Fill Ombré (pink-white)': 'Fill Ombré (Pink & White)',
  'Full Set Ombré Colour': 'Full Set Ombré (Colour)',
  'Combo Pedicure & Manicure (regular Colour)': 'Pedicure & Manicure Combo (Regular Colour)',
  'Manicure& Gel Pedicure': 'Manicure & Gel Pedicure',
  'Gel Pedi+ Gel Mani': 'Gel Pedicure + Gel Manicure',
  'Deluxe Manicure With Regular Colour': 'Deluxe Manicure (Regular Colour)',
  'Deluxe Pedicure With Regular Colour': 'Deluxe Pedicure (Regular Colour)',
  'Little Princess Mani & Pedi (with Regular Colour)': 'Little Princess Mani & Pedi (Regular Colour)',
  'Dipping Colour Without Manicure': 'Dipping Colour without Manicure',
  'Dipping Colour With Manicure': 'Dipping Colour with Manicure',
  'Dipping French-Ombré Without Mani': 'Dipping French Ombré without Manicure',
  'Dipping French-Ombré With Mani': 'Dipping French Ombré with Manicure',
  'Dipping Removal Add On Service': 'Dipping Removal (add‑on)',
  'Acrylic Removal Add On To Service': 'Acrylic Removal (add‑on)',
  'Gel‑X fill': 'Gel‑X Fill',
  'UV Gel - Builder Gel Full Set': 'UV Gel — Builder Gel Full Set',
  'UV Gel-Builder Gel FIll': 'UV Gel — Builder Gel Fill',
  'Overlay Gel - BIAB': 'Overlay Gel — BIAB',
  'New Gel Colour without manicure': 'New Gel Colour (without Manicure)',
  'UV Gel Full Set With Colour': 'UV Gel Full Set with Colour',
  'UV Gel Fill With Colour': 'UV Gel Fill with Colour',
  'Long Nail': 'Long Nails'
};

const norm = (s) => {
  let o = String(s).trim();
  WORDS.forEach(([r, v]) => { o = o.replace(r, v); });
  return o.trim();
};

/* ---------- extraction ---------- */

async function grab(dashSlug) {
  const url = `https://www.dashbooking.com/salon/${dashSlug}/booking`;
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`${url} -> no __NEXT_DATA__ (Dash changed its rendering)`);
  return { url, data: JSON.parse(m[1]) };
}

function harvest(data) {
  const groups = [];
  let staff = null, score = null, hours = null, promos = null;
  (function walk(n) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (Array.isArray(n.services) && n.name && n.services.some((s) => typeof s.price !== 'undefined')) groups.push(n);
    if (Array.isArray(n.staffs) && n.staffs.length && typeof n.staffs[0] === 'object' && n.staffs[0].name) staff = n.staffs;
    if (n.customerScore) score = n.customerScore;
    if (n.businessHour) hours = n.businessHour;
    if (Array.isArray(n.promotions)) promos = n.promotions;
    Object.values(n).forEach(walk);
  })(data);
  return { groups, staff: staff || [], score, hours, promos: promos || [] };
}

function build(slug, place, raw) {
  const byId = {};
  raw.staff.forEach((s) => { byId[s._id] = s.name; });

  const coverage = {};
  const menu = raw.groups.map((g) => {
    const group = GROUP[norm(g.name)] || norm(g.name);
    const seen = new Set();
    let items = [];
    g.services.forEach((sv) => {
      (sv.staffs || []).forEach((id) => { (coverage[id] = coverage[id] || new Set()).add(group); });
      const name = ITEM[norm(sv.name)] || norm(sv.name);
      const key = `${name}|${sv.duration}|${sv.price}|${sv.priceType}`;
      if (seen.has(key)) return;           // Dash carries a few exact duplicates
      seen.add(key);
      items.push({ name, min: sv.duration, from: sv.priceType === 'From', price: sv.price });
    });
    // Langley repeats the group name on every lash row.
    if (slug === 'langley' && group === 'Lash Extensions') {
      items = items.map((i) => ({ ...i, name: i.name.replace(/^Lash Extensions?\s*/, '').trim() || 'Removal' }));
    }
    // Fleetwood carries a second "Design" at $0 beside the $10 one. Held back as a
    // probable duplicate rather than published as a free service (see TODO.md).
    if (slug === 'fleetwood' && group === 'Add-ons') {
      items = items.filter((i) => !(i.name === 'Design' && i.price === 0));
    }
    return { group, items };
  });

  const hours = [];
  for (let d = 0; d < 7; d++) {              // Dash indexes days 0=Sunday, JS convention
    const h = raw.hours && raw.hours[d];
    hours.push(h && h.isOpen && h.shifts && h.shifts[0] ? [h.shifts[0].open, h.shifts[0].close] : null);
  }

  const promotions = raw.promos
    .filter((p) => p.isActive && p.isOnline)
    .map((p) => ({
      name: PROMO_TITLE[String(p.name).trim()] || String(p.name).trim(),
      amount: p.discountType === 'percentage' ? `${p.amount}%` : `$${p.amount}`,
      minimum: p.minimum || 0,
      days: Array.isArray(p.repeat) ? p.repeat : [],
      birthday: !!p.isBirthdayDiscount,
      detail: tidy(p.description),
      from: p.from || null, to: p.to || null
    }));

  return {
    ...place,
    booking: `https://www.dashbooking.com/salon/${place.dash}/booking`,
    hours,
    rating: raw.score
      ? { value: Math.round(raw.score.average * 100) / 100, count: raw.score.totalReviews }
      : null,
    staff: raw.staff
      .map((s) => ({ name: s.name, groups: [...(coverage[s._id] || [])].sort() }))
      .filter((s) => s.groups.length)
      .sort((a, b) => a.name.localeCompare(b.name)),
    menu,
    counts: { groups: menu.length, services: menu.reduce((a, g) => a + g.items.length, 0) },
    promotions
  };
}

async function main() {
  const check = process.argv.includes('--check');
  const out = {
    site: { ...SITE, origin: currentOrigin(), captured: new Date().toISOString().slice(0, 10) },
    locations: {}
  };

  for (const [slug, place] of Object.entries(PLACE)) {
    const { url, data } = await grab(place.dash);
    const loc = build(slug, place, harvest(data));
    out.locations[slug] = loc;
    console.log(`  ${place.name.padEnd(28)} ${loc.counts.services} services in ${loc.counts.groups} groups, ` +
                `${loc.staff.length} technicians, ${loc.rating ? `${loc.rating.value}/5 from ${loc.rating.count}` : 'no rating'}`);
    if (!/\/booking$/.test(url)) throw new Error('unexpected URL shape');
  }

  const next = JSON.stringify(out, null, 2) + '\n';
  const prevRaw = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  // `captured` changes every run; ignore it when deciding whether anything moved.
  const strip = (s) => s.replace(/"captured": "[^"]*"/, '"captured": "-"');

  if (check) {
    if (strip(prevRaw) !== strip(next)) {
      console.error('\nSTALE: Dash data differs from tools/site-data.json. Run without --check, then `node tools/build_pages.js`.');
      return 1;
    }
    console.log('\nsite-data.json matches Dash Booking.');
    return 0;
  }

  fs.writeFileSync(OUT, next);
  console.log(`\nwrote ${path.relative(ROOT, OUT)}`);
  if (strip(prevRaw) !== strip(next)) console.log('Data changed — run `node tools/build_pages.js` to regenerate the pages.');
  return 0;
}

main().then((c) => process.exit(c)).catch((e) => { console.error(e.message); process.exit(1); });
