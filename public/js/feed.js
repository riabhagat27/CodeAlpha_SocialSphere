// Social Feed & Post Interactions JS

document.addEventListener('DOMContentLoaded', () => {
  const createPostCard = document.getElementById('create-post-card');
  const feedContainer = document.getElementById('feed-container');
  const suggestedUsersContainer = document.getElementById('suggested-users');

  // Check login state for post creation box
  const currentUser = getCurrentUser();
  if (currentUser && createPostCard) {
    createPostCard.style.display = 'block';
    setupPostCreation();
  } else if (createPostCard) {
    createPostCard.innerHTML = `
      <div style="text-align: center; padding: 0.5rem;">
        <p style="color: var(--text-muted); margin-bottom: 0.75rem;">Join SocialSphere to share posts, like, comment, and follow friends!</p>
        <a href="login.html" class="nav-btn btn-primary">Log In to Post</a>
      </div>
    `;
  }

  // Load feed posts
  loadPosts();

  // Load suggested users in sidebar
  if (suggestedUsersContainer) {
    loadSuggestedUsers();
  }
});

// Setup Post Creation Box
function setupPostCreation() {
  const postForm = document.getElementById('create-post-form');
  const toggleImageBtn = document.getElementById('toggle-image-btn');
  const imageInputContainer = document.getElementById('image-input-container');

  if (toggleImageBtn) {
    toggleImageBtn.addEventListener('click', () => {
      imageInputContainer.classList.toggle('active');
    });
  }

  if (postForm) {
    postForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const contentInput = document.getElementById('post-content-input');
      const imageInput = document.getElementById('post-image-input');
      const submitBtn = document.getElementById('create-post-btn');

      const content = contentInput.value.trim();
      const imageUrl = imageInput ? imageInput.value.trim() : '';

      if (!content) {
        showToast('Please enter some text for your post.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Posting...';

        const data = await authFetch('/api/posts', {
          method: 'POST',
          body: JSON.stringify({ content, image_url: imageUrl })
        });

        showToast('Post created successfully!', 'success');

        // Clear input
        contentInput.value = '';
        if (imageInput) imageInput.value = '';
        if (imageInputContainer) imageInputContainer.classList.remove('active');

        // Prepend new post to feed
        const feedContainer = document.getElementById('feed-container');
        const emptyState = feedContainer.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const postHtml = createPostCardHTML(data.post);
        feedContainer.insertAdjacentHTML('afterbegin', postHtml);
        attachPostEventListeners(data.post.id);

      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Publish Post';
      }
    });
  }
}

// Fetch and render feed posts
async function loadPosts() {
  const feedContainer = document.getElementById('feed-container');
  if (!feedContainer) return;

  try {
    feedContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading social feed...</div>';

    const data = await authFetch('/api/posts');

    if (!data.posts || data.posts.length === 0) {
      feedContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>No posts yet</h3>
          <p>Be the first person to share a post on SocialSphere!</p>
        </div>
      `;
      return;
    }

    feedContainer.innerHTML = data.posts.map(post => createPostCardHTML(post)).join('');

    // Attach event listeners to all loaded post cards
    data.posts.forEach(post => attachPostEventListeners(post.id));

  } catch (err) {
    console.error(err);
    feedContainer.innerHTML = '<div class="empty-state">Failed to load posts. Please refresh the page.</div>';
  }
}

// Generate Post Card HTML
function createPostCardHTML(post) {
  const currentUser = getCurrentUser();
  const isLiked = post.is_liked;
  const isOwner = post.is_owner || (currentUser && currentUser.id === post.user_id);

  return `
    <article class="post-card" id="post-${post.id}">
      <header class="post-header">
        <div class="post-author">
          <a href="profile.html?id=${post.user_id}">
            <img src="${post.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(post.full_name)}" alt="${post.full_name}" class="avatar-md" />
          </a>
          <div>
            <a href="profile.html?id=${post.user_id}" class="author-name">${post.full_name}</a>
            <div class="author-username">@${post.username}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span class="post-time">${formatDate(post.created_at)}</span>
          ${isOwner ? `<button class="delete-post-btn btn-danger-outline" data-id="${post.id}" title="Delete Post">🗑️</button>` : ''}
        </div>
      </header>

      <div class="post-content">${escapeHTML(post.content)}</div>

      ${post.image_url ? `
        <div class="post-media">
          <img src="${post.image_url}" alt="Post image" onerror="this.parentElement.style.display='none'" />
        </div>
      ` : ''}

      <div class="post-stats">
        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" id="like-btn-${post.id}" data-id="${post.id}">
          <span class="heart-icon">${isLiked ? '❤️' : '🤍'}</span>
          <span class="like-count" id="like-count-${post.id}">${post.like_count || 0}</span>
        </button>

        <button class="action-btn comment-toggle-btn" id="comment-toggle-${post.id}" data-id="${post.id}">
          <span>💬</span>
          <span class="comment-count" id="comment-count-${post.id}">${post.comment_count || 0}</span>
        </button>
      </div>

      <!-- Comments Section -->
      <section class="comments-section" id="comments-section-${post.id}">
        <div class="comments-list" id="comments-list-${post.id}">
          <div style="font-size: 0.8rem; color: var(--text-light);">Loading comments...</div>
        </div>

        ${currentUser ? `
          <form class="add-comment-box" id="comment-form-${post.id}" data-id="${post.id}">
            <input type="text" class="comment-input" id="comment-input-${post.id}" placeholder="Write a comment..." required />
            <button type="submit" class="btn-primary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem;">Send</button>
          </form>
        ` : `
          <div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-top: 0.5rem;">
            <a href="login.html">Log in</a> to join the conversation.
          </div>
        `}
      </section>
    </article>
  `;
}

// Escape HTML for security
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Attach Like, Comment, and Delete Listeners
function attachPostEventListeners(postId) {
  const postElement = document.getElementById(`post-${postId}`);
  if (!postElement) return;

  // LIKE / UNLIKE BUTTON
  const likeBtn = document.getElementById(`like-btn-${postId}`);
  if (likeBtn) {
    likeBtn.addEventListener('click', async () => {
      if (!getToken()) {
        showToast('Please log in to like posts.', 'error');
        return;
      }

      const isCurrentlyLiked = likeBtn.classList.contains('liked');
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';

      try {
        const data = await authFetch(`/api/posts/${postId}/like`, { method });
        const likeCountSpan = document.getElementById(`like-count-${postId}`);

        if (data.liked) {
          likeBtn.classList.add('liked');
          likeBtn.querySelector('.heart-icon').innerText = '❤️';
        } else {
          likeBtn.classList.remove('liked');
          likeBtn.querySelector('.heart-icon').innerText = '🤍';
        }

        if (likeCountSpan) {
          likeCountSpan.innerText = data.like_count;
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // DELETE POST BUTTON
  const deleteBtn = postElement.querySelector('.delete-post-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete this post?')) {
        try {
          await authFetch(`/api/posts/${postId}`, { method: 'DELETE' });
          showToast('Post deleted successfully.', 'success');
          postElement.remove();

          const feedContainer = document.getElementById('feed-container');
          if (feedContainer && feedContainer.children.length === 0) {
            feedContainer.innerHTML = `
              <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No posts yet</h3>
              </div>
            `;
          }
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
  }

  // COMMENT TOGGLE & FETCH
  const commentToggleBtn = document.getElementById(`comment-toggle-${postId}`);
  const commentsSection = document.getElementById(`comments-section-${postId}`);
  let commentsLoaded = false;

  if (commentToggleBtn && commentsSection) {
    commentToggleBtn.addEventListener('click', async () => {
      commentsSection.classList.toggle('active');
      if (commentsSection.classList.contains('active') && !commentsLoaded) {
        await loadComments(postId);
        commentsLoaded = true;
      }
    });
  }

  // ADD COMMENT FORM
  const commentForm = document.getElementById(`comment-form-${postId}`);
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById(`comment-input-${postId}`);
      const content = input.value.trim();

      if (!content) return;

      try {
        const data = await authFetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ content })
        });

        input.value = '';
        showToast('Comment added!', 'success');

        // Update comment count
        const commentCountSpan = document.getElementById(`comment-count-${postId}`);
        if (commentCountSpan) {
          commentCountSpan.innerText = data.comment_count;
        }

        // Render newly added comment
        const commentsList = document.getElementById(`comments-list-${postId}`);
        const emptyMsg = commentsList.querySelector('div');
        if (emptyMsg && (emptyMsg.innerText.includes('No comments') || emptyMsg.innerText.includes('Loading'))) {
          commentsList.innerHTML = '';
        }

        commentsList.insertAdjacentHTML('beforeend', createCommentHTML(data.comment));
        attachCommentDeleteListener(data.comment.id, postId);

      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

// Load Comments for Post
async function loadComments(postId) {
  const commentsList = document.getElementById(`comments-list-${postId}`);
  if (!commentsList) return;

  try {
    const data = await authFetch(`/api/posts/${postId}/comments`);

    if (!data.comments || data.comments.length === 0) {
      commentsList.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.4rem;">No comments yet. Start the conversation!</div>';
      return;
    }

    commentsList.innerHTML = data.comments.map(c => createCommentHTML(c)).join('');
    data.comments.forEach(c => attachCommentDeleteListener(c.id, postId));

  } catch (err) {
    commentsList.innerHTML = '<div style="font-size: 0.8rem; color: var(--danger-color);">Failed to load comments.</div>';
  }
}

// Generate Comment HTML
function createCommentHTML(comment) {
  return `
    <div class="comment-item" id="comment-${comment.id}">
      <a href="profile.html?id=${comment.user_id}">
        <img src="${comment.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(comment.full_name)}" class="avatar-sm" alt="${comment.full_name}" />
      </a>
      <div class="comment-body">
        <div class="comment-header">
          <a href="profile.html?id=${comment.user_id}" class="comment-user">${comment.full_name}</a>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span class="comment-time">${formatDate(comment.created_at)}</span>
            ${comment.is_owner ? `<button class="delete-comment-btn" data-id="${comment.id}" style="color: var(--danger-color); font-size: 0.75rem;" title="Delete Comment">✕</button>` : ''}
          </div>
        </div>
        <div class="comment-text">${escapeHTML(comment.content)}</div>
      </div>
    </div>
  `;
}

// Delete Comment Listener
function attachCommentDeleteListener(commentId, postId) {
  const commentElem = document.getElementById(`comment-${commentId}`);
  if (!commentElem) return;

  const deleteBtn = commentElem.querySelector('.delete-comment-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      try {
        const data = await authFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
        showToast('Comment deleted.', 'success');
        commentElem.remove();

        const commentCountSpan = document.getElementById(`comment-count-${postId}`);
        if (commentCountSpan) {
          commentCountSpan.innerText = data.comment_count;
        }

        const commentsList = document.getElementById(`comments-list-${postId}`);
        if (commentsList && commentsList.children.length === 0) {
          commentsList.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.4rem;">No comments yet.</div>';
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

// Suggested Users Widget in Sidebar
async function loadSuggestedUsers() {
  const container = document.getElementById('suggested-users');
  if (!container) return;

  try {
    const currentUser = getCurrentUser();
    const data = await authFetch('/api/users/search?q=a');

    const filteredUsers = (data.users || [])
      .filter(u => !currentUser || u.id !== currentUser.id)
      .slice(0, 3);

    if (filteredUsers.length === 0) {
      container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted);">No suggestions right now.</div>';
      return;
    }

    container.innerHTML = filteredUsers.map(u => `
      <div class="user-mini-card">
        <div class="user-mini-info">
          <a href="profile.html?id=${u.id}">
            <img src="${u.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.full_name)}" class="avatar-sm" alt="${u.full_name}" />
          </a>
          <div>
            <a href="profile.html?id=${u.id}" class="user-name-small">${u.full_name}</a>
            <div class="user-handle-small">@${u.username}</div>
          </div>
        </div>
        <a href="profile.html?id=${u.id}" class="btn-outline" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">View</a>
      </div>
    `).join('');

  } catch (err) {
    console.error(err);
  }
}
