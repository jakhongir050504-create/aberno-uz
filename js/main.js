/* =========================================================
   Aberno Butters Group — asosiy skript
   ========================================================= */
(function () {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  const header = document.querySelector('.site-header');

  /* ---------- PIN qulf ---------- */
  // Eslatma: bu faqat brauzer tomonidagi qulf. PIN ochiq holda saqlanmaydi, faqat uning SHA-256 xeshi.
  const PIN_HASH = '0e1d85352d5b627ca6ebf40a9fb51db38b12bef99abd6187b6e552880450f124';
  const PIN_SALT = 'aberno:';
  const UNLOCK_KEY = 'aberno-unlocked';

  function sha256(text) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  if (root.classList.contains('is-locked')) {
    const gate = document.createElement('div');
    gate.className = 'pin-gate';
    gate.innerHTML =
      '<form class="pin-gate__card" novalidate>' +
        '<div class="pin-gate__lock"><svg class="icon" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>' +
        '<h1>Sayt himoyalangan</h1>' +
        '<p>Davom etish uchun PIN kodni kiriting</p>' +
        '<input class="pin-gate__input" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="••••" aria-label="PIN kod" required>' +
        '<button class="btn btn--gold pin-gate__btn" type="submit">Kirish</button>' +
        '<div class="pin-gate__error" role="alert"></div>' +
      '</form>';
    body.appendChild(gate);

    const form = gate.querySelector('form');
    const input = gate.querySelector('input');
    const error = gate.querySelector('.pin-gate__error');
    let busy = false;
    input.focus();

    function check() {
      if (busy) return;
      const pin = input.value.trim();
      if (pin.length < 4) {
        error.textContent = 'PIN kod 4 ta raqamdan iborat';
        return;
      }
      busy = true;
      sha256(PIN_SALT + pin).then(function (hash) {
        busy = false;
        if (hash === PIN_HASH) {
          try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) { /* saqlab boʻlmasa, faqat shu sahifa ochiladi */ }
          root.classList.remove('is-locked');
          gate.remove();
          window.dispatchEvent(new Event('scroll'));
        } else {
          error.textContent = 'PIN kod notoʻgʻri. Qaytadan urinib koʻring.';
          gate.classList.remove('is-wrong');
          void gate.offsetWidth; // animatsiyani qayta ishga tushirish uchun
          gate.classList.add('is-wrong');
          input.value = '';
          input.focus();
        }
      });
    }

    input.addEventListener('input', function () {
      input.value = input.value.replace(/\D/g, '').slice(0, 4);
      error.textContent = '';
      gate.classList.remove('is-wrong');
      if (input.value.length === 4) check();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      check();
    });
  }

  /* ---------- Yorugʻ / qorongʻu rejim ---------- */
  // Boshlangʻich mavzu <head> ichidagi kichik skriptda oʻrnatiladi (sahifa miltillamasligi uchun).
  const themeBtn = document.querySelector('.theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function storedTheme() {
    try { return localStorage.getItem('theme'); } catch (e) { return null; }
  }
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) {
      const dark = theme === 'dark';
      themeBtn.setAttribute('aria-pressed', dark);
      themeBtn.setAttribute('aria-label', dark ? 'Yorugʻ rejimga oʻtish' : 'Qorongʻu rejimga oʻtish');
      themeBtn.title = themeBtn.getAttribute('aria-label');
    }
  }
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* saqlab boʻlmasa ham ishlayveradi */ }
    });
  }
  // Foydalanuvchi oʻzi tanlamagan boʻlsa — tizim sozlamasiga ergashamiz
  systemDark.addEventListener('change', function (e) {
    const saved = storedTheme();
    if (saved !== 'light' && saved !== 'dark') applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ---------- Mobil menyu ---------- */
  const burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      const open = body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', open);
    });
    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        body.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') body.classList.remove('nav-open');
    });
  }

  /* ---------- Header soyasi va "tepaga" tugmasi ---------- */
  const toTop = document.querySelector('.to-top');
  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 10);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Scroll paytida paydo bo'lish ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Raqamlar hisoblagichi ---------- */
  const counters = document.querySelectorAll('[data-count]');
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ru-RU') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          co.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ---------- Mahsulot filtri ---------- */
  const filterBar = document.querySelector('[data-filters]');
  if (filterBar) {
    const cards = document.querySelectorAll('.product-card[data-cat]');
    const chips = filterBar.querySelectorAll('.chip');

    chips.forEach(function (chip) {
      const f = chip.dataset.filter;
      const count = f === 'all'
        ? cards.length
        : Array.prototype.filter.call(cards, function (c) { return c.dataset.cat === f; }).length;
      const span = document.createElement('span');
      span.textContent = count;
      chip.appendChild(span);
    });

    filterBar.addEventListener('click', function (e) {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const f = chip.dataset.filter;
      chips.forEach(function (c) {
        c.classList.toggle('is-active', c === chip);
        c.setAttribute('aria-pressed', c === chip);
      });
      cards.forEach(function (card) {
        card.classList.toggle('is-hidden', f !== 'all' && card.dataset.cat !== f);
      });
    });
  }

  /* ---------- FAQ akkordeon ---------- */
  document.querySelectorAll('.faq__item').forEach(function (item) {
    const btn = item.querySelector('.faq__q');
    const answer = item.querySelector('.faq__a');
    btn.addEventListener('click', function () {
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
      answer.style.maxHeight = open ? answer.scrollHeight + 'px' : '0';
    });
  });

  /* ---------- Aloqa formasi ---------- */
  const form = document.querySelector('[data-contact-form]');
  if (form) {
    const success = form.querySelector('.form__success');
    const rules = {
      name: function (v) { return v.trim().length >= 2 || 'Ismingizni kiriting'; },
      phone: function (v) {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 9 || 'Telefon raqamini toʻliq kiriting';
      },
      email: function (v) {
        return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email manzili notoʻgʻri';
      },
      topic: function (v) { return !!v || 'Mavzuni tanlang'; },
      message: function (v) { return v.trim().length >= 10 || 'Xabar kamida 10 ta belgidan iborat boʻlsin'; }
    };

    function validate(input) {
      const rule = rules[input.name];
      if (!rule) return true;
      const result = rule(input.value);
      const field = input.closest('.field');
      const err = field.querySelector('.field__error');
      const ok = result === true;
      field.classList.toggle('has-error', !ok);
      if (err) err.textContent = ok ? '' : result;
      return ok;
    }

    form.querySelectorAll('input, textarea, select').forEach(function (input) {
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('has-error')) validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input, textarea, select').forEach(function (input) {
        if (!validate(input)) valid = false;
      });
      if (!valid) {
        const firstErr = form.querySelector('.has-error input, .has-error textarea, .has-error select');
        if (firstErr) firstErr.focus();
        return;
      }
      // Eslatma: bu yerda backend (masalan, Telegram bot yoki PHP mailer) ga yuborish qo'shiladi.
      form.reset();
      success.classList.add('is-visible');
      setTimeout(function () { success.classList.remove('is-visible'); }, 6000);
    });
  }

  /* ---------- Joriy yil ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
