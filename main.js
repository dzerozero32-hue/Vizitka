(function () {
  'use strict';

  var cfg = window.SSL_CONFIG || {};
  var validators = window.SSLValidators;
  var i18n = window.SSL_I18N || {};

  function getBasePrefix() {
    var scripts = document.querySelectorAll('script[src*="assets/js/main.js"]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('../') === 0) {
        return '../';
      }
    }
    return '';
  }

  var BASE_PREFIX = getBasePrefix();

  /* Настройки (тема, язык) хранятся в localStorage, а если он недоступен
     или не общий между файлами (открытие через file://) — дублируются в window.name,
     который сохраняется при переходах между страницами одной вкладки. */
  function readNameStore() {
    var out = {};
    String(window.name || '').split(';').forEach(function (pair) {
      var i = pair.indexOf('=');
      if (i > 0 && pair.slice(0, i).indexOf('ssl_') === 0) {
        out[pair.slice(0, i)] = pair.slice(i + 1);
      }
    });
    return out;
  }

  function writeNameStore(key, val) {
    try {
      var store = readNameStore();
      store[key] = val;
      var foreign = String(window.name || '').split(';').filter(function (p) {
        return p && p.indexOf('ssl_') !== 0;
      });
      var mine = Object.keys(store).map(function (k) { return k + '=' + store[k]; });
      window.name = foreign.concat(mine).join(';');
    } catch (e) { /* ignore */ }
  }

  function getStoredPref(key, fallback) {
    var val = null;
    try {
      val = window.localStorage.getItem(key);
    } catch (e) { /* localStorage unavailable */ }
    if (!val) {
      val = readNameStore()[key] || null;
    }
    return val || fallback;
  }

  function setStoredPref(key, val) {
    try {
      window.localStorage.setItem(key, val);
    } catch (e) { /* localStorage unavailable */ }
    writeNameStore(key, val);
  }

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
    if (cfg.whatsappUrl) {
      document.querySelectorAll('[data-wa]').forEach(function (el) {
        el.setAttribute('href', cfg.whatsappUrl);
      });
    }
    if (cfg.whatsappDisplay) {
      document.querySelectorAll('[data-wa-text]').forEach(function (el) {
        el.textContent = cfg.whatsappDisplay;
      });
    }
    var yrEl = document.getElementById('yr');
    if (yrEl) {
      yrEl.textContent = String(new Date().getFullYear());
    }
  }

  /* ========================================================================
     Theme & Language Preferences Engine
     ======================================================================== */

  var currentTheme = validators ? validators.normalizeTheme(getStoredPref('ssl_theme', 'light')) : 'light';
  var currentLang = validators ? validators.normalizeLang(getStoredPref('ssl_lang', 'ru')) : 'ru';

  function updateThemeIcons(theme) {
    document.querySelectorAll('[data-theme-icon]').forEach(function (svg) {
      if (theme === 'dark') {
        svg.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
      } else {
        svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>';
      }
    });
  }

  function applyTheme(theme) {
    currentTheme = validators ? validators.normalizeTheme(theme) : (theme === 'dark' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
    setStoredPref('ssl_theme', currentTheme);
    updateThemeIcons(currentTheme);

    document.querySelectorAll('[data-theme-set]').forEach(function (btn) {
      var active = btn.getAttribute('data-theme-set') === currentTheme;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyLang(lang) {
    currentLang = validators ? validators.normalizeLang(lang) : 'ru';
    document.documentElement.setAttribute('lang', currentLang);
    setStoredPref('ssl_lang', currentLang);

    var dict = i18n[currentLang] || i18n.ru || {};
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    if (window.__heroRotReload) window.__heroRotReload();
    if (typeof brandify === 'function') brandify();
    document.querySelectorAll('[data-lang-set]').forEach(function (btn) {
      var active = btn.getAttribute('data-lang-set') === currentLang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      if (btn.hasAttribute('data-lang-code')) btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-lang-current]').forEach(function (el) {
      el.textContent = currentLang.toUpperCase();
    });
  }

  function initLangSwitch() {
    var switches = document.querySelectorAll('[data-lang-switch]');
    if (!switches.length) return;

    function close(sw) {
      sw.classList.remove('is-open');
      var b = sw.querySelector('.lang-switch-btn');
      if (b) b.setAttribute('aria-expanded', 'false');
    }

    switches.forEach(function (sw) {
      var btn = sw.querySelector('.lang-switch-btn');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !sw.classList.contains('is-open');
        switches.forEach(close);
        if (open) {
          sw.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
      sw.querySelectorAll('[data-lang-set]').forEach(function (item) {
        item.addEventListener('click', function () { close(sw); });
      });
    });

    document.addEventListener('click', function (e) {
      switches.forEach(function (sw) { if (!sw.contains(e.target)) close(sw); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') switches.forEach(close);
    });
  }

  function initPreferences() {
    applyTheme(currentTheme);
    applyLang(currentLang);

    window.addEventListener('storage', function (e) {
      if (e.key === 'ssl_theme' && e.newValue) applyTheme(e.newValue);
      if (e.key === 'ssl_lang' && e.newValue) applyLang(e.newValue);
    });

    document.addEventListener('click', function (e) {
      var toggleBtn = e.target.closest('[data-theme-toggle]');
      if (toggleBtn) {
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        return;
      }

      var themeSetBtn = e.target.closest('[data-theme-set]');
      if (themeSetBtn) {
        applyTheme(themeSetBtn.getAttribute('data-theme-set'));
        return;
      }

      var langSetBtn = e.target.closest('[data-lang-set]');
      if (langSetBtn) {
        applyLang(langSetBtn.getAttribute('data-lang-set'));
      }
    });
  }

  /* ========================================================================
     Settings Drawer & Auth Modal (Future-Ready Concept UI)
     ======================================================================== */

  function initStudioOverlays() {
    if (document.getElementById('ssl-settings-overlay')) return;

    var hasAuthTriggers = Boolean(document.querySelector('[data-open-auth]'));

    var html = [
      '<div class="ui-overlay settings-overlay" id="ssl-settings-overlay" aria-hidden="true">',
      '  <aside class="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-drawer-title">',
      '    <div class="modal-head">',
      '      <div>',
      '        <h2 id="settings-drawer-title" data-i18n="settings.title">Настройки</h2>',
      '        <p class="modal-sub" data-i18n="settings.subtitle">Тема оформления, язык и личный кабинет</p>',
      '      </div>',
      '      <button class="icon-btn" type="button" data-close-overlay aria-label="Закрыть настройки">',
      '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
      '      </button>',
      '    </div>',
      '    <div class="drawer-group">',
      '      <span class="drawer-label" data-i18n="settings.themeHeading">Цветовая тема</span>',
      '      <div class="theme-choice-grid">',
      '        <button class="theme-choice-btn" type="button" data-theme-set="light" aria-pressed="true">',
      '          <span class="theme-swatch theme-swatch-light" aria-hidden="true"></span>',
      '          <strong data-i18n="settings.themeLight">Светлая студия</strong>',
      '        </button>',
      '        <button class="theme-choice-btn" type="button" data-theme-set="dark" aria-pressed="false">',
      '          <span class="theme-swatch theme-swatch-dark" aria-hidden="true"></span>',
      '          <strong data-i18n="settings.themeDark">Тёмный режим</strong>',
      '        </button>',
      '      </div>',
      '    </div>',
      '    <div class="drawer-group">',
      '      <span class="drawer-label" data-i18n="settings.langHeading">Язык интерфейса</span>',
      '      <div class="segmented-row" role="group" aria-label="Выбор языка">',
      '        <button class="segmented-btn" type="button" data-lang-set="ru" aria-pressed="true">Русский</button>',
      '        <button class="segmented-btn" type="button" data-lang-set="uz" aria-pressed="false">O‘zbekcha</button>',
      '        <button class="segmented-btn" type="button" data-lang-set="en" aria-pressed="false">English</button>',
      '      </div>',
      '    </div>',
      '    <div class="drawer-group">',
      '      <span class="drawer-label" data-i18n="settings.portalHeading">Личный кабинет клиента</span>',
      '      <div class="auth-actions">',
      '        <button class="btn btn-primary" type="button" data-open-auth data-i18n="settings.openCabinet">Открыть личный кабинет</button>',
      '      </div>',
      '    </div>',
      '  </aside>',
      '</div>'
    ];

    if (hasAuthTriggers) {
      html = html.concat([
        '<div class="ui-overlay auth-overlay" id="ssl-auth-overlay" aria-hidden="true">',
        '  <div class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">',
        '    <div class="modal-head">',
        '      <div>',
        '        <h2 id="auth-modal-title" data-i18n="auth.title">Вход в кабинет клиента</h2>',
        '        <p class="modal-sub" data-i18n="auth.subtitle">Визуальный прототип будущей авторизации для просмотра проектов, SLA-заявок и актов.</p>',
        '      </div>',
        '      <button class="icon-btn" type="button" data-close-overlay aria-label="Закрыть окно входа">',
        '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        '      </button>',
        '    </div>',
        '    <div class="auth-tabs" role="tablist">',
        '      <button class="auth-tab is-active" type="button" data-auth-mode="login" aria-selected="true" data-i18n="auth.tabLogin">Вход</button>',
        '      <button class="auth-tab" type="button" data-auth-mode="register" aria-selected="false" data-i18n="auth.tabRegister">Регистрация</button>',
        '    </div>',
        '    <form id="auth-demo-form" novalidate>',
        '      <div class="auth-field" id="auth-company-wrap" hidden>',
        '        <label for="auth-company">Компания</label>',
        '        <input id="auth-company" type="text" placeholder="ООО «Название компании»">',
        '      </div>',
        '      <div class="auth-field">',
        '        <label for="auth-phone">Телефон или корпоративный E-mail</label>',
        '        <input id="auth-phone" type="text" placeholder="+998 90 000 00 00">',
        '      </div>',
        '      <div class="auth-field">',
        '        <label for="auth-pass">Код доступа или пароль</label>',
        '        <input id="auth-pass" type="password" value="••••••••" placeholder="Введите пароль">',
        '      </div>',
        '      <div class="auth-actions">',
        '        <button class="btn btn-primary" type="submit" data-i18n="auth.submitDemo">Войти в демо-кабинет</button>',
        '      </div>',
        '    </form>',
        '  </div>',
        '</div>'
      ]);
    }

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html.join('\n');
    document.body.appendChild(wrapper);

    var settingsOverlay = document.getElementById('ssl-settings-overlay');
    var authOverlay = document.getElementById('ssl-auth-overlay');
    var authCompanyWrap = document.getElementById('auth-company-wrap');
    var authForm = document.getElementById('auth-demo-form');
    var lastTrigger = null;

    function isOpen() {
      return settingsOverlay.classList.contains('is-open') ||
        (authOverlay && authOverlay.classList.contains('is-open'));
    }

    function closeAllOverlays() {
      settingsOverlay.classList.remove('is-open');
      settingsOverlay.setAttribute('aria-hidden', 'true');
      if (authOverlay) {
        authOverlay.classList.remove('is-open');
        authOverlay.setAttribute('aria-hidden', 'true');
      }
      document.body.classList.remove('modal-open');
      if (lastTrigger && document.body.contains(lastTrigger)) {
        try { lastTrigger.focus(); } catch (e) { /* ignore */ }
      }
      lastTrigger = null;
    }

    function openOverlay(overlay, trigger) {
      closeAllOverlays();
      lastTrigger = trigger || null;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      var focusTarget = overlay.querySelector('[data-close-overlay]');
      if (focusTarget) focusTarget.focus();
    }

    document.addEventListener('click', function (e) {
      var settingsTrigger = e.target.closest('[data-open-settings]');
      if (settingsTrigger) {
        e.preventDefault();
        openOverlay(settingsOverlay, settingsTrigger);
        return;
      }
      var authTrigger = e.target.closest('[data-open-auth]');
      if (authTrigger && authOverlay) {
        e.preventDefault();
        openOverlay(authOverlay, authTrigger);
        return;
      }
      if (e.target.closest('[data-close-overlay]')) {
        closeAllOverlays();
        return;
      }
      if (e.target === settingsOverlay || e.target === authOverlay) {
        closeAllOverlays();
        return;
      }

      var tabBtn = e.target.closest('[data-auth-mode]');
      if (tabBtn && authOverlay) {
        var mode = tabBtn.getAttribute('data-auth-mode');
        authOverlay.querySelectorAll('[data-auth-mode]').forEach(function (t) {
          var isAct = t === tabBtn;
          t.classList.toggle('is-active', isAct);
          t.setAttribute('aria-selected', isAct ? 'true' : 'false');
        });
        if (authCompanyWrap) {
          authCompanyWrap.hidden = mode !== 'register';
        }
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        closeAllOverlays();
      }
    });

    if (authForm) {
      authForm.addEventListener('submit', function (e) {
        e.preventDefault();
        closeAllOverlays();
      });
    }

    applyTheme(currentTheme);
    applyLang(currentLang);
  }

  /* ========================================================================
     Mobile Navigation Drawer
     ======================================================================== */

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
      setOpen(!nav.classList.contains('is-open'));
    });

    nav.querySelectorAll('a, button').forEach(function (item) {
      item.addEventListener('click', function () {
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
      if (window.innerWidth >= 980 && nav.classList.contains('is-open')) {
        setOpen(false);
      }
    });
  }

  /* ========================================================================
     Hero Architecture Switcher & Home Portal Showcase Tabs
     ======================================================================== */

  function initHeroSwitcher() {
    var container = document.getElementById('hero-switcher');
    if (!container) return;

    var imgEl = document.getElementById('hero-showcase-img');
    var capTitle = document.getElementById('hero-cap-title');
    var capSub = document.getElementById('hero-cap-sub');
    var panelTitle = document.getElementById('hero-panel-title');
    var panelDesc = document.getElementById('hero-panel-desc');
    var panelVal = document.getElementById('hero-panel-val');
    var panelUnit = document.getElementById('hero-panel-unit');

    var presets = {
      studio: {
        img: BASE_PREFIX + 'assets/images/hero-studio.jpg',
        capTitle: 'Инженерный центр Sam Soft Line',
        capSub: 'Комплексная разработка и внедрение в Самарканде',
        title: 'Единый подрядчик для всего IT-контура',
        desc: '1С, веб-порталы, мобильные приложения и поддержка серверов.',
        val: '25+ лет',
        unit: 'на рынке Узбекистана'
      },
      '1c': {
        img: BASE_PREFIX + 'assets/images/service-1c.jpg',
        capTitle: '1С и складская автоматизация',
        capSub: 'Партионный учёт, ТСД и маркировка без простоев',
        title: 'Точность остатков и скорость ревизии',
        desc: 'Синхронизация складов, касс и бухгалтерии в реальном времени.',
        val: '×3,2',
        unit: 'быстрее инвентаризация'
      },
      portal: {
        img: BASE_PREFIX + 'assets/images/service-web.jpg',
        capTitle: 'B2B-порталы и личные кабинеты',
        capSub: 'Прямой обмен ценами, резервами и заказами с 1С',
        title: 'Онлайн-заказы дилеров без звонков',
        desc: 'Персональные прайсы, история отгрузок и мгновенный резерв.',
        val: '4 мин',
        unit: 'оформление заявки'
      },
      mobile: {
        img: BASE_PREFIX + 'assets/images/service-mobile.jpg',
        capTitle: 'Мобильные приложения Android / iOS',
        capSub: 'Офлайн-работа для курьеров, торговых и логистики',
        title: 'Полевая работа без потери накладных',
        desc: 'Маршрутные листы, фотоподтверждение и GPS-трекинг рейсов.',
        val: '100%',
        unit: 'контроль доставки'
      },
      infra: {
        img: BASE_PREFIX + 'assets/images/service-infra.jpg',
        capTitle: 'Серверы, сети и SLA-поддержка',
        capSub: 'Резервное копирование, VPN и защита корпоративных баз',
        title: 'Стабильная работа офиса и филиалов',
        desc: 'Мониторинг серверов 24/7 и выезд инженеров по регламенту.',
        val: '99,8%',
        unit: 'доступность систем'
      }
    };

    var tabs = container.querySelectorAll('[data-hero-tab]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-hero-tab');
        var data = presets[key];
        if (!data) return;

        tabs.forEach(function (t) {
          var active = t === tab;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        if (imgEl) imgEl.src = data.img;
        if (capTitle) capTitle.textContent = data.capTitle;
        if (capSub) capSub.textContent = data.capSub;
        if (panelTitle) panelTitle.textContent = data.title;
        if (panelDesc) panelDesc.textContent = data.desc;
        if (panelVal) panelVal.textContent = data.val;
        if (panelUnit) panelUnit.textContent = data.unit;
      });
    });
  }

  /* ========================================================================
     Copy Phone, Lead Form, Review Carousel & Project Filters
     ======================================================================== */

  function initCopyButtons() {
    document.querySelectorAll('[data-copy-phone]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var phone = cfg.phoneDisplay || '+998 91 824 95 50';
        var labelEl = btn.querySelector('[data-copy-label]') || btn;
        var original = labelEl.textContent;

        function markCopied() {
          labelEl.textContent = 'Скопировано';
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

    if (nameInput) nameInput.addEventListener('input', function () { clearFieldError(nameInput, errName); });
    if (phoneInput) phoneInput.addEventListener('input', function () { clearFieldError(phoneInput, errPhone); });
    if (consentInput) consentInput.addEventListener('change', function () { clearFieldError(consentInput, errConsent); });

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
      if (successBox) successBox.hidden = false;
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

  /* ========================================================================
     Motion Polish: Staggered Reveal, Animated Counters & Spotlight
     ======================================================================== */

  function initRevealAndMotion() {
    var els = document.querySelectorAll('.reveal');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (els.length) {
      els.forEach(function (el, idx) {
        el.style.setProperty('--reveal-delay', ((idx % 4) * 55) + 'ms');
      });

      if (reduced || !('IntersectionObserver' in window)) {
        els.forEach(function (el) {
          el.classList.add('is-visible');
        });
      } else {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });

        els.forEach(function (el) {
          observer.observe(el);
        });
      }
    }

    if (!reduced && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      document.querySelectorAll('.service-card, .case-card, .tech-card').forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          var rect = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
          card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
        });
      });
    }
  }

  function initCounters() {
    var counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    function animateValue(el) {
      var target = Number(el.getAttribute('data-count-to'));
      var suffix = el.getAttribute('data-count-suffix') || '';
      var spacer = el.getAttribute('data-count-space') === 'true';
      if (!target || isNaN(target)) return;

      var startTime = performance.now();
      var duration = 900;

      function tick(now) {
        var progress = Math.min(1, (now - startTime) / duration);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = Math.round(target * eased);
        var formatted = spacer ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(val);
        el.textContent = formatted + suffix;
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      }
      requestAnimationFrame(tick);
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    counters.forEach(function (el) {
      obs.observe(el);
    });
  }

  function initProcessSteps() {
    var steps = document.querySelectorAll('.step-card[data-step-detail]');
    var output = document.getElementById('step-detail-output');
    if (!steps.length || !output) return;

    steps.forEach(function (card) {
      card.addEventListener('click', function () {
        steps.forEach(function (c) { c.classList.remove('is-active'); });
        card.classList.add('is-active');
        output.textContent = card.getAttribute('data-step-detail') || '';
      });
    });
  }

  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var hero = document.querySelector('.hero-section');
    var ticking = false;

    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      var limit = 8;
      if (hero && document.body.classList.contains('has-hero')) {
        limit = Math.max(8, hero.offsetHeight - header.offsetHeight - 4);
      }
      header.classList.toggle('is-scrolled', y > limit);
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  function initLogoFill() {
    var tiles = document.querySelectorAll('.tg-item');
    if (!tiles.length) return;
    function setOrigin(el, e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--x', (e.clientX - r.left) + 'px');
      el.style.setProperty('--y', (e.clientY - r.top) + 'px');
    }
    tiles.forEach(function (el) {
      el.addEventListener('mouseenter', function (e) { setOrigin(el, e); });
      el.addEventListener('mouseleave', function (e) { setOrigin(el, e); });
    });
  }

  var rotTimer = null;
  function initHeroRotator() {
    var el = document.querySelector('[data-hero-rot]');
    if (!el) return;
    var mark = document.querySelector('.hero-mark');
    var words = [], idx = 0;
    function load() {
      var dict = (i18n && (i18n[currentLang] || i18n.ru)) || {};
      words = String(dict['hero.words'] || el.textContent).split('|');
      idx = 0; el.textContent = words[0];
    }
    function pop() {
      if (!mark) return;
      mark.classList.remove('is-pop'); void mark.getBoundingClientRect(); mark.classList.add('is-pop');
    }
    function step() {
      el.classList.add('is-out');
      setTimeout(function () {
        idx = (idx + 1) % words.length;
        el.textContent = words[idx];
        el.classList.remove('is-out'); el.classList.add('is-in');
        void el.offsetWidth; el.classList.remove('is-in');
        pop();
      }, 450);
    }
    load();
    window.__heroRotReload = load;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    pop();
    if (rotTimer) clearInterval(rotTimer);
    rotTimer = setInterval(function () { if (!document.hidden) step(); }, 5200);
  }

  function brandify(root) {
    var re = /Sam Soft Line/;
    var skip = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, TITLE: 1, OPTION: 1 };
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || skip[p.nodeName] || !re.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (p.closest && (p.closest('.brand-name') || p.closest('svg') || p.closest('.brand-logo') || p.closest('.footer-brand'))) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      n.nodeValue.split('Sam Soft Line').forEach(function (part, i) {
        if (i) { var s = document.createElement('span'); s.className = 'brand-name'; s.textContent = 'Sam Soft Line'; frag.appendChild(s); }
        if (part) frag.appendChild(document.createTextNode(part));
      });
      n.parentNode.replaceChild(frag, n);
    });
  }

  function initServicesShowcase() {
    var items = document.querySelectorAll('.svc-item');
    if (!items.length) return;
    var shots = document.querySelectorAll('[data-svc-shot]');

    function setOpen(it, on) {
      it.classList.toggle('is-active', on);
      var b = it.querySelector('.svc-head');
      if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
    }

    function activate(key) {
      items.forEach(function (it) { setOpen(it, it.getAttribute('data-svc') === key); });
      shots.forEach(function (sh) {
        sh.classList.toggle('is-active', sh.getAttribute('data-svc-shot') === key);
      });
    }

    // Раскрытие только по клику (без hover): список не «прыгает» под курсором.
    // Повторный клик по открытому пункту сворачивает его, фото остаётся.
    items.forEach(function (it) {
      var key = it.getAttribute('data-svc');
      var head = it.querySelector('.svc-head');
      head.addEventListener('click', function () {
        if (it.classList.contains('is-active')) setOpen(it, false);
        else activate(key);
      });
    });

    // Один раз подсказываем анимацией, что пункты раскрываются
    var list = document.querySelector('.svc-list');
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (list && !reduced && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            setTimeout(function () { list.classList.add('is-hinted'); }, 450);
            io.disconnect();
          }
        });
      }, { threshold: 0.4 });
      io.observe(list);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    hydrateContacts();
    initPreferences();
    initStudioOverlays();
    initMobileNav();
    initLangSwitch();
    initServicesShowcase();
    initLogoFill();
    initHeroRotator();
    brandify();
    initHeaderScroll();
    initHeroSwitcher();
    initCopyButtons();
    initLeadForm();
    initReviewCarousel();
    initProjectFilters();
    initRevealAndMotion();
    initCounters();
    initProcessSteps();
  });
})();
