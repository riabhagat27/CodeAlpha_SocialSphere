// Auth Page JS (Login & Registration)

document.addEventListener('DOMContentLoaded', () => {
  // LOGIN FORM HANDLER
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    // Redirect if already logged in
    if (getToken()) {
      window.location.href = 'index.html';
      return;
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const loginInput = document.getElementById('login-input').value.trim();
      const passwordInput = document.getElementById('password-input').value;
      const submitBtn = document.getElementById('login-submit-btn');

      if (!loginInput || !passwordInput) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Logging in...';

        const data = await authFetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ login: loginInput, password: passwordInput })
        });

        setSession(data.token, data.user);
        showToast('Login successful! Redirecting...', 'success');

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Log In';
      }
    });
  }

  // REGISTER FORM HANDLER
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    // Redirect if already logged in
    if (getToken()) {
      window.location.href = 'index.html';
      return;
    }

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullname-input').value.trim();
      const username = document.getElementById('username-input').value.trim();
      const email = document.getElementById('email-input').value.trim();
      const password = document.getElementById('password-input').value;
      const confirmPassword = document.getElementById('confirm-password-input').value;
      const submitBtn = document.getElementById('register-submit-btn');

      if (!fullName || !username || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      if (username.length < 3) {
        showToast('Username must be at least 3 characters.', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match. Please recheck.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating account...';

        const data = await authFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName,
            username: username,
            email: email,
            password: password
          })
        });

        setSession(data.token, data.user);
        showToast('Account created successfully!', 'success');

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create Account';
      }
    });
  }
});
