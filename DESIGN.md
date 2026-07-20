# LaVie Nail Lounge — production documentation

Internal build notes. Nothing in this file appears as website content.

---

## 1. Creative direction summary

**Concept — "Liquid Precision."** The finished manicure is a very small object made very
precisely, on a surface that never sits still. The site is art-directed around that idea:
oversized editorial serif, wide negative space, and macro photography treated as the primary
design element rather than as background decoration.

**Primary motif — the nail arch.** A soft-domed silhouette derived from the shape of a nail,
expressed as a CSS radius token (`--r-arch`). It appears on the hero image, the intro figure,
the service stage image, the gallery feature image, and the favicon. It is deliberately *not*
applied to every gallery tile — supporting tiles stay square so the motif reads as a decision
rather than a texture.

**Secondary motif — the lacquer line.** A one-pixel champagne hairline used as the section
divider under each differentiator, the underline that retracts on text links, the sheen that
crosses a button on hover, and the thread that draws between the hero copy and the hero image.

**Positioning.** The salon's genuine competitive advantage turned out to be operational rather
than atmospheric: every one of its 52 services is published with a fixed price and an expected
duration. The whole site is built on that — the headline promise is *"A finish worth the closer
look,"* and the supporting promise throughout is that you know the price and the time before
you confirm. This is a claim the salon can actually stand behind, unlike the generic luxury
language it replaces.

---

## 2. Design tokens

All tokens live in `assets/lavie.css` under `:root`.

### Colour
| Token | Value | Role |
|---|---|---|
| `--pearl` | `#FFFDFC` | Alternating section background |
| `--ivory` | `#F6F0E8` | Dominant page background |
| `--ivory-deep` | `#EDE4D9` | Hero gradient base, media placeholder |
| `--blush` | `#E8CBC8` | Brand accent, quote mark, selection |
| `--blush-soft` | `#F5E4E2` | Testimonial section field |
| `--taupe` | `#B49D93` | Hairlines and rules only |
| `--taupe-deep` | `#7A655A` | AA-contrast variant for small text |
| `--champagne` | `#C6A66B` | Hairlines, active states, button sheen |
| `--champagne-lo` | `#8A6F3C` | AA-contrast variant for small text on pearl |
| `--merlot` / `--merlot-deep` | `#532737` / `#3B1A27` | Accent italics; final CTA field |
| `--ink` | `#171513` | Primary text, primary button, footer |
| `--text-muted` | `#514A46` | Secondary copy (8.4:1 on ivory) |

Gold appears only as hairlines, small labels and the button sheen. There are no large flat
gold areas and no metallic gradients. The design holds without any gradient or effect.

### Type
Two families only. `--serif` **Playfair Display** for display headlines only; `--sans` Manrope
for navigation, service names, prices, durations, questions, body and every functional label.
Scale is clamp-based: `--fs-hero` `clamp(2.6rem, 7.4vw, 6.6rem)` down to `--fs-label` `.75rem`.

**Revision (client feedback).** The original pairing used Bodoni Moda, whose hairline strokes
broke down at functional sizes and was reported as hard to read. Two changes followed: the serif
was replaced with Playfair Display, which holds far sturdier strokes at the same sizes; and the
serif was restricted to display headlines, with service names, FAQ questions and prices moved to
the sans, as the brief's own typography rules specify. Body, label and small-text sizes were all
increased, label tracking was reduced from `.2em` to `.13em`, and `--text-muted` was darkened.
Both load with `display=swap` behind preconnect, and every image carries explicit dimensions,
so measured CLS is 0.

### Space & layout
12-column desktop grid, `--maxw` 1320px, `--gutter` `clamp(1.15rem, 3.2vw, 3rem)`.
Section rhythm `--section-y` `clamp(3.25rem, 5.4vw, 5.5rem)`.

**Revision (client feedback).** The layout was reported as too loose. Section rhythm was cut by
roughly 45%, max width narrowed, gutters tightened, the hero shortened to 86svh with a shorter
figure, and the padding on service rows, FAQ rows, the facts strip and every section head reduced.
The hero scroll cue was removed — at the tighter height it collided with the primary button.

### Radius
`--r-arch` (the motif), `--r-soft` 2px, `--r-pill` 100px.

### Image treatment — revision (client feedback)

Four changes after review:

- **Generic stock removed.** The Head Spa slot was showing a stock spa still-life (rolled towels,
  candles, orchids, Himalayan salt) that the brief explicitly rules out and that clashed with the
  authentic macro photography everywhere else. Deleted. Head Spa now borrows a real salon image;
  a genuine Head Spa photograph is listed as a missing asset.
- **Third-party watermark cropped.** The gallery feature image carried a technician's
  `NAILSBYTONY_T` watermark down its right edge. The source was re-cropped to 87.5% width, which
  removes it and tightens the composition. A LaVie logo sticker was likewise cropped out of the
  pink-floral set.
- **Gallery regularised.** The old irregular grid (`span 4` / `span 3` / `span 6` tiles at three
  different aspect ratios) left visible holes. Every tile is now 4:5 and three columns wide, with
  the feature six columns and two rows — exactly two tiles plus the gap — so the grid tiles solid.
  Gap reduced from up to 1.4rem to 0.85rem.
- **Arch withdrawn from the gallery.** Inside a tiled grid the motif's dome cut triangular gaps
  against neighbouring tiles. It is still carried by the hero, the intro figure, the service stage
  and the favicon, which is the restraint the brief asks for.

Unused and duplicate source files were moved to `_archive/unused-images/`: `product1.png` and
`product2.png` (byte-identical duplicates of `contact.png` and `hero.png`), `contact.png` and
`hero.png` (screenshots of the old website, not photography), and `cuticle_oil.png`,
`gel_polish.png` and `spa_essentials.png` (stock product renders, unused).

### Density — second pass

Section rhythm reduced again to `clamp(2.75rem, 4.2vw, 4.5rem)`. The intro was restructured: the
statement no longer sits in a middle column with an empty one to its left, and the figure now
spans both content rows so the right-hand column carries image rather than empty page. Total page
height fell from 8347px to 7453px (9.3 to 8.3 viewports); the gallery alone went from 1921px to
1441px and the intro from 1062px to 884px.

---

## 3. Motion system

| Token | Duration | Applied to |
|---|---|---|
| `--d-instant` | 130ms | Immediate feedback |
| `--d-control` | 220ms | Buttons, accordion, filters, service index |
| `--d-nav` | 340ms | Navigation state, mobile menu, sticky CTA |
| `--d-reveal` | 560ms | Small content reveals |
| `--d-headline` | 820ms | Hero headline lines |
| `--d-mask` | 1050ms | Arch mask reveals |
| `--d-section` | 780ms | Section transitions, stage image cross-fade |

Easing: `--e-editorial` `cubic-bezier(.22,1,.36,1)` for narrative motion,
`--e-ui` `cubic-bezier(.4,0,.2,1)` for interface response.

### Motion layer — revision (client feedback)

The first pass was deliberately restrained and read as too static. Nine additions, all
transform/opacity/clip-path only, all disabled wholesale under `prefers-reduced-motion`,
none of which gate reading or booking:

| Addition | What it does | Why it earns its place |
|---|---|---|
| Scroll progress | The lacquer line runs the full page width as you scroll | Uses the secondary motif as a real progress indicator, not decoration |
| Heading mask reveal | Section headings rise out of a clip, 900ms | Gives each section an entrance beat instead of appearing wholesale |
| Gallery stagger | Nine tiles settle in sequence, 60ms apart | Turns the grid into a composition being laid down rather than a block |
| Count-up figures | 3 / 9 / 52 / 100% animate from zero, with a rule drawing beneath | The proof numbers are the argument; motion makes them land |
| Service stage wipe | Image changes via a clip-path wipe, not a cross-fade | Echoes lacquer being drawn across a surface |
| Active row rule | A merlot rule sweeps under the selected service | Confirms selection at the point of interaction |
| Magnetic buttons | Primary buttons drift up to 6px toward the pointer | The tactility the brief asks for, inside its stated 4–8px limit |
| Contextual cursor | Small ring + dot; expands to "View" on gallery tiles and "Book" on booking links | Section 27 of the brief; states are meaningful, never decorative |
| Service ticker | A slow marquee of service names between sections, pausing on hover | An editorial band that also restates the range of services |
| Hero parallax | Image drifts 6% of scroll with a 0.004% scale | Depth without displacement large enough to cause motion sickness |

**Fallbacks verified.** Under `prefers-reduced-motion` the progress bar and cursor are never
created at all, the ticker is static, and every element renders in final state with the real
figures. With JavaScript disabled all nine gallery tiles, the real numbers and every heading
render normally.

Only `transform`, `opacity` and `clip-path` are animated. All reveals are one-time. Pointer
parallax in the hero is capped at 18px of background light travel and is desktop-only. There is
no scroll hijacking, no pinned section, no autoplay carousel and no continuous ambient motion.

---

## 4. Section rationales

**Navigation.** *Decision:* transparent over the hero, gaining an opaque blurred surface after
24px of scroll. *Reason:* the opening composition should not compete with a solid bar, but
legibility over changing imagery must be guaranteed. *Execution:* translucent ivory surface, one
visually dominant booking action, champagne underline marking the active section.
*Fallback:* below 620px the booking pill is withdrawn from the bar — the wordmark, pill and menu
control cannot share one row at that width, and the pill was pushing the menu control off-screen.
Booking stays reachable through the sticky action and the menu footer.

**Hero.** *Decision:* oversized off-centre serif headline against a macro nail image revealed
through the arch mask. *Reason:* the first three seconds must establish craft and premium
positioning while making the next action obvious. *Execution:* headline reveals as whole lines
(never letter-by-letter), the image un-masks over 1050ms, a champagne thread then draws between
the copy and the image. *Fallback:* the figure is withdrawn below 1080px and the composition
becomes a single column; with reduced motion everything renders in final state immediately.

**Brand introduction.** *Decision:* a deliberately quiet editorial spread after the hero.
*Reason:* pacing — the visitor needs somewhere to breathe before being asked to choose.
*Execution:* narrow text column, large statement, one arch-masked figure, a four-item fact strip.

**Services.** *Decision:* a vertical service index with a sticky image stage, not a grid of
identical cards. *Reason:* it lets a client compare price and duration in one scan while keeping
the presentation curated. *Execution:* selecting a service expands its full priced line items and
cross-fades the stage image. Arrow keys move between services. *Fallback:* below 1080px the stage
is removed and every panel renders open — pricing is never hidden behind a control, and with
JavaScript unavailable all panels are open by default.

**The studio (differentiators).** *Decision:* three proof-based statements, each under a lacquer
rule. *Reason:* photography creates desire; evidence creates trust. *Execution:* only claims that
can be verified from the salon's own booking system are made.

**Gallery.** *Decision:* an irregular editorial grid with one arch-masked feature image.
*Reason:* nail clients decide visually, and the grid needs to prove range. *Execution:* filters by
style, hover lifts the image 3.5% and reveals a caption, and an accessible lightbox supports
arrow keys, Escape, swipe and focus return. *Fallback:* on touch the caption is always visible —
no essential information is hover-only.

**Testimonials.** *Decision:* a built, working review deck that currently renders an
empty-state notice. *Reason:* the section had to be production-ready without inventing content.
*Execution:* one quote at a time with attribution (name, service, source, rating, date), advanced
by manual prev/next — no autoplay, so a reader can finish a quote. Reviews are plain `<figure>`
blocks in the markup; the component counts them and wires itself up, showing the notice at zero
and hiding the navigation at one. *Fallback:* with JavaScript unavailable the first review still
renders. See §8.1 for why it is empty and where the real reviews should come from.

**FAQ.** *Decision:* placed immediately before the final CTA. *Reason:* answering operational
questions at the decision point is what prevents abandonment. *Execution:* accessible accordion
with `aria-expanded`, full-width triggers and a grid-rows transition. *Fallback:* answers are
expanded by default and only collapse once JavaScript runs.

**Final CTA.** *Decision:* a full-bleed merlot field with one idea and three location choices.
*Reason:* after services, work and questions, the visitor needs one confident decision point.
*Execution:* oversized serif, soft directional glow, no false urgency. Because there are three
salons with separate calendars, every generic "Book an Appointment" control routes to this section
rather than hard-coding one salon; the visitor picks a location here and goes straight to its
Dash Booking calendar. Each location card and the footer also carry direct links.

**Mobile sticky CTA.** *Decision:* appears once the hero has left the viewport and withdraws when
the final CTA is on screen. *Reason:* a visitor who decides mid-page should not have to scroll
back. *Execution:* respects `env(safe-area-inset-bottom)`; no pulsing or persistent animation.

**Custom cursor.** *Decision:* added in the motion revision. *Reason:* the brief permits it and
the client asked for more movement; limited to states that carry meaning. *Execution:* a small
ring and dot that lerp toward the pointer, expanding to a filled "View" badge over gallery tiles
and "Book" over booking links, inverting on the dark CTA field. *Fallback:* never created on
coarse pointers or under reduced motion.

**3D element.** *Decision:* still not implemented. *Reason:* the optional WebGL object would add
a rendering dependency and payload for atmosphere the photography already supplies. The motion
layer delivers the requested movement at a fraction of the cost.

---

## 5. Responsive behaviour

| Breakpoint | Behaviour |
|---|---|
| ≥1080px | Full 12-column editorial layout, hero figure, sticky service stage, pointer parallax |
| ≤1080px | Nav collapses to full-screen menu; hero figure withdrawn; service stage removed with all panels open; FAQ aside unpins; sticky CTA activates |
| ≤760px | Facts strip 2-up; differentiators single column; gallery 2-up with the feature spanning both; gallery captions always visible; price rows reflow to two columns |
| ≤620px | Booking pill withdrawn from the nav bar so the menu control stays on-screen |
| ≤420px | Hero buttons go full width; service rows drop the trailing price column |

Verified with no horizontal overflow at 360px, 390px, 768px and 1440px.

---

## 6. Accessibility summary

Target: WCAG 2.2 AA.

- Semantic landmarks, one `<h1>` per page, and a verified logical heading order.
- Skip link; visible focus rings (`--merlot`, 2px, 3px offset) on all interactive elements.
- Mobile menu traps focus, closes on Escape and on selection, and returns focus to its trigger.
- Service index is arrow-key navigable and keeps `aria-expanded` in sync.
- FAQ triggers are real buttons with correct `aria-expanded`.
- Lightbox uses `<dialog>`: Escape closes, arrow keys page, alt text carries through from the
  source image, and body scroll lock is released on close.
- Gallery filters expose `aria-pressed` and announce results through a live region.
- Every content image has descriptive alt text written from the actual photograph; decorative
  stage images use `alt=""`.
- **Contrast:** every text/background pair was measured programmatically. Two muted tones failed
  and were darkened (`--taupe-deep`, `--champagne-lo`). The gallery caption scrim was strengthened
  to `rgba(23,21,19,.8)` because these photographs are shot on white fur — worst case now
  composites to rgb(69,68,66) for **8.7:1**. No text pair is below AA.
- **Target size:** no non-inline target is under 24×24px (WCAG 2.5.8). Inline links inside
  sentences use the inline exception.
- **Reduced motion:** verified — parallax, mask reveals, the sheen and the scroll cue are all
  disabled, and every element renders in final state.
- **No JavaScript:** verified — the whole page renders, all reveals resolve, FAQ answers are open
  and service pricing is fully visible. Reveal styles are scoped behind a `.js` flag so a script
  failure can never leave the page invisible.

---

## 7. Performance summary

Measured locally in Chrome:

| Metric | Desktop | Mobile | Target |
|---|---|---|---|
| Initial transfer | ~269 KB | ~269 KB | — |
| LCP | 456 ms | 356 ms | ≤2500 ms |
| CLS | 0 | 0.008 | ≤0.1 |
| Console errors | none | none | none |

Source photography totalled **5.05 MB**. Responsive derivatives were generated at 800px and
1600px into `assets/img/` (originals untouched at repo root), cutting delivered weight to
**~269 KB** on first load. Every image carries `srcset`/`sizes`, explicit dimensions, and
`loading="lazy"` below the fold. The hero is preloaded with `imagesrcset`. One stylesheet, one
deferred script, no frameworks and no build step.

---

## 8. Missing content and assets

Ordered by how much each blocks launch.

1. **Client testimonials — still outstanding.** The section no longer shows an unfinished
   notice: while the deck is empty it points visitors at the salon's own Google listings for
   each location, so the proof on the page is real and verifiable. Real quotes still read
   better and should replace it. To publish a review,
   copy the commented `<figure class="tst__item">` template in `index.html` and fill it in.

   **These must be real reviews, and they must come from the salon's own Google Business Profile
   (or Facebook) — not from a review-aggregator site.** Two reasons. First, accuracy: aggregators
   demonstrably mis-attribute reviews between salons. A search for LaVie's reviews returned text
   under a `bestprosintown.com/.../magical-nails-` URL and a Trustindex page for `lavienails.net`,
   an unrelated business; the Birdeye page for 3D Nails Spa mixes in reviews for other locations
   and includes a one-star complaint. Any of that pasted in as a LaVie testimonial would be wrong.

   Second, and more important: **inventing testimonials is not an option.** The brief prohibits it,
   and in Canada fabricated reviews and testimonials are deceptive marketing under the Competition
   Act, which carries administrative monetary penalties for the business. Google and Meta also
   remove listings over fake review activity. The risk sits with the salon, not the site.

   The salon holds a 5.0 Google rating, so genuine material exists — it just needs to be copied
   from the profile the salon controls, with the reviewer's name as they published it.
2. **Opening hours — not published.** lavienaillounge.ca has an Hours section but it was never
   populated, and no hours are published for any of the three locations. Rather than show
   unverified times as fact, the location cards now point to each salon's booking page, which
   shows live availability. Supply confirmed hours per location and they will be added.
3. **The repair line items — needs confirmation.** The booking system lists *Fix (under Policy
   <7 Days)* at $7 and *Fix (>7 Days)* at $0, which reads as the reverse of the usual arrangement.
   Reproduced exactly as listed; the FAQ deliberately avoids stating which is which.
4. **Third location postal code — minor conflict.** 3D Nails Spa (8850 Walnut Grove Dr, Langley
   Twp · 604-888-1619) is now included with its own booking calendar
   (`dashbooking.com/salon/3d-nails-spa`). The postal code is shown as **V1M 3W4**, as supplied and
   as listed on lavienaillounge.ca; the salon's own Dash Booking page says **V1M 2C9**. Worth
   confirming which is right. Note Dash Booking also hosts a "LaVie Nail Lounge Langley" page at
   the same street address — confirm whether that is a rebrand and which name should be shown.
5. **Logo files.** No vector logo was supplied. `assets/logo-wordmark.svg`, `logo-badge.svg` and
   `favicon.svg` were rebuilt from the current site's header image. Replace with the originals if
   they exist — in particular, the badge's typography is an approximation.
6. **Email address and social links.** Not published anywhere findable; currently omitted from the
   footer and from structured data.
7. **Photography gaps.** No interior, team, tools or treatment-in-progress images exist, and there
   is no Head Spa, pedicure or waxing photograph — those services currently borrow nail imagery.
   Most useful additions, in order: a Head Spa treatment, a pedicure, the studio interior, and a
   technician working. All nine existing photographs are hand/nail or lash close-ups.
8. **Team content.** No team section was built, because no verifiable staff information exists.
   See `_archive/README.md`.

9. **Live Instagram feed.** The section links to the real accounts (@lavie_nail_lounge21 and
   @lavie_nail_lounge25). An auto-updating grid needs an Instagram Graph API access token tied to
   a Business account, or a paid third-party widget. Supply a token and the grid can be built;
   without one, a hand-maintained "feed" would go stale and misrepresent itself as live.

10. **First-time client incentive.** Requested as a banner offering something like "10% off your
    first full set". Not implemented, because no such offer exists — inventing a discount is the
    same problem as inventing a review, and the salon would be bound to honour it. Confirm a real
    offer (amount, what it applies to, expiry, per-client limit) and the banner is quick to add:
    dismissible, persisted, and clicking through to the booking section.

11. **Terms and Privacy pages — serious.** lavienaillounge.ca/terms-and-conditions.html is written
    for a business called **Victoria's Nails & Spa**, and privacy-policy.html gives a contact
    address of **524 Broadway Mall, Hicksville, NY** with phone **(516) 597-5999**. Both are
    uncustomised templates for a different company in another country. Neither was carried over.
    A BC salon needs its own policy under PIPA; this needs the owner, not a developer.

---

## 9. QA checklist

| Check | Status |
|---|---|
| HTML well-formed, no unclosed tags | **Pass** |
| All local asset and anchor references resolve | **Pass** |
| No console or page errors | **Pass** |
| No horizontal overflow at 360/390/768/1440 | **Pass** |
| Keyboard: menu, service index, FAQ, filters, lightbox | **Pass** |
| Focus visible, focus trapped in menu, returned on close | **Pass** |
| Heading order logical, one h1 per page | **Pass** |
| All images have appropriate alt text | **Pass** |
| Colour contrast AA across both pages | **Pass** |
| Target size ≥24px (non-inline) | **Pass** |
| Reduced-motion renders complete and static | **Pass** |
| Renders and functions with JavaScript disabled | **Pass** |
| LCP / CLS within target | **Pass** |
| Structured data on locations and booking actions | **Pass** |
| Booking links resolve to the correct per-studio calendar | **Pass** |
| Prices and durations match the salon's booking system | **Pass** |
| No fabricated pricing, promotions, reviews or staff | **Pass** |
| Review deck built and tested (empty + populated states) | **Pass** |
| Booking embedded on-page (all three calendars) | **Pass** |
| Get Directions per location | **Pass** |
| Instagram accounts linked | **Pass** — live feed needs a Graph API token, §8.9 |
| First-time client incentive | **Blocked** — needs a real offer from the salon, §8.10 |
| Testimonials populated with real reviews | **Needs attention** — see §8.1 |
| Opening hours confirmed by the salon | **Needs attention** — see §8.2 |
| Typography legible at functional sizes | **Pass** — reworked after client feedback |
| Layout density | **Pass** — tightened after client feedback |
| Repair pricing clarified | **Needs attention** — see §8.3 |
| All three locations bookable from the site | **Pass** |
| Third location postal code confirmed | **Needs attention** — see §8.4 |
| Original vector logo in place | **Needs attention** — see §8.5 |
| Cross-browser: Chromium, Firefox, WebKit/Safari | **Pass** — identical behaviour on all three |
| Custom cursor | **Pass** — added in the motion revision; desktop pointer only |
| Optional 3D element | **Not applicable** — deliberately omitted, §4 |
| Booking form validation | **Not applicable** — booking is handled by Dash Booking |
