// contact.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const formData = new FormData(form);
    const payload = {
      fname: formData.get('fname'),
      lname: formData.get('lname'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    };

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {}

    // Show success after delay
    setTimeout(() => {
      form.style.display = 'none';
      if (success) success.style.display = 'block';
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1000);
  });
});
