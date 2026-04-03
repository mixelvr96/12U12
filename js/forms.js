const FORMS_ENDPOINT = 'https://formsubmit.co/ajax/info@zorka.agency';

function getSubmitButtonLabel(btn) {
  if (!btn) return '';
  const label = btn.querySelector('.btn-submit__label');
  return (label ? label.textContent : btn.textContent).trim();
}

function setSubmitButtonLabel(btn, text) {
  if (!btn) return;
  const label = btn.querySelector('.btn-submit__label');
  if (label) {
    label.textContent = text;
  } else {
    btn.textContent = text;
  }
}

/**
 * Строгая проверка email: есть @, часть до и после @, в домене точка, зона ≥ 2 символов.
 * (Не полагаемся только на type="email" / checkValidity — ввод «просто текст» не проходит.)
 */
function isValidEmailAddress(value) {
  const s = String(value).trim();
  if (!s.includes('@')) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(s);
}

/** Все поля с required; пусто (trim) / неверный email или URL → невалидно */
function getInvalidRequiredFields(form) {
  const invalid = [];
  form.querySelectorAll('[required]').forEach((el) => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    const t = el.value.trim();
    if (t === '') {
      invalid.push(el);
      return;
    }
    if (el instanceof HTMLInputElement && el.type === 'email') {
      if (!isValidEmailAddress(t)) {
        invalid.push(el);
      }
      return;
    }
    if (!el.checkValidity()) {
      invalid.push(el);
    }
  });
  return invalid;
}

function flashInvalidFields(fields, form) {
  const isContact = Boolean(form.closest('.contact-form-envelope__panel'));
  const cls = isContact ? 'form-field--invalid-flash-contact' : 'form-field--invalid-flash';
  fields.forEach((field) => {
    field.classList.add(cls);
    const onEnd = () => {
      field.classList.remove(cls);
      field.removeEventListener('animationend', onEnd);
    };
    field.addEventListener('animationend', onEnd);
  });
  if (fields[0]) {
    fields[0].focus({ preventScroll: true });
    fields[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function upsertStatusNode(form) {
  let node = form.querySelector('.form-status');
  if (!node) {
    node = document.createElement('p');
    node.className = 'form-status';
    node.style.marginTop = '0.75rem';
    node.style.fontSize = '0.9rem';
    form.appendChild(node);
  }
  return node;
}

function setStatus(form, message, isError) {
  const node = upsertStatusNode(form);
  node.textContent = message;
  node.style.color = isError ? '#b21e35' : '#1f7a4a';
}

function setupRemoteForm(formId, subject) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const invalid = getInvalidRequiredFields(form);
    if (invalid.length > 0) {
      flashInvalidFields(invalid, form);
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const initialBtnText = getSubmitButtonLabel(submitBtn);

    if (submitBtn) {
      submitBtn.disabled = true;
      setSubmitButtonLabel(submitBtn, 'Sending...');
    }

    setStatus(form, '', false);

    const fd = new FormData(form);
    const payload = {
      _subject: subject,
      _captcha: 'false',
      _template: 'table',
      _webpage: window.location.href
    };

    fd.forEach((value, key) => {
      payload[key] = String(value);
    });

    let thankyouShown = false;

    try {
      const response = await fetch(FORMS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      form.reset();

      if (form.id === 'form-become') {
        const section = document.getElementById('become-form-section');
        const thank = document.getElementById('become-thankyou');
        if (section) section.hidden = true;
        if (thank) {
          thank.hidden = false;
          thank.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        thankyouShown = true;
      } else if (form.id === 'form-contact') {
        const section = document.getElementById('contact-form-section');
        const thank = document.getElementById('contact-thankyou');
        if (section) section.hidden = true;
        if (thank) {
          thank.hidden = false;
          thank.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        thankyouShown = true;
      } else {
        setStatus(form, 'Sent successfully.', false);
      }
    } catch (error) {
      setStatus(form, 'Failed to send. Please try again.', true);
    } finally {
      if (submitBtn && !thankyouShown) {
        submitBtn.disabled = false;
        setSubmitButtonLabel(submitBtn, initialBtnText || 'Send');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupRemoteForm('form-become', '12 UNDER 12 - Become one of 12');
  setupRemoteForm('form-contact', '12 UNDER 12 - Contact');
});
