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
  var revealables = $$('.rv, .rv-mask, .rv-line');
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

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
