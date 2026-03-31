const FORMS_ENDPOINT = 'https://formsubmit.co/ajax/info@zorka.agency';

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

    const submitBtn = form.querySelector('button[type="submit"]');
    const initialBtnText = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
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
      setStatus(form, 'Sent successfully.', false);
    } catch (error) {
      setStatus(form, 'Failed to send. Please try again.', true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = initialBtnText || 'Send';
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupRemoteForm('form-become', '12 UNDER 12 - Become one of 12');
  setupRemoteForm('form-contact', '12 UNDER 12 - Contact');
});
