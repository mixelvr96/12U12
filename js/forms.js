/**
 * Открывает почтовый клиент с заполненным письмом на info@zorka.agency.
 * Для продакшена лучше подключить Formspree / Netlify Forms / серверную отправку.
 */
function setupMailtoForm(formId, subject) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const fd = new FormData(form);
    const lines = [];
    fd.forEach((value, key) => {
      lines.push(key + ': ' + value);
    });
    const body = lines.join('\n\n');
    const mailto =
      'mailto:info@zorka.agency?subject=' +
      encodeURIComponent(subject) +
      '&body=' +
      encodeURIComponent(body);
    window.location.href = mailto;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupMailtoForm('form-become', '12 UNDER 12 — Become one of 12');
  setupMailtoForm('form-contact', '12 UNDER 12 — Contact');
});
