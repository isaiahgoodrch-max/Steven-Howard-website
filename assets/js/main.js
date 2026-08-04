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
    SUBJECT:    'New coaching inquiry from your website'
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
     MODAL
     ======================================================= */
  var modal      = $('#contactModal');
  var form       = $('#contactForm');
  var successBox = $('#formSuccess');
  var successMsg = $('#successMsg');
  var submitBtn  = $('#submitBtn');
  var lastFocus  = null;

  function openModal(e) {
    if (e) e.preventDefault();
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
    successBox.hidden = false;
    if (message && successMsg) successMsg.textContent = message;
    successBox.scrollIntoView({ block: 'nearest' });
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
   INTRO — "Steven Howard, writing and publishing coach"
   written out by a pen on first open.

   The <html class="intro-pending"> decision is made by the
   inline script in <head>, before first paint. This block
   only runs the animation and then hands the page over.
   ========================================================= */
(function () {
  'use strict';

  var root  = document.documentElement;
  var intro = document.getElementById('intro');
  if (!intro) return;

  // Head script decided against it (no JS storage, reduced motion, already seen).
  if (!root.classList.contains('intro-pending')) {
    intro.parentNode.removeChild(intro);
    return;
  }

  var stage    = document.getElementById('introStage');
  var pen      = document.getElementById('introPen');
  var skip     = document.getElementById('introSkip');
  var nameSpan = intro.querySelector('.intro__line--name span');
  var roleSpan = intro.querySelector('.intro__line--role span');

  // Where the nib sits inside the 24x24 icon box.
  var NIB_X = 4.2 / 24, NIB_Y = 21.4 / 24;

  var finished = false;

  /* ---------------- easing ---------------- */

  // Near-constant speed with softened ends, so a line doesn't start or
  // stop dead. Pure linear is what made this feel mechanical.
  function flow(t)      { return t * 0.68 + (t * t * (3 - 2 * t)) * 0.32; }
  function easeOut(t)   { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }

  /* ---------------- pen ---------------- */

  // NB: offsetWidth is undefined on SVG elements, so measure the box directly.
  function penSize() { return pen.getBoundingClientRect().width || 52; }

  function penTo(x, y, rot, alpha) {
    var s = penSize();
    pen.style.transform =
      'translate(' + (x - s * NIB_X) + 'px, ' + (y - s * NIB_Y) + 'px)' +
      ' rotate(' + (rot || 0) + 'deg)';
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

  /* Start and end of a line, in stage coordinates. */
  function anchors(el) {
    var sr = stage.getBoundingClientRect();
    var r  = el.getBoundingClientRect();
    var x  = r.left - sr.left;
    var top = r.top - sr.top;
    return { x: x, top: top, y: top + r.height * 0.72,
             w: r.width, h: r.height, endX: x + r.width };
  }

  /* ---------------- movements ---------------- */

  /* The nib flies in and settles onto the page rather than popping into place. */
  function approach(a) {
    return tween(340, function (t) {
      var e = easeOut(t);
      penTo(a.x - 56 * (1 - e), a.y - 42 * (1 - e), -17 + 14 * e, e);
    });
  }

  /* Reveal a line while the pen rides the leading edge of the ink. */
  function writeLine(el, a, duration) {
    // Nib travel has to scale with the type. Fixed pixel amounts vanish at
    // large sizes, which is what made the pen look like it was sliding flat.
    var big   = a.h * 0.052;
    var small = a.h * 0.021;

    return tween(duration, function (t) {
      var p = flow(t);

      // Slight stroke rhythm: speeds up and eases through the line the way a
      // hand does. The wiggle is small enough that p stays monotonic.
      p = Math.max(0, Math.min(1, p + Math.sin(p * Math.PI * 8) * 0.012));

      el.style.clipPath = 'inset(0 ' + ((1 - p) * 100) + '% 0 0)';

      // Two frequencies, so the bob reads as letterforms instead of a metronome.
      var bob = Math.sin(p * Math.PI * 13) * big + Math.sin(p * Math.PI * 31) * small;
      var rot = -4 + Math.sin(p * Math.PI * 9) * 4;
      penTo(a.x + p * a.w, a.y + bob, rot, 1);
    });
  }

  /* Lift off, arc across, and land at the start of the next line.
     A quadratic curve only reaches halfway to its control point, so derive
     the control from the apex we actually want rather than guessing an
     offset — otherwise the nib drags across the line it just wrote. */
  function travel(from, to, duration, apexY) {
    var cx = (from.x + to.x) / 2;
    var cy = 2 * apexY - 0.5 * (from.y + to.y);
    return tween(duration, function (t) {
      var e = easeInOut(t), n = 1 - e;
      penTo(
        n*n * from.x + 2*n*e * cx + e*e * to.x,
        n*n * from.y + 2*n*e * cy + e*e * to.y,
        -3 - Math.sin(e * Math.PI) * 15,   // tilts as it lifts
        1
      );
    });
  }

  /* Pen leaves the frame instead of blinking out. */
  function liftAway(from) {
    return tween(400, function (t) {
      var e = easeInOut(t);
      penTo(from.x + 60 * e, from.y - 48 * e, -3 - 22 * e, 1 - e);
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

    var a1 = anchors(nameSpan);
    var a2 = anchors(roleSpan);

    penTo(a1.x - 56, a1.y - 42, -17, 0);

    approach(a1)
      .then(function () { return writeLine(nameSpan, a1, 1450); })
      .then(function () {
        return travel({x: a1.endX, y: a1.y}, {x: a2.x, y: a2.y}, 460, a1.top - 14);
      })
      .then(function () { return writeLine(roleSpan, a2, 1150); })
      .then(function () { return liftAway({x: a2.endX, y: a2.y}); })
      .then(function () { return wait(220); })
      .then(finish);
  }

  // Measure only once the script font is really in, or widths will be wrong.
  var ready   = (document.fonts && document.fonts.ready) || Promise.resolve();
  var timeout = new Promise(function (r) { setTimeout(r, 1200); });
  Promise.race([ready, timeout]).then(play);

  // Hard stop, in case a frame callback never lands (background tab, etc).
  setTimeout(finish, 8000);
})();
