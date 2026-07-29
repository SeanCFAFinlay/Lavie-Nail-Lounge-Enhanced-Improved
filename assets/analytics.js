/* ============================================================
   LaVie Nail Lounge — measurement layer
   ------------------------------------------------------------
   FILL IN THE FOUR IDs BELOW AND NOTHING ELSE NEEDS TOUCHING.

   Every tag is off until its ID is filled in, so the site ships
   and runs normally with this file left exactly as it is. No
   third-party script is requested while an ID is blank.

     GA4      Google Analytics 4  → analytics.google.com
              Admin ▸ Data streams ▸ your web stream ▸ "G-XXXXXXXXXX"
     GTM      Google Tag Manager  → tagmanager.google.com
              Container ID at the top of the workspace, "GTM-XXXXXXX"
     CLARITY  Microsoft Clarity   → clarity.microsoft.com
              Settings ▸ Setup ▸ the 10-character project ID
     Search Console needs a tag in the HTML, not here — see the
     commented <meta name="google-site-verification"> in index.html.

   If you run GA4 *through* GTM, set GTM only and leave GA4 blank,
   otherwise every page view is counted twice.
   ============================================================ */
(function () {
  'use strict';

  var CONFIG = {
    ga4:     '',   // 'G-XXXXXXXXXX'
    gtm:     '',   // 'GTM-XXXXXXX'
    clarity: '',   // 'abcdefghij'

    /* Send a GA4 event when someone starts a booking, taps a phone
       number or asks for directions. These are the actions worth
       counting on a salon site; page views alone say very little. */
    trackConversions: true,

    /* Honour the browser's Do Not Track / Global Privacy Control
       signal by loading nothing at all for those visitors. */
    respectDoNotTrack: true
  };

  /* ---------- opt-out ---------- */

  var optedOut = CONFIG.respectDoNotTrack && (
    navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
    navigator.msDoNotTrack === '1' || navigator.globalPrivacyControl === true
  );
  if (optedOut) return;

  var load = function (src, attrs) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
    return s;
  };

  /* ---------- Google: gtag bootstrap shared by GA4 and GTM ---------- */

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  if (CONFIG.ga4) {
    load('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.ga4));
    gtag('js', new Date());
    gtag('config', CONFIG.ga4, { anonymize_ip: true });
  }

  if (CONFIG.gtm) {
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    load('https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(CONFIG.gtm));
  }

  /* ---------- Microsoft Clarity ---------- */

  if (CONFIG.clarity) {
    window.clarity = window.clarity || function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
    load('https://www.clarity.ms/tag/' + encodeURIComponent(CONFIG.clarity));
  }

  /* ---------- conversion events ----------
     One delegated listener, no per-element wiring, so newly generated
     pages are covered automatically. Silent if no tag is configured. */

  if (!CONFIG.trackConversions) return;

  var send = function (name, params) {
    window.dataLayer.push(Object.assign({ event: name }, params));
    if (CONFIG.ga4 && typeof window.gtag === 'function') window.gtag('event', name, params);
    if (CONFIG.clarity && typeof window.clarity === 'function') window.clarity('event', name);
  };

  var studioOf = function (href) {
    var m = String(href).match(/dashbooking\.com\/salon\/([a-z0-9-]+)/i);
    if (m) return m[1].replace(/^lavie-nail-lounge-?/, '') || 'fleetwood';
    if (/newton/i.test(href)) return 'newton';
    if (/langley|walnut/i.test(href)) return 'langley';
    if (/fraser|fleetwood/i.test(href)) return 'fleetwood';
    return 'unknown';
  };

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href], button[data-src]');
    if (!a) return;
    var href = a.getAttribute('href') || a.getAttribute('data-src') || '';

    if (/dashbooking\.com/i.test(href)) {
      send('begin_booking', { studio: studioOf(href), method: a.tagName === 'BUTTON' ? 'embedded' : 'new_tab' });
    } else if (/^tel:/i.test(href)) {
      send('call_studio', { studio: studioOf(a.textContent + ' ' + href), phone: href.replace(/^tel:/i, '') });
    } else if (/google\.[a-z.]+\/maps/i.test(href)) {
      send('get_directions', { studio: studioOf(href) });
    } else if (/instagram\.com|facebook\.com/i.test(href)) {
      send('social_click', { network: /instagram/i.test(href) ? 'instagram' : 'facebook' });
    }
  }, true);
})();
