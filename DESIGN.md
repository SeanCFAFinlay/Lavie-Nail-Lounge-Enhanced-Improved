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
| `--text-muted` | `#5C5551` | Secondary copy (7.4:1 on ivory) |

Gold appears only as hairlines, small labels and the button sheen. There are no large flat
gold areas and no metallic gradients. The design holds without any gradient or effect.

### Type
Two families only. `--serif` Bodoni Moda for emotional headlines and service names;
`--sans` Manrope for navigation, prices, durations, body and every functional label.
Scale is clamp-based: `--fs-hero` `clamp(2.9rem, 9.2vw, 9.2rem)` down to `--fs-label` `.688rem`.
Both load with `display=swap` behind preconnect, and every image carries explicit dimensions,
so measured CLS is 0.

### Space & layout
12-column desktop grid, `--maxw` 1460px, `--gutter` `clamp(1.15rem, 4.2vw, 4.5rem)`.
Section rhythm `--section-y` `clamp(4.5rem, 10vw, 10rem)`.

### Radius
`--r-arch` (the motif), `--r-soft` 2px, `--r-pill` 100px.

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

**Testimonials.** *Decision:* left intentionally empty with a labelled content request.
*Reason:* fabricating reviews was not an option and no real ones were available. See §8.

**FAQ.** *Decision:* placed immediately before the final CTA. *Reason:* answering operational
questions at the decision point is what prevents abandonment. *Execution:* accessible accordion
with `aria-expanded`, full-width triggers and a grid-rows transition. *Fallback:* answers are
expanded by default and only collapse once JavaScript runs.

**Final CTA.** *Decision:* a full-bleed merlot field with one idea and two studio choices.
*Reason:* after services, work and questions, the visitor needs one confident decision point.
*Execution:* oversized serif, soft directional glow, no competing actions, no false urgency.

**Mobile sticky CTA.** *Decision:* appears once the hero has left the viewport and withdraws when
the final CTA is on screen. *Reason:* a visitor who decides mid-page should not have to scroll
back. *Execution:* respects `env(safe-area-inset-bottom)`; no pulsing or persistent animation.

**Custom cursor / 3D element.** *Decision:* not implemented. *Reason:* neither earned its cost
here. The brief permits both but asks that every effect justify itself; a contextual cursor would
have added weight without helping anyone choose or book a service. Documented as a deliberate
omission rather than an oversight.

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

1. **Client testimonials — blocking.** The testimonials section is intentionally empty. Supply
   3–5 real reviews with text, first name or initials, service booked, source, rating and date.
   Reviews mentioning how long a set lasted, cleanliness, or a named technician are the most
   persuasive at that point in the page.
2. **Opening hours — needs confirmation.** Shown as Mon–Fri 10:00–19:00, Sat 10:00–18:00,
   Sun 11:00–17:00. These come from third-party directories and are consistent with the booking
   system's "open today 10am–7pm", but they are not published on lavienaillounge.ca, and Newton's
   hours have not been separately confirmed.
3. **The repair line items — needs confirmation.** The booking system lists *Fix (under Policy
   <7 Days)* at $7 and *Fix (>7 Days)* at $0, which reads as the reverse of the usual arrangement.
   Reproduced exactly as listed; the FAQ deliberately avoids stating which is which.
4. **The third location — needs a decision.** lavienaillounge.ca lists 3D Nails Spa (8850 Walnut
   Grove Dr, Langley Twp, BC V1M 3W4 · 604-888-1619). It is currently omitted. Decide whether it
   is a LaVie location, a sister salon, or unrelated — and supply its booking link if it stays.
   Note the archived `locations.html` claimed a *different* Langley address entirely.
5. **Logo files.** No vector logo was supplied. `assets/logo-wordmark.svg`, `logo-badge.svg` and
   `favicon.svg` were rebuilt from the current site's header image. Replace with the originals if
   they exist — in particular, the badge's typography is an approximation.
6. **Email address and social links.** Not published anywhere findable; currently omitted from the
   footer and from structured data.
7. **Photography gaps.** No interior, team, tools or treatment-in-progress images exist. Useful
   additions: the studio interior, a technician working, and portraits if a team section is wanted.
8. **Team content.** No team section was built, because no verifiable staff information exists.
   See `_archive/README.md`.

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
| Testimonials populated | **Needs attention** — see §8.1 |
| Opening hours confirmed by the salon | **Needs attention** — see §8.2 |
| Repair pricing clarified | **Needs attention** — see §8.3 |
| Third location resolved | **Needs attention** — see §8.4 |
| Original vector logo in place | **Needs attention** — see §8.5 |
| Cross-browser check on Safari/Firefox | **Needs attention** — verified in Chrome only |
| Custom cursor | **Not applicable** — deliberately omitted, §4 |
| Optional 3D element | **Not applicable** — deliberately omitted, §4 |
| Booking form validation | **Not applicable** — booking is handled by Dash Booking |
