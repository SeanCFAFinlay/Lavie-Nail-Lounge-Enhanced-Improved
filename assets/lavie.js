/* ============================================================
   LaVie Nail Lounge — interaction layer
   Progressive enhancement: every feature degrades to working HTML.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var fine    = window.matchMedia('(hover: hover) and (pointer: fine)');
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Navigation: opacity after scroll ---------- */
  var nav = $('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = $('.nav__toggle');
  var menu   = $('#menu');
  if (toggle && menu) {
    var lastFocus = null;
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);
      if (open) { lastFocus = document.activeElement; var f = menu.querySelector('a,button'); if (f) f.focus(); }
      else if (lastFocus) { lastFocus.focus(); }
    };
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // close immediately on selection
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
    // keep focus inside the open menu
    menu.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var items = $$('a,button', menu).filter(function (el) { return el.offsetParent !== null; });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Scroll reveals (one-time) ---------- */
  var revealables = $$('.rv, .rv-mask, .rv-line, .reveal-mask, .gal__fig');
  if (revealables.length) {
    if (reduced.matches || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
      revealables.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Hero entrance ---------- */
  var hero = $('.hero');
  if (hero) {
    var thread = $('.hero__thread', hero);
    if (reduced.matches) {
      $$('.rv, .rv-mask', hero).forEach(function (el) { el.classList.add('in'); });
    } else {
      requestAnimationFrame(function () {
        $$('.rv, .rv-mask', hero).forEach(function (el) { el.classList.add('in'); });
        if (thread) {
          setTimeout(function () {
            thread.style.transition = 'width 900ms cubic-bezier(.22,1,.36,1), transform 900ms cubic-bezier(.22,1,.36,1)';
            thread.style.width = '38%';
            thread.style.transform = 'none';
          }, 900);
        }
      });
      /* pointer light — 4–10px of response, desktop only */
      if (fine.matches) {
        hero.addEventListener('pointermove', function (e) {
          var r = hero.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - .5;
          var y = (e.clientY - r.top) / r.height - .5;
          hero.style.setProperty('--px', (x * 18).toFixed(1) + 'px');
          hero.style.setProperty('--py', (y * 14).toFixed(1) + 'px');
        }, { passive: true });
      }
    }
  }

  /* ---------- Service index ---------- */
  var svc = $('.svc__list');
  if (svc) {
    var items = $$('.svc__item', svc);
    var stageImgs = $$('.svc__media img');
    var capName = $('#svcCapName'), capMeta = $('#svcCapMeta');

    var activate = function (item) {
      items.forEach(function (i) {
        var on = i === item;
        i.classList.toggle('is-active', on);
        var b = $('.svc__btn', i);
        if (b) b.setAttribute('aria-expanded', String(on));
        var p = $('.svc__panel', i);
        if (p) p.hidden = !on;
      });
      var key = item.getAttribute('data-svc');
      stageImgs.forEach(function (img) { img.classList.toggle('is-shown', img.getAttribute('data-svc') === key); });
      if (capName) capName.textContent = item.getAttribute('data-name') || '';
      if (capMeta) capMeta.textContent = item.getAttribute('data-meta') || '';
    };

    items.forEach(function (item, idx) {
      var btn = $('.svc__btn', item);
      if (!btn) return;
      btn.addEventListener('click', function () { activate(item); });
      btn.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = items[(idx + d + items.length) % items.length];
        $('.svc__btn', next).focus();
        activate(next);
      });
    });
    if (items.length) activate(items[0]);
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq__item').forEach(function (item) {
    var q = $('.faq__q', item), a = $('.faq__a', item);
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });

  /* ---------- Gallery filters ---------- */
  var filters = $$('.gal__filters button');
  if (filters.length) {
    var figs = $$('.gal__fig');
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-cat');
        filters.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        figs.forEach(function (f) {
          var cats = (f.getAttribute('data-cats') || '').split(' ');
          f.hidden = !(cat === 'all' || cats.indexOf(cat) !== -1);
        });
        var live = $('#galStatus');
        if (live) {
          var n = figs.filter(function (f) { return !f.hidden; }).length;
          live.textContent = n + ' set' + (n === 1 ? '' : 's') + ' shown.';
        }
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  if (lb) {
    var lbImg = $('#lbImg'), lbTitle = $('#lbTitle'), lbDesc = $('#lbDesc'), lbCount = $('#lbCount');
    var opens = $$('.gal__open');
    var current = 0;
    var visible = function () { return opens.filter(function (o) { return !o.closest('.gal__fig').hidden; }); };

    var render = function (list) {
      var el = list[current];
      if (!el) return;
      var img = $('img', el);
      lbImg.src = img.getAttribute('data-full') || img.src;
      lbImg.alt = img.alt;
      lbTitle.textContent = el.getAttribute('data-title') || '';
      lbDesc.textContent  = el.getAttribute('data-desc') || '';
      lbCount.textContent = (current + 1) + ' / ' + list.length;
    };
    var step = function (d) { var list = visible(); current = (current + d + list.length) % list.length; render(list); };

    opens.forEach(function (el) {
      el.addEventListener('click', function () {
        var list = visible();
        current = list.indexOf(el);
        render(list);
        if (typeof lb.showModal === 'function') lb.showModal(); else lb.setAttribute('open', '');
        document.body.classList.add('is-locked');
      });
    });

    var close = function () {
      if (typeof lb.close === 'function' && lb.open) lb.close(); else lb.removeAttribute('open');
      document.body.classList.remove('is-locked');
    };
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { step(-1); });
    $('#lbNext').addEventListener('click', function () { step(1); });
    lb.addEventListener('close', function () { document.body.classList.remove('is-locked'); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    });
    // click the backdrop area to dismiss
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    // touch swipe
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 55) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ---------- Review deck ---------- */
  var deck = $('#reviewDeck');
  if (deck) {
    var reviews = $$('.tst__item', deck);
    var missing = $('#reviewsMissing');
    var revNav  = $('#reviewNav');
    var revCount= $('#revCount');

    if (!reviews.length) {
      // No real reviews supplied yet — keep the notice, hide the empty controls.
      if (revNav) revNav.hidden = true;
    } else {
      if (missing) missing.hidden = true;
      var ri = 0;
      var showReview = function (i) {
        ri = (i + reviews.length) % reviews.length;
        reviews.forEach(function (r, n) { r.classList.toggle('is-shown', n === ri); });
        if (revCount) revCount.textContent = (ri + 1) + ' / ' + reviews.length;
      };
      showReview(0);
      if (reviews.length > 1 && revNav) {
        revNav.hidden = false;
        $('#revPrev').addEventListener('click', function () { showReview(ri - 1); });
        $('#revNext').addEventListener('click', function () { showReview(ri + 1); });
      }
    }
  }

  /* ---------- Embedded booking ---------- */
  var bTabs = $$('.booking__tab');
  if (bTabs.length) {
    var stage = $('#bookingStage'), frame = $('#bookingFrame');
    var which = $('#bookingWhich'), out = $('#bookingOut'), loading = $('#bookingLoading');

    frame.addEventListener('load', function () {
      if (!frame.getAttribute('src')) return;
      frame.classList.add('is-ready');
      if (loading) loading.hidden = true;
    });

    bTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var src = tab.getAttribute('data-src');
        bTabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t === tab)); });
        stage.hidden = false;
        if (frame.getAttribute('src') !== src) {
          frame.classList.remove('is-ready');
          if (loading) loading.hidden = false;
          frame.setAttribute('src', src);
        }
        which.textContent = tab.getAttribute('data-label');
        out.setAttribute('href', src);
        // Keep the calendar in view without yanking the page around.
        var top = stage.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: top, behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- Mobile sticky CTA ---------- */
  var sticky = $('.sticky');
  if (sticky) {
    var finalCta = $('#book');
    var pastHero = false, atCta = false;
    var sync = function () { sticky.classList.toggle('is-shown', pastHero && !atCta); };

    if ('IntersectionObserver' in window) {
      if (hero) {
        new IntersectionObserver(function (en) {
          pastHero = !en[0].isIntersecting; sync();
        }, { threshold: 0.15 }).observe(hero);
      } else { pastHero = true; }
      if (finalCta) {
        new IntersectionObserver(function (en) {
          atCta = en[0].isIntersecting; sync();
        }, { threshold: 0.12 }).observe(finalCta);
      }
      sync();
    } else {
      sticky.classList.add('is-shown');
    }
  }

  /* ---------- Active section indicator ---------- */
  var navLinks = $$('.nav__links a[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
                           .filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ==========================================================
     MOTION LAYER
     Every block below no-ops under reduced motion or coarse pointers.
     ========================================================== */

  /* ---------- Scroll progress ---------- */
  if (!reduced.matches) {
    var bar = document.createElement('div');
    bar.className = 'progress';
    document.body.appendChild(bar);
    var ticking = false;
    var drawBar = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(drawBar); }
    }, { passive: true });
    drawBar();
  }

  /* ---------- Count-up on the facts strip ---------- */
  var facts = $('.facts');
  if (facts && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en, obs) {
      if (!en[0].isIntersecting) return;
      facts.classList.add('in');
      obs.disconnect();
      if (reduced.matches) return;
      $$('[data-count]', facts).forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var t0 = null, dur = 1100;
        var step = function (t) {
          if (t0 === null) t0 = t;
          var k = Math.min((t - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - k, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (k < 1) requestAnimationFrame(step);
        };
        el.textContent = '0' + suffix;
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 }).observe(facts);
  }

  /* ---------- Hero parallax on scroll ---------- */
  var heroFig = $('.hero__figure img');
  if (heroFig && !reduced.matches && fine.matches) {
    var pTick = false;
    var drawPar = function () {
      var y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        heroFig.style.transform = 'translate3d(0,' + (y * 0.06).toFixed(1) + 'px,0) scale(' + (1 + y * 0.00004).toFixed(4) + ')';
      }
      pTick = false;
    };
    window.addEventListener('scroll', function () {
      if (!pTick) { pTick = true; requestAnimationFrame(drawPar); }
    }, { passive: true });
  }

  /* ---------- Magnetic buttons — 6px maximum, label never moves away ---------- */
  if (fine.matches && !reduced.matches) {
    $$('.btn').forEach(function (btn) {
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        btn.style.transform = 'translate(' + (dx * 6).toFixed(1) + 'px,' + (dy * 5).toFixed(1) + 'px)';
      });
      btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
    });
  }

  /* ---------- Contextual cursor ---------- */
  if (fine.matches && !reduced.matches) {
    var ring = document.createElement('div'); ring.className = 'cursor';
    var dot  = document.createElement('div'); dot.className  = 'cursor-dot';
    document.body.appendChild(ring); document.body.appendChild(dot);

    var rx = 0, ry = 0, tx = 0, ty = 0, running = false;
    var loop = function () {
      rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      dot.style.transform  = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      if (Math.abs(tx - rx) > 0.1 || Math.abs(ty - ry) > 0.1) requestAnimationFrame(loop);
      else running = false;
    };
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      ring.classList.add('is-on'); dot.classList.add('is-on');
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      ring.classList.remove('is-on'); dot.classList.remove('is-on');
    });

    var setState = function (cls, invert) {
      ring.classList.remove('is-view', 'is-book', 'is-invert');
      if (cls) ring.classList.add(cls);
      if (invert) ring.classList.add('is-invert');
    };
    $$('.gal__open').forEach(function (el) {
      el.addEventListener('pointerenter', function () { setState('is-view'); });
      el.addEventListener('pointerleave', function () { setState(null); });
    });
    $$('a[href*="dashbooking"], a[href="#book"]').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        setState('is-book', !!el.closest('.cta'));
      });
      el.addEventListener('pointerleave', function () { setState(null); });
    });
  }

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
