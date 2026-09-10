// Utility Functions & Common App State

const TOKEN_KEY = 'socialsphere_token';
const USER_KEY = 'socialsphere_user';

// Get Current Token
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Get Logged In User Data
function getCurrentUser() {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

// Save Session
function setSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Clear Session & Logout
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Global Auth Fetch Wrapper
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 && !url.includes('/api/auth/login')) {
        // Token expired or invalid
        clearSession();
        if (window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
          showToast('Session expired. Please log in again.', 'error');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1200);
        }
      }
      throw new Error(data.error || 'An unexpected error occurred.');
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('alert-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'alert-container';
    container.className = 'alert-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `alert-toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Relative Date Formatter
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Render Header & Dynamic Navigation
function renderNavbar() {
  const navContainer = document.getElementById('navbar-actions');
  if (!navContainer) return;

  const currentUser = getCurrentUser();

  if (currentUser) {
    navContainer.innerHTML = `
      <a href="index.html" class="nav-btn ${window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ? 'active' : ''}">
        🏠 Home
      </a>
      <a href="profile.html?id=${currentUser.id}" class="user-profile-menu nav-btn ${window.location.pathname.endsWith('profile.html') ? 'active' : ''}">
        <img src="${currentUser.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.full_name)}" alt="${currentUser.full_name}" class="nav-avatar" />
        <span>${currentUser.full_name.split(' ')[0]}</span>
      </a>
      <button id="logout-btn" class="nav-btn btn-danger-outline" title="Logout">
        🚪 Logout
      </button>
    `;

    document.getElementById('logout-btn').addEventListener('click', async () => {
      try {
        await authFetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        // ignore error on logout
      }
      clearSession();
      showToast('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 800);
    });
  } else {
    navContainer.innerHTML = `
      <a href="login.html" class="nav-btn btn-outline">Log In</a>
      <a href="register.html" class="nav-btn btn-primary">Sign Up</a>
    `;
  }

  // Setup Search Input Listener
  setupSearch();
}

// User Discovery & Live Search
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  if (!searchInput || !searchResults) return;

  let debounceTimer;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 1) {
      searchResults.classList.remove('active');
      searchResults.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const data = await authFetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        if (data.users && data.users.length > 0) {
          searchResults.innerHTML = data.users.map(user => `
            <a href="profile.html?id=${user.id}" class="search-item">
              <img src="${user.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.full_name)}" alt="${user.full_name}" class="avatar-sm" />
              <div>
                <div class="user-name-small">${user.full_name}</div>
                <div class="user-handle-small">@${user.username}</div>
              </div>
            </a>
          `).join('');
          searchResults.classList.add('active');
        } else {
          searchResults.innerHTML = `<div class="search-item" style="color: var(--text-muted);">No users found</div>`;
          searchResults.classList.add('active');
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);
  });

  // Hide search dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});
