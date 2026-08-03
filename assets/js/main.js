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
