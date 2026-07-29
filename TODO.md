# LaVie Nail Lounge — outstanding work

Live preview: https://lavie-nail-lounge.vercel.app
Repo: https://github.com/SeanCFAFinlay/Lavie-Nail-Lounge-Enhanced-Improved

Working document. Tick items off as they land; delete the file once everything is closed.
Full background for any item is in `DESIGN.md` §8. Internal — not published (see `.vercelignore`).

---

## 0. Needs a decision or a value from you

- [ ] **Analytics IDs.** `assets/analytics.js` is wired for GA4, Google Tag Manager and Microsoft
      Clarity, with every tag switched off until an ID is filled in. Paste the four values into
      the `CONFIG` block at the top of that file — nothing else needs touching:
      - GA4 measurement ID `G-…` (analytics.google.com → Admin → Data streams)
      - GTM container ID `GTM-…` (tagmanager.google.com). *If GA4 runs through GTM, set GTM only
        and leave `ga4` blank, or every page view is counted twice.*
      - Clarity project ID (clarity.microsoft.com → Settings → Setup)
      - Search Console: uncomment the `<meta name="google-site-verification">` in `index.html`
        and paste the token — **or** add the DNS TXT record, which is better and survives
        redesigns. The commented block is right under the canonical tag.

- [ ] **Legal sign-off on `terms.html` and `privacy.html`.** Both were written from scratch for
      this business — no template — using facts verified in the booking system: no deposit,
      immediate confirmation, 60-day booking window, gift cards sold online, per-studio menus,
      Dash Booking as processor. They are drafted to be accurate, not to be a substitute for a
      lawyer reading them. Two clauses in particular are commitments rather than descriptions,
      and you should confirm you are happy to be held to them:
      - Terms §8 / Privacy §6 — we will not photograph or post a client's work on request, and
        will take down anything already published if asked.
      - Terms §4 — late arrival means "as much as the remaining time allows, or rebook".
      Also note the privacy policy discloses GA4, GTM and Clarity as in use. That is accurate
      once the IDs above are filled in, and harmlessly over-disclosed until then.

- [ ] **Publish an email address?** None is published anywhere public. Dash Booking's *internal
      notification* settings list `lavienaillounge21@gmail.com` (all three studios) and
      `3dnailsspa2014@gmail.com` (Langley). Those are back-office fields, not a customer-facing
      address, so they have deliberately **not** been put on the site. A privacy policy is
      stronger with a written contact route — currently it gives the phone numbers and the
      Fleetwood postal address. Say the word and an email goes into the footer, the privacy
      contact and the structured data.

- [ ] **Sunday hours at Fleetwood.** Dash Booking says **10am–6pm**. An independent directory
      listing says **11am–5pm**. The site follows Dash, as the salon's own system. Monday to
      Saturday agree exactly across both sources, so this is the only day in question.

- [ ] **Repair pricing (Fleetwood).** Unchanged from before: the booking system lists
      *Fix (under Policy <7 Days)* at **$7** and *Fix (>7 Days)* at **$0** — as written, the later
      repair is the free one, which is the reverse of the usual arrangement. Reproduced exactly as
      listed; the FAQ deliberately avoids saying which is which. Confirm and both get corrected.
      (Newton lists this as *Nail Repair* from $6. Langley has no repair line at all — worth
      checking whether that is intentional.)

- [ ] **Duplicate add-on (Fleetwood).** The Add-ons group carries a second *Design* entry at
      **$0 / 15 min** alongside the $10 one. Omitted as a probable duplicate — confirm if it is a
      real complimentary option. `tools/fetch_dash.js` filters it out by name; remove that filter
      if it is genuine.

- [ ] **Facebook page link.** `facebook.com/p/Lavie-Nail-Lounge-100075865032810/` returns 400 to
      automated checks, which is normal for Facebook blocking datacentre traffic — but please
      open it once in a browser to confirm it is the right page and still live.

## 1. Content that can only come from the salon

- [ ] **Written client testimonials.** 3–5 real reviews from the studios' own Google Business
      Profiles. For each: review text, first name or initials as published, service booked,
      source, star rating, date. Reviews mentioning how long a set lasted, cleanliness, or a
      technician by name are the most persuasive.
      *Do not use review-aggregator sites* — they mis-attribute between salons.
      → The section is built and working. Paste each review into the commented
      `<figure class="tst__item">` template in `index.html#reviews`; the deck wires itself up.
      **Nothing here may be invented.**
      → *Partly unblocked:* the star ratings and review counts are now live and real (4.6 average
      across 527 reviews, per studio), so the section is no longer empty while you gather quotes.

- [ ] **Technician photographs and specialisms.** Every technician is now listed by name with the
      service groups they take, read straight from the booking system. Dash holds no photo, title
      or biography for any of them, so the cards are name + services only. A headshot and one line
      each ("six years in Gel-X", "our lash lead") would turn a list into real profiles.
      **Do not invent these** — the pre-rebuild site carried seventeen fabricated staff biographies
      and they are the reason `_archive/` is excluded from the deploy.

- [ ] **First-time client incentive.** Still no such offer. Newton's three real, currently active
      promotions are now published on `newton.html#offers` (Happy Hour, tenth visit, birthday).
      Fleetwood and Langley have none configured in the booking system — if they run offers
      informally, adding them to Dash makes them appear on the site automatically.

## 2. Assets

- [ ] **Original vector logo.** None was supplied. `assets/logo-wordmark.svg`, `logo-badge.svg`
      and `favicon.svg` were rebuilt from the current site's header image — the badge typography
      in particular is an approximation. Replace if the originals exist.

- [ ] **Photography gaps.** All photographs are hand/nail or lash close-ups. There is no Head Spa,
      pedicure, waxing, dipping, interior or technician-at-work image, so those services borrow
      nail imagery. Most useful, in order:
      1. A Head Spa treatment  2. A pedicure  3. Studio interior  4. A technician working
      5. A shopfront for each studio — the three "location photos" on the old site are nail
         close-ups with the studio name typed over them, one of which still says *3D Nails Spa*.

- [ ] **Live Instagram grid.** Currently links the real accounts (@lavie_nail_lounge21 and
      @lavie_nail_lounge25). An auto-updating grid needs an Instagram Graph API access token tied
      to a Business account, or a paid third-party widget.

## 3. Before the domain moves

- [ ] **Point the domain.** `canonical`, `og:url` and every structured-data URL already say
      `https://lavienaillounge.ca`. That domain still serves the old site, so those URLs 404
      today — expected, and they come right the moment DNS moves. If the final address differs,
      change `site.origin` in `tools/site-data.json` and re-run `node tools/build_pages.js`.

- [ ] **Submit the sitemap** at `https://lavienaillounge.ca/sitemap.xml` in Search Console once
      the domain is live and verified.

- [ ] **Real device testing** — verified in Chromium, Firefox and WebKit via automation, but not
      yet on a physical iPhone or Android handset.

- [ ] Decide whether `Lavie-Nail-Lounge-Enhanced-Improved3.zip` (5.2 MB) should stay in the repo;
      it is excluded from the deploy but still bloats every clone.

---

## How the site is built now

Prices, durations, opening hours, technicians, review scores and promotions are **not written by
hand**. They are read from the salon's own Dash Booking pages and committed to
`tools/site-data.json`, which generates the three studio pages, the price menus and the sitemap.

```
node tools/fetch_dash.js     # refresh site-data.json from Dash Booking
node tools/build_pages.js    # regenerate fleetwood/newton/langley + services menu + sitemap
node tools/verify.js         # static checks: links, ids, headings, schema, phone numbers
node tools/check_links.js    # fetch every external URL and report what comes back
```

`--check` on the first two, and `verify.js`, all exit non-zero when something is stale or wrong,
so they can go in CI. Run all four before any deploy that touches content.

**Do not hand-edit** the price lists in `services.html` (between the `BUILD:MENU` markers) or
anything in `fleetwood.html`, `newton.html`, `langley.html` — the next build overwrites it.

---

## Closed

Design and build: rebuilt on verified content, typography reworked for legibility, layout
tightened twice, imagery cleaned, motion layer added, all three studios bookable, booking embedded
on-page, Get Directions per studio, Instagram linked.

This pass: replaced the two template legal pages with LaVie-specific Terms and a BC PIPA privacy
policy; **fixed the dead Langley booking link** (the old `3d-nails-spa` calendar 404s since the
rebrand — every "Book" button for Langley was going nowhere); corrected the Langley name and
postal code; published real per-studio opening hours, review scores, technician rosters and
Newton's live promotions; split the single merged price list into the three genuinely different
studio menus; added `From` pricing where the booking system marks it; added dedicated Fleetwood,
Newton and Langley pages; LocalBusiness/NailSalon, FAQPage, BreadcrumbList and Organization
structured data; canonical URLs on every page; `sitemap.xml`, `robots.txt` and `vercel.json` with
redirects from the old site's URLs; a `/links` social landing page; service-specific booking CTAs;
expanded gallery filters from four to seven; and the measurement layer, off until its IDs are set.

Verified: heading order, unique ids, in-page anchors, tag balance, `rel=noopener`, alt text on
every image, canonical on every page, JSON-LD parses and agrees with the source data, every local
link resolves, every phone number belongs to a studio, and all three booking calendars plus all
nine map URLs return 200.
