// Profile View & Edit Profile JS

document.addEventListener('DOMContentLoaded', () => {
  const profileContainer = document.getElementById('profile-card-container');
  const userPostsContainer = document.getElementById('user-posts-container');
  const editProfileForm = document.getElementById('edit-profile-form');

  // VIEW PROFILE PAGE
  if (profileContainer && userPostsContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    let targetUserId = urlParams.get('id');
    const currentUser = getCurrentUser();

    if (!targetUserId && currentUser) {
      targetUserId = currentUser.id;
    } else if (!targetUserId && !currentUser) {
      window.location.href = 'login.html';
      return;
    }

    loadProfile(targetUserId);
    loadUserPosts(targetUserId);
  }

  // EDIT PROFILE PAGE
  if (editProfileForm) {
    setupEditProfilePage();
  }
});

// Fetch and render User Profile Info
async function loadProfile(userId) {
  const profileContainer = document.getElementById('profile-card-container');
  if (!profileContainer) return;

  try {
    const data = await authFetch(`/api/users/${userId}`);
    const user = data.user;
    const currentUser = getCurrentUser();

    document.title = `${user.full_name} (@${user.username}) - SocialSphere`;

    profileContainer.innerHTML = `
      <div class="profile-card">
        <div class="profile-banner"></div>
        <div class="profile-header-body">
          <div class="profile-avatar-wrapper">
            <img src="${user.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.full_name)}" alt="${user.full_name}" class="profile-avatar" />
            <div id="profile-action-container">
              ${user.is_self ? `
                <a href="edit-profile.html" class="btn-outline">✏️ Edit Profile</a>
              ` : currentUser ? `
                <button id="follow-btn" class="btn-primary ${user.is_following ? 'btn-outline' : ''}" style="${user.is_following ? 'border-color: var(--border-color); color: var(--text-main);' : ''}">
                  ${user.is_following ? '✓ Following' : '+ Follow'}
                </button>
              ` : `
                <a href="login.html" class="btn-primary">Log In to Follow</a>
              `}
            </div>
          </div>

          <div class="profile-details">
            <h1 class="profile-name">${user.full_name}</h1>
            <div class="profile-username">@${user.username}</div>
            <p class="profile-bio">${escapeHTML(user.bio || 'No bio available yet.')}</p>
          </div>

          <div class="profile-stats-row">
            <div class="stat-item">
              <span class="stat-num" id="stat-posts">${user.posts_count}</span>
              <span class="stat-label">Posts</span>
            </div>
            <div class="stat-item">
              <span class="stat-num" id="stat-followers">${user.followers_count}</span>
              <span class="stat-label">Followers</span>
            </div>
            <div class="stat-item">
              <span class="stat-num" id="stat-following">${user.following_count}</span>
              <span class="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Setup Follow Button listener if viewing another user's profile
    if (!user.is_self && currentUser) {
      const followBtn = document.getElementById('follow-btn');
      if (followBtn) {
        followBtn.addEventListener('click', async () => {
          const isFollowing = followBtn.innerText.includes('Following');
          const method = isFollowing ? 'DELETE' : 'POST';

          try {
            followBtn.disabled = true;
            const res = await authFetch(`/api/users/${userId}/follow`, { method });

            document.getElementById('stat-followers').innerText = res.followers_count;

            if (res.is_following) {
              followBtn.className = 'btn-outline';
              followBtn.innerText = '✓ Following';
              showToast(`You are now following ${user.full_name}`, 'success');
            } else {
              followBtn.className = 'btn-primary';
              followBtn.innerText = '+ Follow';
              showToast(`Unfollowed ${user.full_name}`, 'info');
            }
          } catch (err) {
            showToast(err.message, 'error');
          } finally {
            followBtn.disabled = false;
          }
        });
      }
    }

  } catch (err) {
    console.error(err);
    profileContainer.innerHTML = '<div class="empty-state">User profile not found.</div>';
  }
}

// Fetch and render User's Posts
async function loadUserPosts(userId) {
  const userPostsContainer = document.getElementById('user-posts-container');
  if (!userPostsContainer) return;

  try {
    userPostsContainer.innerHTML = '<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Loading user posts...</div>';

    const data = await authFetch(`/api/posts?user_id=${userId}`);

    if (!data.posts || data.posts.length === 0) {
      userPostsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📷</div>
          <h3>No posts published yet</h3>
        </div>
      `;
      return;
    }

    userPostsContainer.innerHTML = data.posts.map(post => createPostCardHTML(post)).join('');
    data.posts.forEach(post => attachPostEventListeners(post.id));

  } catch (err) {
    userPostsContainer.innerHTML = '<div class="empty-state">Failed to load posts.</div>';
  }
}

// Pre-fill and submit Edit Profile Page
async function setupEditProfilePage() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const fullNameInput = document.getElementById('edit-fullname');
  const bioInput = document.getElementById('edit-bio');
  const imageInput = document.getElementById('edit-image');
  const form = document.getElementById('edit-profile-form');
  const submitBtn = document.getElementById('edit-submit-btn');

  // Pre-fill user data
  try {
    const data = await authFetch(`/api/users/${currentUser.id}`);
    const user = data.user;

    fullNameInput.value = user.full_name || '';
    bioInput.value = user.bio || '';
    imageInput.value = user.profile_image || '';
  } catch (e) {
    showToast('Failed to load profile details for editing.', 'error');
  }

  // Handle Edit Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = fullNameInput.value.trim();
    const bio = bioInput.value.trim();
    const image = imageInput.value.trim();

    if (!fullName) {
      showToast('Full name is required.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Saving changes...';

      const data = await authFetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          bio: bio,
          profile_image: image
        })
      });

      // Update stored user details in localStorage
      const updatedUser = {
        ...currentUser,
        full_name: data.user.full_name,
        bio: data.user.bio,
        profile_image: data.user.profile_image
      };
      localStorage.setItem('socialsphere_user', JSON.stringify(updatedUser));

      showToast('Profile updated successfully!', 'success');

      setTimeout(() => {
        window.location.href = `profile.html?id=${currentUser.id}`;
      }, 900);

    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Changes';
    }
  });
}
