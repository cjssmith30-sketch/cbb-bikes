// manager-login.js

// Demo credentials — in production, this hits the backend API
const DEMO_CREDENTIALS = { username: 'manager', password: 'cbb2025' };

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (sessionStorage.getItem('cbb_manager_auth') === 'true') {
    window.location.href = 'manager-dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const pwToggle = document.getElementById('pwToggle');
  const pwInput = document.getElementById('loginPass');

  // Password visibility toggle
  pwToggle?.addEventListener('click', () => {
    const isText = pwInput.type === 'text';
    pwInput.type = isText ? 'password' : 'text';
    pwToggle.textContent = isText ? '👁' : '🙈';
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';

    const btnText = document.getElementById('loginBtnText');
    const spinner = document.getElementById('loginSpinner');
    btnText.style.display = 'none';
    spinner.style.display = 'inline';
    document.getElementById('loginBtn').disabled = true;

    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    // Try API first, fall back to demo
    let authenticated = false;

    try {
      const res = await fetch('/api/manager/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          sessionStorage.setItem('cbb_manager_auth', 'true');
          sessionStorage.setItem('cbb_manager_token', data.token);
          authenticated = true;
        }
      }
    } catch (err) {
      // API not available — use demo credentials
      if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
        sessionStorage.setItem('cbb_manager_auth', 'true');
        sessionStorage.setItem('cbb_manager_token', 'demo-token');
        authenticated = true;
      }
    }

    // Also accept demo credentials in dev mode regardless
    if (!authenticated && username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      sessionStorage.setItem('cbb_manager_auth', 'true');
      sessionStorage.setItem('cbb_manager_token', 'demo-token');
      authenticated = true;
    }

    setTimeout(() => {
      btnText.style.display = 'inline';
      spinner.style.display = 'none';
      document.getElementById('loginBtn').disabled = false;

      if (authenticated) {
        window.location.href = 'manager-dashboard.html';
      } else {
        errorBox.style.display = 'block';
        document.getElementById('loginPass').value = '';
      }
    }, 800);
  });
});
