#!/usr/bin/env node
/**
 * Generate the per-location pages and sitemap from tools/site-data.json.
 *
 *     node tools/build_pages.js            # write fleetwood/newton/langley + sitemap
 *     node tools/build_pages.js --check    # verify only; non-zero exit if stale
 *
 * Three near-identical pages carrying three different price menus is exactly the
 * kind of thing that drifts when maintained by hand, so they are generated. Run
 * `node tools/fetch_dash.js` first to refresh the data, then this.
 *
 * The price-menu block inside services.html is generated too, spliced between
 * the BUILD:MENU markers so the hand-written prose around it survives.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'site-data.json'), 'utf8'));
const { site, locations } = DATA;
const ORIGIN = site.origin;

/* ---------- helpers ---------- */

const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];                       // Monday-first for display

const clock = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
};
const span = (h) => (h ? `${clock(h[0])} – ${clock(h[1])}` : 'Closed');
const money = (item) => `${item.from ? 'From ' : ''}$${item.price}`;

/* Collapse consecutive days sharing the same shift, Monday-first. */
function hourRuns(hours) {
  const runs = [];
  ORDER.forEach((d) => {
    const key = hours[d] ? hours[d].join('-') : 'closed';
    const last = runs[runs.length - 1];
    if (last && last.key === key) last.days.push(d);
    else runs.push({ key, days: [d], hours: hours[d] });
  });
  return runs;
}

const runLabel = (run) => (run.days.length === 1
  ? DAYS[run.days[0]]
  : `${DAYS[run.days[0]]} – ${DAYS[run.days[run.days.length - 1]]}`);

const summarise = (hours) => hourRuns(hours).map((r) => `${runLabel(r)} ${span(r.hours)}`).join(' · ');

/* ---------- shared chrome ---------- */

const others = (slug) => Object.values(locations).filter((l) => l.slug !== slug);

function head(loc) {
  const title = `${loc.name} — Nail Salon in ${loc.neighbourhood}`;
  const desc = `${loc.name} at ${loc.street}, ${loc.locality}. ${loc.counts.services} services with published prices and durations, `
    + `opening hours, technicians and online booking. ${loc.phoneDisplay.replace(/‑/g, '-')}.`;
  const url = `${ORIGIN}/${loc.slug}.html`;
  const img = `${ORIGIN}/assets/img/${loc.img}-1600.jpg`;

  const offers = loc.menu.flatMap((g) => g.items.map((i) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: i.name, category: g.group },
    priceCurrency: 'CAD',
    ...(i.from
      ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: i.price, priceCurrency: 'CAD' } }
      : { price: i.price })
  })));

  const salon = {
    '@context': 'https://schema.org',
    '@type': 'NailSalon',
    '@id': `${url}#salon`,
    name: loc.name,
    ...(loc.formerly ? { alternateName: loc.formerly } : {}),
    url,
    image: img,
    telephone: loc.phoneE164,
    priceRange: '$$',
    currenciesAccepted: 'CAD',
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.street,
      addressLocality: loc.locality,
      addressRegion: loc.region,
      postalCode: loc.postal,
      addressCountry: 'CA'
    },
    areaServed: [
      { '@type': 'City', name: loc.locality },
      { '@type': 'AdministrativeArea', name: 'Metro Vancouver' }
    ],
    hasMap: `https://www.google.com/maps?q=${loc.mapQuery}`,
    openingHoursSpecification: hourRuns(loc.hours).filter((r) => r.hours).map((r) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: r.days.map((d) => `https://schema.org/${DAYS[d]}`),
      opens: r.hours[0],
      closes: r.hours[1]
    })),
    ...(loc.rating ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: loc.rating.value,
        reviewCount: loc.rating.count,
        bestRating: 5,
        worstRating: 1
      }
    } : {}),
    parentOrganization: { '@type': 'Organization', '@id': `${ORIGIN}/#organization`, name: site.brand },
    sameAs: [loc.instagram, site.facebook],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${loc.name} price menu`,
      itemListElement: offers
    },
    potentialAction: {
      '@type': 'ReserveAction',
      target: { '@type': 'EntryPoint', urlTemplate: loc.booking, actionPlatform: ['https://schema.org/DesktopWebPlatform', 'https://schema.org/MobileWebPlatform'] },
      result: { '@type': 'Reservation', name: `Appointment at ${loc.name}` }
    }
  };

  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Locations', item: `${ORIGIN}/#studios` },
      { '@type': 'ListItem', position: 3, name: loc.short, item: url }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}" />
<link rel="canonical" href="${url}" />

<meta property="og:type" content="business.business" />
<meta property="og:title" content="${e(title)}" />
<meta property="og:description" content="${e(desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${img}" />
<meta property="og:locale" content="en_CA" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="theme-color" content="#FDF8EF" />
<meta name="geo.region" content="CA-BC" />
<meta name="geo.placename" content="${e(loc.locality)}" />

<link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@400;500;600&display=swap" rel="stylesheet" />
<script>document.documentElement.classList.add('js');</script>
<link rel="stylesheet" href="assets/lavie.css" />
<script src="assets/analytics.js" defer></script>

<script type="application/ld+json">
${JSON.stringify(salon, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(crumbs, null, 2)}
</script>
</head>`;
}

function nav(loc) {
  return `<body>
<a class="skip" href="#main">Skip to content</a>

<header class="nav is-scrolled">
  <a class="nav__brand" href="index.html" aria-label="LaVie Nail Lounge — home">
    <img src="assets/logo-lavie.png" alt="LaVie Nail Lounge" width="900" height="493" />
  </a>
  <nav aria-label="Primary">
    <ul class="nav__links">
      <li><a href="services.html">Services</a></li>
      <li><a href="index.html#work">Work</a></li>
      <li><a href="index.html#questions">Questions</a></li>
      <li><a href="${loc.slug}.html" aria-current="page">Locations</a></li>
    </ul>
  </nav>
  <div class="nav__end">
    <a class="btn btn--sm" href="#book"><span class="btn__t">Book at ${e(loc.short)}</span></a>
    <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="menu"><span aria-hidden="true"></span>Menu</button>
  </div>
</header>

<div class="menu" id="menu">
  <nav aria-label="Mobile">
    <ul>
      <li><a href="index.html">Home</a></li>
      <li><a href="services.html">Price Menu</a></li>
      <li><a href="index.html#work">Selected Work</a></li>
      <li><a href="index.html#questions">Questions</a></li>
      <li><a href="fleetwood.html">Fleetwood</a></li>
      <li><a href="newton.html">Newton</a></li>
      <li><a href="langley.html">Langley</a></li>
    </ul>
  </nav>
  <div class="menu__foot">
    <a class="btn" href="#book"><span class="btn__t">Book at ${e(loc.short)}</span></a>
    <a class="btn btn--ghost" href="tel:${loc.phoneTel}"><span class="btn__t">Call ${e(loc.short)}</span></a>
  </div>
</div>`;
}

function footer(loc) {
  return `<footer class="ft">
  <div class="shell">
    <div class="ft__top">
      <div class="ft__brand">
        <img src="assets/logo-lavie.png" alt="LaVie Nail Lounge" width="900" height="493" />
        <p>Nails, lash extensions, head spa and waxing across three studios in Surrey and Langley.
           Every price and duration published before you book.</p>
      </div>
      <div>
        <h3>Locations</h3>
        <ul>
${Object.values(locations).map((l) => `          <li><a href="${l.slug}.html">${e(l.short)} — ${e(l.street.replace(/ Unit #\d+| #\d+/, ''))}</a></li>`).join('\n')}
          <li><a href="services.html">Full price menu</a></li>
        </ul>
      </div>
      <div>
        <h3>Book at ${e(loc.short)}</h3>
        <ul>
          <li><a href="${loc.booking}" target="_blank" rel="noopener">Book online</a></li>
          <li><a href="tel:${loc.phoneTel}">${e(loc.phoneDisplay)}</a></li>
          <li><a href="https://www.google.com/maps/dir/?api=1&amp;destination=${loc.dirQuery}" target="_blank" rel="noopener">Get directions</a></li>
          <li><a href="${loc.instagram}" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="${site.facebook}" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
      </div>
    </div>
    <div class="ft__bot">
      <p style="margin:0">© <span data-year></span> LaVie Nail Lounge. All rights reserved.</p>
      <p style="margin:0"><a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="links.html">Links</a></p>
    </div>
  </div>
</footer>

<div class="sticky" aria-label="Quick actions">
  <a class="btn btn--sm btn--book" href="#book"><span class="btn__t">Book</span></a>
  <a class="btn btn--sm btn--ghost" href="tel:${loc.phoneTel}"><span class="btn__t">Call</span></a>
  <a class="btn btn--sm btn--ghost" href="https://www.google.com/maps/dir/?api=1&amp;destination=${loc.dirQuery}" target="_blank" rel="noopener"><span class="btn__t">Directions</span></a>
</div>

<script src="assets/lavie.js" defer></script>
</body>
</html>
`;
}

/* ---------- page body ---------- */

function priceMenu(loc, { headingLevel = 2, idPrefix = '' } = {}) {
  const H = `h${headingLevel}`;
  return loc.menu.map((g, n) => `
    <section class="menu-grp rv" id="${idPrefix}${g.group.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">
      <div class="menu-grp__head"><${H}>${e(g.group)}</${H}><span class="label label--bare">${String(n + 1).padStart(2, '0')}</span></div>
      <ul class="price-list">
${g.items.map((i) => `        <li><span class="nm">${e(i.name)}</span><span class="dur">${i.min} min</span><span class="pr">${e(money(i))}</span></li>`).join('\n')}
      </ul>
      <p class="menu-grp__book">
        <a class="btn btn--sm" href="${loc.booking}" target="_blank" rel="noopener"><span class="btn__t">Book ${e(g.group.replace(/ —.*$/, ''))} at ${e(loc.short)}</span></a>
      </p>
    </section>`).join('\n');
}

function ratingChip(loc, cls = 'rating') {
  if (!loc.rating) return '';
  const full = Math.round(loc.rating.value);
  return `<p class="${cls}">
        <span class="rating__stars" aria-hidden="true">${'★'.repeat(full)}${'☆'.repeat(5 - full)}</span>
        <span class="rating__val">${loc.rating.value.toFixed(1)}</span>
        <span class="rating__meta">from ${loc.rating.count} client reviews collected at booking</span>
      </p>`;
}

function page(loc) {
  const todayNote = summarise(loc.hours);
  const groupsList = loc.menu.map((g) => g.group).join(', ');

  return `${head(loc)}
${nav(loc)}

<main id="main">

<section class="phead lochead">
  <div class="shell">
    <nav class="crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="index.html">Home</a></li>
        <li><a href="index.html#studios">Locations</a></li>
        <li aria-current="page">${e(loc.short)}</li>
      </ol>
    </nav>
    <p class="label rv">${e(loc.neighbourhood)}</p>
    <h1 class="rv" data-d="1">${e(loc.short)}<span class="it">.</span></h1>
    ${loc.formerly ? `<p class="lochead__former rv" data-d="1">Previously <strong>${e(loc.formerly)}</strong> — same studio, same team, same address.</p>` : ''}
    <p class="lead rv" data-d="2">${e(loc.lead)}</p>
    ${ratingChip(loc, 'rating rv')}
    <div class="lochead__act rv" data-d="3">
      <a class="btn" href="#book"><span class="btn__t">Book at ${e(loc.short)}</span>
        <svg class="btn__i" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.4"/></svg></a>
      <a class="btn btn--ghost" href="tel:${loc.phoneTel}"><span class="btn__t">${e(loc.phoneDisplay)}</span></a>
      <a class="btn btn--ghost" href="https://www.google.com/maps/dir/?api=1&amp;destination=${loc.dirQuery}" target="_blank" rel="noopener"><span class="btn__t">Directions</span>
        <svg class="btn__i" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 14s5-4.6 5-8A5 5 0 0 0 3 6c0 3.4 5 8 5 8Z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="6" r="1.7" stroke="currentColor" stroke-width="1.3"/></svg></a>
    </div>
  </div>
</section>

<section class="section section--tight locinfo">
  <div class="shell">
    <div class="locinfo__grid">
      <div class="locinfo__col">
        <h2 class="h3 rv">Opening hours</h2>
        <ul class="loc__hours rv" data-d="1">
${ORDER.map((d) => `          <li><b>${DAYS[d]}</b><span>${span(loc.hours[d])}</span></li>`).join('\n')}
        </ul>
        <p class="locinfo__note rv" data-d="2">Hours as set in our booking system. Live availability — including
          any holiday closures — is always shown on the booking calendar below.</p>
      </div>

      <div class="locinfo__col">
        <h2 class="h3 rv">Find us</h2>
        <address class="rv" data-d="1">
          ${e(loc.street)}<br />${e(loc.locality)}, ${loc.region} ${e(loc.postal)}<br />
          <a href="tel:${loc.phoneTel}">${e(loc.phoneDisplay)}</a>
        </address>
        <p class="locinfo__note rv" data-d="2">${e(loc.nearby)}</p>
        <iframe class="loc__map" src="https://www.google.com/maps?q=${loc.mapQuery}&amp;output=embed"
                loading="lazy" title="Map — ${e(loc.name)}"></iframe>
      </div>

      <figure class="locinfo__fig rv-mask" data-d="2">
        <img src="assets/img/${loc.img}-1600.jpg" srcset="assets/img/${loc.img}-800.jpg 800w, assets/img/${loc.img}-1600.jpg 1600w"
             sizes="(max-width: 1080px) 92vw, 30vw" alt="${e(loc.imgAlt)}" width="1600" height="1219" loading="lazy" />
        <figcaption>Work from the LaVie studios</figcaption>
      </figure>
    </div>
  </div>
</section>
${promoBlock(loc)}
<section class="section svc" id="prices">
  <div class="shell">
    <div class="svc__head">
      <div>
        <p class="label rv">Price menu</p>
        <h2 class="h2 rv reveal-mask" data-d="1" style="margin-top:1rem">What ${e(loc.short)} offers.</h2>
      </div>
      <p class="lead measure rv" data-d="2" style="margin:0">
        ${loc.counts.services} services in ${loc.counts.groups} groups, each with a price and an expected
        duration. This menu is ${e(loc.short)}’s own — our three studios do not carry identical lists.
      </p>
    </div>
${priceMenu(loc)}
    <p class="rv" style="margin-top:2rem">
      <a class="tlink" href="services.html">Compare all three studio menus
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.4"/></svg></a>
    </p>
  </div>
</section>

<section class="section team" id="team">
  <div class="shell">
    <div class="svc__head">
      <div>
        <p class="label rv">The team</p>
        <h2 class="h2 rv reveal-mask" data-d="1" style="margin-top:1rem">Who you can book.</h2>
      </div>
      <p class="lead measure rv" data-d="2" style="margin:0">
        ${loc.staff.length} technicians take appointments at ${e(loc.short)}. Request anyone by name when you
        book, or leave it open and the studio will assign the next available.
      </p>
    </div>
    <ul class="team__grid">
${loc.staff.map((s, n) => `      <li class="team__card rv" data-d="${(n % 4) + 1}">
        <span class="team__initial" aria-hidden="true">${e(s.name.trim().charAt(0))}</span>
        <h3>${e(s.name)}</h3>
        <p class="team__does">${e(s.groups.join(' · '))}</p>
      </li>`).join('\n')}
    </ul>
    <p class="team__note rv">Technician names and the services each one takes are read from our booking system,
      so this list stays in step with who is actually on the calendar.</p>
  </div>
</section>

<section class="section cta" id="book">
  <div class="shell cta__inner">
    <p class="label label--invert rv">Reserve</p>
    <h2 class="rv" data-d="1">Book at <span class="it">${e(loc.short)}.</span></h2>
    <p class="lead cta__lead rv" data-d="2">
      You will see the price and the length of the appointment before you confirm.
    </p>

    <div class="booking booking--single rv" data-d="3">
      <div class="booking__tabs" role="group" aria-label="Open the booking calendar">
        <button type="button" class="booking__tab" data-src="${loc.booking}" data-label="${e(loc.short)}" aria-pressed="false">
          <span class="booking__tab-name">Open the ${e(loc.short)} calendar</span>
          <span class="booking__tab-sub">${e(loc.street)}, ${e(loc.locality)}</span>
        </button>
      </div>

      <div class="booking__stage" id="bookingStage" hidden>
        <div class="booking__bar">
          <p class="booking__now">Booking — <b id="bookingWhich"></b></p>
          <a class="booking__out" id="bookingOut" href="${loc.booking}" target="_blank" rel="noopener">
            Open in a new tab
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" stroke="currentColor" stroke-width="1.5"/></svg>
          </a>
        </div>
        <div class="booking__frame">
          <p class="booking__loading" id="bookingLoading">Loading the booking calendar…</p>
          <iframe id="bookingFrame" title="Book an appointment at ${e(loc.name)}" loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>

      <p class="booking__fallback">
        Prefer the phone? ${e(loc.short)} <a href="tel:${loc.phoneTel}">${e(loc.phoneDisplay)}</a>
      </p>
    </div>
  </div>
</section>

<section class="section section--tight loc" id="studios">
  <div class="shell">
    <p class="label rv">Our other studios</p>
    <h2 class="h2 rv reveal-mask" data-d="1" style="margin-top:.8rem">Not the closest one?</h2>
    <div class="loc__grid">
${others(loc.slug).map((l, n) => `      <article class="loc__card rv" data-d="${n + 1}">
        <h3><a href="${l.slug}.html">${e(l.short)}</a></h3>
        <address>
          ${e(l.street)}<br />${e(l.locality)}, ${l.region} ${e(l.postal)}<br />
          <a href="tel:${l.phoneTel}">${e(l.phoneDisplay)}</a>
        </address>
        <p class="loc__sum">${e(summarise(l.hours))}</p>
        ${ratingChip(l, 'rating rating--sm')}
        <div class="loc__act">
          <a class="btn btn--sm" href="${l.slug}.html"><span class="btn__t">${e(l.short)} details</span></a>
          <a class="btn btn--sm btn--ghost" href="${l.booking}" target="_blank" rel="noopener"><span class="btn__t">Book</span></a>
        </div>
      </article>`).join('\n')}
    </div>
  </div>
</section>

</main>

${footer(loc)}`.replace(/\n{3,}/g, '\n\n');
}

/* "2027-05-20" is a plain calendar date, not an instant. new Date() would read it
   as UTC midnight and render the day before in Pacific time. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
const calendarDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

function promoBlock(loc) {
  if (!loc.promotions.length) return '';
  const dayName = (d) => DAYS[d].slice(0, 3);
  return `
<section class="section section--tight promo" id="offers">
  <div class="shell">
    <p class="label rv">Current offers</p>
    <h2 class="h2 rv reveal-mask" data-d="1" style="margin-top:.8rem">Running at ${e(loc.short)}.</h2>
    <p class="lead measure-wide rv" data-d="2" style="margin-top:1rem">
      These are applied automatically at checkout by our booking system. They run at ${e(loc.short)} only.
    </p>
    <ul class="promo__grid">
${loc.promotions.map((p, n) => `      <li class="promo__card rv" data-d="${n + 1}">
        <span class="promo__amt">${e(p.amount)} off</span>
        <h3>${e(p.name.trim().replace(/\.$/, ''))}</h3>
        <p>${e(p.detail)}</p>
        <p class="promo__terms">${[
          p.minimum ? `Minimum spend $${p.minimum}.` : '',
          p.days.length && p.days.length < 7 ? `${p.days.map(dayName).join(', ')} only.` : '',
          p.birthday ? 'Applied automatically around your birthday.' : ''
        ].filter(Boolean).map(e).join(' ') || 'Applied automatically at checkout.'}</p>
        ${p.to ? `<p class="promo__valid">Valid to ${e(calendarDate(p.to))}</p>` : ''}
      </li>`).join('\n')}
    </ul>
    <p class="promo__note rv">Terms are as set in the booking system at the time you book; the calendar is
      the authority on what applies to your cart.</p>
  </div>
</section>
`;
}

/* ---------- services.html menu block ---------- */

function servicesBlock() {
  const tabs = Object.values(locations).map((l, n) => `        <button type="button" class="mtab" data-menu="${l.slug}" aria-pressed="${n === 0}">
          <span class="mtab__name">${e(l.short)}</span>
          <span class="mtab__sub">${l.counts.services} services</span>
        </button>`).join('\n');

  const panels = Object.values(locations).map((l, n) => `
      <div class="mpanel" id="menu-${l.slug}" data-menu="${l.slug}"${n === 0 ? '' : ' hidden'}>
        <div class="mpanel__head">
          <h2 class="h3">${e(l.name)}</h2>
          <p>${e(l.street)}, ${e(l.locality)} · <a href="tel:${l.phoneTel}">${e(l.phoneDisplay)}</a> ·
             <a href="${l.slug}.html">Studio page</a></p>
          <p class="mpanel__hours">${e(summarise(l.hours))}</p>
        </div>
${priceMenu(l, { headingLevel: 3, idPrefix: `${l.slug}-` })}
        <p class="mpanel__cta">
          <a class="btn" href="${l.booking}" target="_blank" rel="noopener"><span class="btn__t">Book at ${e(l.short)}</span>
            <svg class="btn__i" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.4"/></svg></a>
        </p>
      </div>`).join('\n');

  return `      <div class="mtabs" role="group" aria-label="Choose a studio price menu">
${tabs}
      </div>
      <p class="vh" id="menuStatus" role="status" aria-live="polite"></p>
${panels}
`;
}

/* ---------- sitemap ---------- */

function sitemap() {
  const today = site.captured;
  const pages = [
    { loc: `${ORIGIN}/`, pri: '1.0', freq: 'weekly' },
    { loc: `${ORIGIN}/services.html`, pri: '0.9', freq: 'weekly' },
    ...Object.values(locations).map((l) => ({ loc: `${ORIGIN}/${l.slug}.html`, pri: '0.9', freq: 'weekly' })),
    { loc: `${ORIGIN}/links`, pri: '0.4', freq: 'monthly' },
    { loc: `${ORIGIN}/privacy.html`, pri: '0.2', freq: 'yearly' },
    { loc: `${ORIGIN}/terms.html`, pri: '0.2', freq: 'yearly' }
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.pri}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

/* ---------- run ---------- */

function splice(file, marker, block) {
  const src = fs.readFileSync(file, 'utf8');
  const open = `<!-- BUILD:${marker} -->`;
  const close = `<!-- /BUILD:${marker} -->`;
  const a = src.indexOf(open);
  const b = src.indexOf(close);
  if (a === -1 || b === -1) throw new Error(`${path.basename(file)}: missing ${open} … ${close} markers`);
  return src.slice(0, a + open.length) + '\n' + block + src.slice(b);
}

function main() {
  const check = process.argv.includes('--check');
  const writes = [];

  Object.values(locations).forEach((l) => writes.push([path.join(ROOT, `${l.slug}.html`), page(l)]));
  writes.push([path.join(ROOT, 'sitemap.xml'), sitemap()]);

  const servicesPath = path.join(ROOT, 'services.html');
  if (fs.existsSync(servicesPath)) writes.push([servicesPath, splice(servicesPath, 'MENU', servicesBlock())]);

  let stale = 0;
  writes.forEach(([file, content]) => {
    const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (prev === content) return;
    stale++;
    if (check) { console.log(`  STALE  ${path.relative(ROOT, file)}`); return; }
    fs.writeFileSync(file, content);
    console.log(`  wrote  ${path.relative(ROOT, file)}  ${(content.length / 1024).toFixed(1)}KB`);
  });

  if (check) {
    if (stale) { console.error(`\n${stale} generated file(s) out of date. Run: node tools/build_pages.js`); return 1; }
    console.log('generated pages up to date');
    return 0;
  }
  console.log(`\n${stale} file(s) updated, ${writes.length - stale} already current.`);
  return 0;
}

process.exit(main());
