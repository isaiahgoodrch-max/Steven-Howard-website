/* =========================================================
   Steven Howard — Writing & Publishing Coach
   ========================================================= */
(function () {
  'use strict';

  /* =======================================================
     CONFIG  —  read this before going live
     =======================================================
     Where the contact form gets delivered.

     Until you paste in an access key below, the form falls back to
     opening the visitor's email app with everything pre-filled and
     addressed to Steven. That works today, but it relies on the
     visitor having a mail client and actually hitting send — so set
     up a real endpoint before launch.

     TO GO LIVE (about 2 minutes, free):
       1. Go to https://web3forms.com
       2. Enter stevenhoward@verizon.net and submit
       3. Web3Forms emails an Access Key to that address
       4. Paste the key into ACCESS_KEY below
     ======================================================= */
  var CONFIG = {
    PROVIDER:   'web3forms',                 // 'web3forms' | 'formspree' | 'mailto'
    ACCESS_KEY: 'YOUR_WEB3FORMS_ACCESS_KEY', // <-- replace this
    FORMSPREE_URL: '',                       // e.g. https://formspree.io/f/xxxxxxx
    TO_EMAIL:   'stevenhoward@verizon.net',
    SUBJECT:    'New coaching inquiry from your website',

    /* Booking. The flow is deliberately: details first, then book, so Steven
       never gets a call on the calendar without knowing what it's about. */
    CALENDLY_URL: 'https://calendly.com/stevenhoward/from-writer-to-author'
  };

  // Exposed so the endpoint can be swapped at runtime if ever needed.
  window.SH_CONFIG = CONFIG;

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- Year ---------------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Nav ---------------- */
  var nav = $('#nav');
  var navLinks = $('.nav__links');
  var navToggle = $('#navToggle');

  var onScroll = function () {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------- Reveal on scroll ---------------- */
  var revealTargets = $$(
    '.section__title, .section__lede, .card, .tile, .format__item, ' +
    '.step, .callout, .about__media, .about__copy, .quote, .cta__inner'
  );

  if ('IntersectionObserver' in window) {
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* =======================================================
     WHAT WE WORK ON — compact tiles, definition below
     ======================================================= */
  var workGrid = $('#workGrid');
  if (workGrid) {
    var detail  = $('#workDetail');
    var dTitle  = $('.work-detail__title', detail);
    var dBody   = $('.work-detail__body', detail);
    var dClose  = $('.work-detail__close', detail);
    var tiles   = $$('.tile', workGrid);
    var openTile = null;

    var closeDetail = function (refocus) {
      tiles.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-expanded', 'false');
      });
      detail.hidden = true;
      if (refocus && openTile) openTile.focus();
      openTile = null;
    };

    tiles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (openTile === btn) { closeDetail(false); return; }   // click again to close

        tiles.forEach(function (t) {
          t.classList.remove('is-active');
          t.setAttribute('aria-expanded', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-expanded', 'true');

        dTitle.textContent = $('.tile__name', btn).textContent.trim();
        dBody.textContent  = $('.tile__desc', btn).textContent.trim();
        detail.hidden = false;
        openTile = btn;
      });
    });

    if (dClose) dClose.addEventListener('click', function () { closeDetail(true); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !detail.hidden) closeDetail(true);
    });
  }

  /* =======================================================
     MODAL
     ======================================================= */
  var modal      = $('#contactModal');
  var form       = $('#contactForm');
  var successBox = $('#formSuccess');
  var successMsg = $('#successMsg');
  var submitBtn  = $('#submitBtn');
  var lastFocus  = null;

  /* Calendly's script is only pulled in when someone actually opens the modal,
     so it costs nothing on page load. Resolves false if it can't load, and the
     plain-link fallback takes over. */
  var calendlyLoad = null;
  function loadCalendly() {
    if (calendlyLoad) return calendlyLoad;
    calendlyLoad = new Promise(function (resolve) {
      if (window.Calendly) return resolve(true);

      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(css);

      var js = document.createElement('script');
      js.src = 'https://assets.calendly.com/assets/external/widget.js';
      js.async = true;
      js.onload = function () { resolve(!!window.Calendly); };
      js.onerror = function () { resolve(false); };
      document.head.appendChild(js);

      setTimeout(function () { resolve(!!window.Calendly); }, 6000); // don't hang forever
    });
    return calendlyLoad;
  }

  /* Prefill what they already typed so they don't enter it twice. */
  function bookingUrl() {
    var url = CONFIG.CALENDLY_URL;
    var name = ($('#f-name') || {}).value || '';
    var email = ($('#f-email') || {}).value || '';
    var q = [];
    if (name.trim()) q.push('name=' + encodeURIComponent(name.trim()));
    if (email.trim()) q.push('email=' + encodeURIComponent(email.trim()));
    return q.length ? url + (url.indexOf('?') === -1 ? '?' : '&') + q.join('&') : url;
  }

  function openModal(e) {
    if (e) e.preventDefault();
    loadCalendly();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () {
      var first = $('#f-name');
      if (first) first.focus();
    }, 60);
  }

  function closeModal() {
    modal.hidden = true;
    // leave the completed state as-is; reopening should not wipe their booking step
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $$('.js-open-modal').forEach(function (btn) {
    btn.addEventListener('click', openModal);
  });

  $$('[data-close]', modal).forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.hidden) closeModal();

    // focus trap
    if (e.key === 'Tab' && !modal.hidden) {
      var f = $$(
        'button, input, select, textarea, a[href]',
        modal
      ).filter(function (el) { return el.offsetParent !== null && !el.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });

  /* =======================================================
     VALIDATION
     ======================================================= */
  var RULES = {
    'f-name':    { msg: 'Please enter your name.' },
    'f-email':   { msg: 'Please enter a valid email address.',
                   test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); } },
    'f-writing': { msg: 'Tell Steven a little about what you\'re writing.' },
    'f-goal':    { msg: 'Let Steven know what you want to do with it.' }
  };

  function setError(id, message) {
    var input = document.getElementById(id);
    if (!input) return;
    var field = input.closest('.field');
    var err = $('[data-err-for="' + id + '"]');
    if (message) {
      field.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = message;
    } else {
      field.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      if (err) err.textContent = '';
    }
  }

  function validate() {
    var ok = true, firstBad = null;
    Object.keys(RULES).forEach(function (id) {
      var input = document.getElementById(id);
      var val = (input.value || '').trim();
      var rule = RULES[id];
      var valid = val.length > 0 && (!rule.test || rule.test(val));
      setError(id, valid ? '' : rule.msg);
      if (!valid) { ok = false; if (!firstBad) firstBad = input; }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  Object.keys(RULES).forEach(function (id) {
    var input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('is-invalid')) setError(id, '');
    });
  });

  /* =======================================================
     SUBMIT
     ======================================================= */
  function collect() {
    return {
      name:    $('#f-name').value.trim(),
      email:   $('#f-email').value.trim(),
      focus:   $('#f-focus').value,
      writing: $('#f-writing').value.trim(),
      goal:    $('#f-goal').value.trim(),
      company: $('#f-company').value.trim() // honeypot
    };
  }

  function bodyText(d) {
    return (
      'New coaching inquiry from stevenhoward.com\n' +
      '----------------------------------------\n\n' +
      'Name:  ' + d.name + '\n' +
      'Email: ' + d.email + '\n' +
      'Focus: ' + d.focus + '\n\n' +
      'WHAT THEY\'RE WRITING\n' + d.writing + '\n\n' +
      'WHAT THEY WANT TO DO WITH IT\n' + d.goal + '\n'
    );
  }

  function mailtoFallback(d) {
    var href = 'mailto:' + CONFIG.TO_EMAIL +
      '?subject=' + encodeURIComponent(CONFIG.SUBJECT + ' — ' + d.name) +
      '&body=' + encodeURIComponent(bodyText(d));
    window.location.href = href;
  }

  function showSuccess(message) {
    form.hidden = true;
    var intro = $('#formIntro');
    if (intro) intro.hidden = true;   // step 1 heading gives way to step 2
    successBox.hidden = false;
    if (message && successMsg) successMsg.textContent = message;

    var url = bookingUrl();
    var fallback = $('#bookCallFallback');
    if (fallback) fallback.href = url;           // always a working link

    var openBooking = function (userInitiated) {
      return loadCalendly().then(function (ready) {
        if (ready && window.Calendly && window.Calendly.initPopupWidget) {
          window.Calendly.initPopupWidget({ url: url });
          return true;
        }
        // Only force a new tab on a real click; a popup blocker would eat an
        // automatic one and the visitor would think nothing happened.
        if (userInitiated) window.open(url, '_blank', 'noopener');
        return false;
      });
    };

    var btn = $('#bookCallBtn');
    if (btn) btn.onclick = function () { openBooking(true); };

    successBox.scrollIntoView({ block: 'nearest' });

    // Take them straight to the calendar, as soon as the widget is ready.
    // The button stays as a backstop if this doesn't land.
    setTimeout(function () { openBooking(false); }, 500);
  }

  function endpointConfigured() {
    if (CONFIG.PROVIDER === 'web3forms') {
      return CONFIG.ACCESS_KEY && CONFIG.ACCESS_KEY.indexOf('YOUR_') !== 0;
    }
    if (CONFIG.PROVIDER === 'formspree') {
      return !!CONFIG.FORMSPREE_URL;
    }
    return false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    var d = collect();
    if (d.company) return; // bot

    // No endpoint yet → open their mail client, pre-filled.
    if (!endpointConfigured()) {
      mailtoFallback(d);
      showSuccess(
        'Your email app should have opened with your message ready to send. ' +
        'If it didn\'t, email Steven directly at ' + CONFIG.TO_EMAIL + '.'
      );
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    var url, payload;

    if (CONFIG.PROVIDER === 'web3forms') {
      url = 'https://api.web3forms.com/submit';
      payload = {
        access_key:  CONFIG.ACCESS_KEY,
        subject:     CONFIG.SUBJECT + ' — ' + d.name,
        from_name:   'Steven Howard Coaching Website',
        name:        d.name,
        email:       d.email,
        'Focus area':          d.focus,
        'What they\'re writing': d.writing,
        'What they want to do':  d.goal
      };
    } else {
      url = CONFIG.FORMSPREE_URL;
      payload = {
        name: d.name, email: d.email, focus: d.focus,
        writing: d.writing, goal: d.goal,
        _subject: CONFIG.SUBJECT + ' — ' + d.name
      };
    }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) {
        return { ok: res.ok, json: j };
      }); })
      .then(function (r) {
        if (!r.ok) throw new Error('Bad response');
        showSuccess();
      })
      .catch(function () {
        // Network or provider failure — don't lose the message.
        mailtoFallback(d);
        showSuccess(
          'We couldn\'t send it automatically, so your email app should have opened ' +
          'with the message ready. If not, email Steven at ' + CONFIG.TO_EMAIL + '.'
        );
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send to Steven';
      });
  });

})();

/* =========================================================
   INTRO — a pen writes "Steven Howard, writing and
   publishing coach" on first open (~4s), then hands over.

   The letters are real Dancing Script outlines (extracted
   with fontTools, shaped with HarfBuzz). Each glyph clips a
   thick stroke that travels its own outline, so the ink
   fills along the letter shape — and the pen can sit on the
   true curve via getPointAtLength instead of sliding along a
   straight wipe.

   The <html class="intro-pending"> decision is made by the
   inline script in <head>, before first paint.
   ========================================================= */
(function () {
  'use strict';

  var root  = document.documentElement;
  var intro = document.getElementById('intro');
  if (!intro) return;

  if (!root.classList.contains('intro-pending')) {
    intro.parentNode.removeChild(intro);
    return;
  }

  var stage = document.getElementById('introStage');
  var pen   = document.getElementById('introPen');
  var skip  = document.getElementById('introSkip');

  var NIB_X = 4.2 / 24, NIB_Y = 21.4 / 24;
  var finished = false;

  /* ---------------- easing ---------------- */
  function flow(t)      { return t * 0.72 + (t * t * (3 - 2 * t)) * 0.28; }
  function easeOut(t)   { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------------- pen ---------------- */

  // NB: offsetWidth is undefined on SVG elements, so measure the box directly.
  function penSize() { return pen.getBoundingClientRect().width || 64; }

  function penTo(x, y, rot, alpha) {
    var s = penSize();
    pen.style.transform =
      'translate(' + (x - s * NIB_X) + 'px, ' + (y - s * NIB_Y) + 'px)' +
      ' rotate(' + rot + 'deg)';
    if (alpha !== undefined) pen.style.opacity = String(alpha);
  }

  function tween(duration, step) {
    return new Promise(function (resolve) {
      var start = null;
      function frame(now) {
        if (finished) return resolve();
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        step(t);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }
      requestAnimationFrame(frame);
    });
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---------------- line setup ---------------- */

  function buildLine(sel) {
    var svg   = intro.querySelector(sel);
    var paths = [].slice.call(svg.querySelectorAll('defs path'));
    var inks  = [].slice.call(svg.querySelectorAll('.ink'));
    var lens  = paths.map(function (p) { return p.getTotalLength(); });
    var total = lens.reduce(function (a, b) { return a + b; }, 0);

    inks.forEach(function (u, i) {
      u.style.strokeDasharray  = lens[i];
      u.style.strokeDashoffset = lens[i];   // hidden until written
    });

    return { svg: svg, paths: paths, inks: inks, lens: lens, total: total };
  }

  /* Map a point in SVG user units to stage pixels. The glyph paths live in
     <defs> so they have no CTM of their own — use the <svg> root, which
     shares their coordinate system. */
  function toStage(line, pt) {
    var m  = line.svg.getScreenCTM();
    var sp = line.svg.createSVGPoint();
    sp.x = pt.x; sp.y = pt.y;
    var scr = sp.matrixTransform(m);
    var sr  = stage.getBoundingClientRect();
    return { x: scr.x - sr.left, y: scr.y - sr.top };
  }

  function pointAt(line, idx, len) {
    return toStage(line, line.paths[idx].getPointAtLength(len));
  }

  /* Pen angle leans with the stroke direction, heavily damped so it doesn't
     spin through loops. */
  function angleAt(line, idx, len) {
    var path = line.paths[idx];
    var L    = line.lens[idx];
    var a = path.getPointAtLength(clamp(len - 12, 0, L));
    var b = path.getPointAtLength(clamp(len + 12, 0, L));
    var deg = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    return -6 + clamp(deg * 0.10, -13, 13);
  }

  function lineStart(line) {
    return { p: pointAt(line, 0, 0), a: angleAt(line, 0, 0) };
  }
  function lineEnd(line) {
    var last = line.paths.length - 1;
    return { p: pointAt(line, last, line.lens[last]), a: angleAt(line, last, line.lens[last]) };
  }

  /* ---------------- movements ---------------- */

  function approach(target) {
    return tween(340, function (t) {
      var e = easeOut(t);
      penTo(target.p.x - 60 * (1 - e), target.p.y - 46 * (1 - e), -19 + (target.a + 19) * e, e);
    });
  }

  /* Ink fills glyph by glyph; the pen rides the actual outline. */
  function writeLine(line, duration) {
    return tween(duration, function (t) {
      var target = flow(t) * line.total;
      var acc = 0, idx = 0, at = 0;

      for (var i = 0; i < line.lens.length; i++) {
        var L    = line.lens[i];
        var done = clamp(target - acc, 0, L);
        line.inks[i].style.strokeDashoffset = String(L - done);
        if (done > 0) { idx = i; at = done; }
        acc += L;
      }

      var p = pointAt(line, idx, at);
      penTo(p.x, p.y, angleAt(line, idx, at), 1);
    });
  }

  /* Lift, arc over what was just written, land on the next line.
     A quadratic curve only reaches halfway to its control point, so derive
     the control from the apex we want or the nib drags through the text. */
  function travel(from, to, duration, apexY) {
    var cx = (from.x + to.x) / 2;
    var cy = 2 * apexY - 0.5 * (from.y + to.y);
    return tween(duration, function (t) {
      var e = easeInOut(t), n = 1 - e;
      penTo(
        n*n * from.x + 2*n*e * cx + e*e * to.x,
        n*n * from.y + 2*n*e * cy + e*e * to.y,
        -6 - Math.sin(e * Math.PI) * 16,
        1
      );
    });
  }

  function liftAway(from) {
    return tween(420, function (t) {
      var e = easeInOut(t);
      penTo(from.x + 64 * e, from.y - 52 * e, -6 - 24 * e, 1 - e);
    });
  }

  /* ---------------- lifecycle ---------------- */

  function finish() {
    if (finished) return;
    finished = true;

    try { sessionStorage.setItem('sh_intro_seen', '1'); } catch (e) {}

    pen.style.opacity = '0';
    intro.classList.add('is-done');
    root.classList.remove('intro-pending');   // unlocks scrolling

    document.removeEventListener('keydown', onKey);
    intro.removeEventListener('click', finish);

    setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 600);
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
  }

  document.addEventListener('keydown', onKey);
  intro.addEventListener('click', finish);
  if (skip) skip.addEventListener('click', finish);

  function play() {
    if (finished) return;

    var name = buildLine('.hw--name');
    var role = buildLine('.hw--role');
    intro.classList.add('is-ready');

    var nStart = lineStart(name), nEnd = lineEnd(name);
    var rStart = lineStart(role), rEnd = lineEnd(role);

    var apex = Math.min(nStart.p.y, nEnd.p.y) - name.svg.getBoundingClientRect().height * 0.30;

    penTo(nStart.p.x - 60, nStart.p.y - 46, -19, 0);

    approach(nStart)
      .then(function () { return writeLine(name, 1650); })
      .then(function () { return travel(nEnd.p, rStart.p, 480, apex); })
      .then(function () { return writeLine(role, 1350); })
      .then(function () { return liftAway(rEnd.p); })
      .then(function () { return wait(240); })
      .then(finish);
  }

  // Nothing to wait on for fonts now — the letters are baked-in outlines.
  requestAnimationFrame(play);

  // Hard stop, so the page is never left covered.
  setTimeout(finish, 8000);
})();
