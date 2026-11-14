(function () {
  'use strict';

  var cfg = window.SSL_CONFIG || {};
  var validators = window.SSLValidators;

  function hydrateContacts() {
    if (cfg.phoneHref) {
      document.querySelectorAll('[data-tel]').forEach(function (el) {
        el.setAttribute('href', cfg.phoneHref);
      });
    }
    if (cfg.phoneDisplay) {
      document.querySelectorAll('[data-tel-text]').forEach(function (el) {
        el.textContent = cfg.phoneDisplay;
      });
    }
    if (cfg.telegramUrl) {
      document.querySelectorAll('[data-tg]').forEach(function (el) {
        el.setAttribute('href', cfg.telegramUrl);
      });
    }
    var yrEl = document.getElementById('yr');
    if (yrEl) {
      yrEl.textContent = String(new Date().getFullYear());
    }
  }

  function initMobileNav() {
    var burger = document.getElementById('burger');
    var nav = document.getElementById('nav');
    if (!burger || !nav) return;

    function setOpen(isOpen) {
      nav.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      document.body.classList.toggle('nav-open', isOpen);
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !nav.classList.contains('is-open');
      setOpen(open);
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (!nav.contains(e.target) && !burger.contains(e.target)) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        burger.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960 && nav.classList.contains('is-open')) {
        setOpen(false);
      }
    });
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-copy-phone]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var phone = cfg.phoneDisplay || '+998 90 601 25 00';
        var labelEl = btn.querySelector('[data-copy-label]') || btn;
        var original = labelEl.textContent;

        function markCopied() {
          labelEl.textContent = 'Номер скопирован';
          btn.classList.add('is-copied');
          setTimeout(function () {
            labelEl.textContent = original;
            btn.classList.remove('is-copied');
          }, 2200);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(phone).then(markCopied).catch(markCopied);
        } else {
          markCopied();
        }
      });
    });
  }

  function initLeadForm() {
    var form = document.getElementById('lead-form');
    if (!form || !validators) return;

    var nameInput = document.getElementById('lead-name');
    var phoneInput = document.getElementById('lead-phone');
    var taskInput = document.getElementById('lead-task');
    var consentInput = document.getElementById('lead-consent');
    var errName = document.getElementById('err-name');
    var errPhone = document.getElementById('err-phone');
    var errConsent = document.getElementById('err-consent');
    var successBox = document.getElementById('lead-success');
    var successMeta = document.getElementById('lead-success-meta');
    var resetBtn = document.getElementById('lead-reset');

    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var raw = phoneInput.value;
        var digits = raw.replace(/\D/g, '');
        if (!digits.length) {
          phoneInput.value = '';
          return;
        }
        phoneInput.value = validators.formatUzPhone(raw);
      });
    }

    function setFieldError(input, errEl, message) {
      if (errEl) {
        errEl.textContent = message;
        errEl.hidden = !message;
      }
      if (input) {
        input.setAttribute('aria-invalid', message ? 'true' : 'false');
        input.classList.toggle('is-invalid', Boolean(message));
      }
    }

    function clearFieldError(input, errEl) {
      setFieldError(input, errEl, '');
    }

    if (nameInput) {
      nameInput.addEventListener('input', function () {
        clearFieldError(nameInput, errName);
      });
    }
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        clearFieldError(phoneInput, errPhone);
      });
    }
    if (consentInput) {
      consentInput.addEventListener('change', function () {
        clearFieldError(consentInput, errConsent);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var result = validators.validateLeadForm({
        name: nameInput ? nameInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        consent: consentInput ? consentInput.checked : false
      });

      setFieldError(nameInput, errName, result.errors.name);
      setFieldError(phoneInput, errPhone, result.errors.phone);
      setFieldError(consentInput, errConsent, result.errors.consent);

      if (!result.valid) {
        if (result.errors.name && nameInput) nameInput.focus();
        else if (result.errors.phone && phoneInput) phoneInput.focus();
        else if (result.errors.consent && consentInput) consentInput.focus();
        return;
      }

      if (successMeta) {
        var submittedName = nameInput ? nameInput.value.trim() : '';
        var submittedPhone = phoneInput ? phoneInput.value.trim() : '';
        successMeta.textContent = submittedName + ' · ' + submittedPhone;
      }

      form.hidden = true;
      if (successBox) {
        successBox.hidden = false;
      }
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        clearFieldError(nameInput, errName);
        clearFieldError(phoneInput, errPhone);
        clearFieldError(consentInput, errConsent);
        if (taskInput) taskInput.value = '';
        if (successBox) successBox.hidden = true;
        form.hidden = false;
        if (nameInput) nameInput.focus();
      });
    }
  }

  function initReviewCarousel() {
    var viewport = document.getElementById('review-viewport');
    var track = document.getElementById('review-track');
    var prevBtn = document.getElementById('review-prev');
    var nextBtn = document.getElementById('review-next');
    var statusEl = document.getElementById('review-status');
    var dotsContainer = document.getElementById('review-dots');

    if (!viewport || !track || !validators) return;

    var cards = Array.prototype.slice.call(track.querySelectorAll('.review-card'));
    if (!cards.length) return;

    var currentIndex = 0;

    function getMetrics() {
      var pageSize = validators.getCarouselPageSize(window.innerWidth);
      var maxIndex = Math.max(0, cards.length - pageSize);
      return { pageSize: pageSize, maxIndex: maxIndex };
    }

    function renderDots(maxIndex) {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      for (var i = 0; i <= maxIndex; i++) {
        (function (idx) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'carousel-dot' + (idx === currentIndex ? ' is-active' : '');
          dot.setAttribute('aria-label', 'Показать позицию ' + (idx + 1));
          dot.setAttribute('aria-pressed', idx === currentIndex ? 'true' : 'false');
          dot.addEventListener('click', function () {
            currentIndex = idx;
            update();
          });
          dotsContainer.appendChild(dot);
        })(i);
      }
    }

    function update() {
      var metrics = getMetrics();
      currentIndex = validators.clampCarouselIndex(currentIndex, cards.length, metrics.pageSize);

      var gap = 24;
      var cardWidth = cards[0].getBoundingClientRect().width;
      var offset = currentIndex * (cardWidth + gap);
      track.style.transform = 'translate3d(' + (-offset) + 'px, 0, 0)';

      if (prevBtn) prevBtn.disabled = currentIndex === 0;
      if (nextBtn) nextBtn.disabled = currentIndex >= metrics.maxIndex;

      if (statusEl) {
        var from = currentIndex + 1;
        var to = Math.min(cards.length, currentIndex + metrics.pageSize);
        statusEl.textContent = metrics.pageSize > 1
          ? from + '–' + to + ' из ' + cards.length
          : from + ' из ' + cards.length;
      }

      renderDots(metrics.maxIndex);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        currentIndex = Math.max(0, currentIndex - 1);
        update();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var metrics = getMetrics();
        currentIndex = Math.min(metrics.maxIndex, currentIndex + 1);
        update();
      });
    }

    window.addEventListener('resize', update);
    update();
  }

  function initProjectFilters() {
    var filterBar = document.getElementById('project-filters');
    var grid = document.getElementById('project-grid');
    if (!filterBar || !grid) return;

    var buttons = Array.prototype.slice.call(filterBar.querySelectorAll('[data-filter]'));
    var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-category]'));
    var countEl = document.getElementById('project-count');

    function applyFilter(category) {
      var visible = 0;
      cards.forEach(function (card) {
        var match = category === 'all' || card.getAttribute('data-category') === category;
        card.hidden = !match;
        if (match) visible += 1;
      });
      buttons.forEach(function (btn) {
        var active = btn.getAttribute('data-filter') === category;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (countEl) {
        countEl.textContent = 'Показано проектов: ' + visible;
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter') || 'all');
      });
    });

    applyFilter('all');
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    hydrateContacts();
    initMobileNav();
    initCopyButtons();
    initLeadForm();
    initReviewCarousel();
    initProjectFilters();
    initReveal();
  });
})();
