(function (root) {
  'use strict';

  function extractUzDigits(raw) {
    var digits = String(raw || '').replace(/\D/g, '');
    if (digits.indexOf('998') === 0) {
      digits = digits.slice(3);
    }
    return digits.slice(0, 9);
  }

  function formatUzPhone(raw) {
    var d = extractUzDigits(raw);
    if (!d.length) return '';
    var parts = ['+998'];
    if (d.length > 0) parts.push(' ' + d.slice(0, 2));
    if (d.length > 2) parts.push(' ' + d.slice(2, 5));
    if (d.length > 5) parts.push(' ' + d.slice(5, 7));
    if (d.length > 7) parts.push(' ' + d.slice(7, 9));
    return parts.join('');
  }

  function validateUzPhone(raw) {
    var digits = String(raw || '').replace(/\D/g, '');
    if (digits.indexOf('998') === 0) {
      digits = digits.slice(3);
    }
    return digits.length === 9;
  }

  function validateLeadForm(payload) {
    var name = String((payload && payload.name) || '').trim();
    var phone = String((payload && payload.phone) || '').trim();
    var consent = Boolean(payload && payload.consent);

    var errors = {
      name: name.length < 2 ? 'Укажите имя (минимум 2 символа).' : '',
      phone: !validateUzPhone(phone) ? 'Введите корректный номер: +998 и 9 цифр.' : '',
      consent: !consent ? 'Необходимо согласие на обработку персональных данных.' : ''
    };

    return {
      valid: !errors.name && !errors.phone && !errors.consent,
      errors: errors
    };
  }

  function getCarouselPageSize(viewportWidth) {
    if (viewportWidth >= 1024) return 3;
    if (viewportWidth >= 680) return 2;
    return 1;
  }

  function clampCarouselIndex(index, totalItems, pageSize) {
    var maxIndex = Math.max(0, totalItems - pageSize);
    if (index < 0) return 0;
    if (index > maxIndex) return maxIndex;
    return index;
  }

  var api = {
    extractUzDigits: extractUzDigits,
    formatUzPhone: formatUzPhone,
    validateUzPhone: validateUzPhone,
    validateLeadForm: validateLeadForm,
    getCarouselPageSize: getCarouselPageSize,
    clampCarouselIndex: clampCarouselIndex
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SSLValidators = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
