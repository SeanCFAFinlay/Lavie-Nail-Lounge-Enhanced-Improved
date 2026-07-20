# LaVie Nail Lounge — outstanding work

Live preview: https://lavie-nail-lounge.vercel.app
Repo: https://github.com/SeanCFAFinlay/Lavie-Nail-Lounge-Enhanced-Improved

Working document. Tick items off as they land; delete the file once everything is closed.
Full background for any item is in `DESIGN.md` §8. Internal — not published (see `.vercelignore`).

---

## 1. Blocks going live on lavienaillounge.ca

Nothing below can be resolved by writing code. Each needs a fact from the salon.

- [ ] **Client testimonials.** 3–5 real reviews from the salon's own Google Business Profile.
      For each: review text, first name or initials as published, service booked, source, star
      rating, date. Reviews mentioning how long a set lasted, cleanliness, or a technician by
      name are the most persuasive.
      *Do not use review-aggregator sites* — they mis-attribute between salons. A search for
      LaVie's reviews returned copy under a `bestprosintown.com/.../magical-nails-` URL and a
      Trustindex page for `lavienails.net`, an unrelated business.
      → Section is built and working. Paste each review into the commented `<figure
      class="tst__item">` template in `index.html`; the Google-listing links hide themselves
      automatically. **Nothing here may be invented.**

- [ ] **Terms & Conditions and Privacy Policy.** The current pages on lavienaillounge.ca are
      uncustomised templates for a different company:
      - `terms-and-conditions.html` is written for **"Victoria's Nails & Spa"**
      - `privacy-policy.html` gives a contact address of **524 Broadway Mall, Hicksville, NY**
        and phone **(516) 597-5999**
      Neither was carried over. A BC salon collecting names, phone numbers and emails needs its
      own policy under PIPA. Owner/legal, not developer.

- [ ] **Opening hours.** Not published anywhere — the Hours section on the current site exists
      but was never filled in, for any location. Location cards currently link to each booking
      page for live availability rather than state unverified times as fact.
      → Supply per location and they go straight onto the cards.

- [ ] **Repair pricing.** The booking system lists *Fix (under Policy <7 Days)* at **$7** and
      *Fix (>7 Days)* at **$0** — as written, the later repair is the free one, which is the
      reverse of the usual arrangement. Reproduced exactly as listed; the FAQ deliberately
      avoids saying which is which. Confirm and both get corrected.

## 2. Data conflicts to settle

- [ ] **Langley postal code.** Shown as **V1M 3W4** (matches lavienaillounge.ca and what you
      supplied). The salon's own Dash Booking page says **V1M 2C9**.
- [ ] **Langley salon name.** Listed as **3D Nails Spa**, per the current site. Dash Booking also
      hosts a *"LaVie Nail Lounge Langley"* page at the same street address — confirm whether
      that is a rebrand and which name should show.
- [ ] **Langley phone.** Using **604-888-1619** (yours, and the current site). One directory
      listed 604-888-**1618**. Worth a call to confirm.
- [ ] **Duplicate add-on.** The Add-ons group carries a second *Design* entry at **$0 / 15 min**
      alongside the $10 one. Omitted as a probable duplicate — confirm if it is a real
      complimentary option.
- [ ] **Email address.** Not published anywhere findable; currently omitted from the footer and
      from structured data.

## 3. Assets needed

- [ ] **Original vector logo.** None was supplied. `assets/logo-wordmark.svg`,
      `logo-badge.svg` and `favicon.svg` were rebuilt from the current site's header image —
      the badge typography in particular is an approximation. Replace if the originals exist.
- [ ] **Photography gaps.** All nine existing photographs are hand/nail or lash close-ups.
      There is no Head Spa, pedicure, waxing, interior or technician-at-work image, so those
      services currently borrow nail imagery. Most useful, in order:
      1. A Head Spa treatment  2. A pedicure  3. Studio interior  4. A technician working

## 4. Ready to build once unblocked

- [ ] **First-time client incentive banner.** Requested, not implemented — no such offer exists,
      and inventing a discount the salon would be bound to honour is the same problem as
      inventing a review. Supply the real offer (amount, what it applies to, expiry, per-client
      limit) and the banner is quick: dismissible, remembered across visits, clicking through to
      the booking section.
- [ ] **Live Instagram grid.** Currently links the real accounts (@lavie_nail_lounge21 and
      @lavie_nail_lounge25). An auto-updating grid needs an Instagram Graph API access token tied
      to a Business account, or a paid third-party widget. A hand-maintained "feed" would go
      stale while presenting itself as live.
- [ ] **Point the domain.** Once the above is signed off, move lavienaillounge.ca across.
      Update `canonical`, `og:url` and the structured-data URLs if the final address differs.

## 5. Nice to have

- [ ] Real device testing — the site is verified in Chromium, Firefox and WebKit via automation,
      but not yet on a physical iPhone or Android handset.
- [ ] `sitemap.xml` and `robots.txt` before the domain switch.
- [ ] Decide whether `Lavie-Nail-Lounge-Enhanced-Improved3.zip` (5.2 MB) should stay in the repo;
      it is excluded from the deploy but still bloats every clone.

---

## Closed

Design and build: rebuilt on verified content, typography reworked for legibility, layout
tightened twice, imagery cleaned (stock spa still-life removed, third-party watermark and logo
sticker cropped, gallery regularised), motion layer added, all three locations bookable, booking
embedded on-page, Get Directions per location, Instagram linked.

Verified: heading order, keyboard paths, lightbox, focus management, AA contrast on every text
pair, no target under 24px, reduced-motion and no-JavaScript both render complete, no horizontal
overflow at 360/390/768/1440, LCP 368–396 ms, CLS ~0, and identical behaviour across Chromium,
Firefox and WebKit. `_archive/` is excluded from the deploy and returns 404 in production.
