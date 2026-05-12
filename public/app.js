/**
 * DevFeed — Frontend JavaScript
 *
 * This file runs IN THE BROWSER, not in Node.js.
 * It uses fetch() to communicate with your Express API.
 *
 * Flow:
 *   User types → clicks "SHIP IT" → fetch POST /posts
 *   → Express saves it → fetch GET /posts
 *   → We render the updated feed
 */

// ─── STATE ────────────────────────────────────────────────
// Simple in-memory state for tracking liked posts
const likedPosts = new Set();

// ─── ON PAGE LOAD ─────────────────────────────────────────
// As soon as the page loads, fetch existing posts from the API
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  setupCharCounter();
});

// ─── CHARACTER COUNTER ────────────────────────────────────
function setupCharCounter() {
  const input = document.getElementById('postInput');
  const counter = document.getElementById('charCount');
  const counterWrapper = counter.closest('.char-count');

  input.addEventListener('input', () => {
    const len = input.value.length;
    counter.textContent = len;

    // Visual warning as you approach the limit
    counterWrapper.classList.remove('warn', 'over');
    if (len > 250) counterWrapper.classList.add('over');
    else if (len > 200) counterWrapper.classList.add('warn');
  });

  // Allow Ctrl+Enter or Cmd+Enter to submit
  input.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      submitPost();
    }
  });
}

// ─── LOAD POSTS (GET /posts) ───────────────────────────────
/**
 * Calls GET /posts on your Express API.
 * Express reads from data/posts.js and returns JSON.
 * We then render each post into the feed.
 */
async function loadPosts() {
  showLoading(true);

  try {
    // fetch() is built into modern browsers
    // It makes an HTTP request to your Express server
    const response = await fetch('/posts');

    // If the server returned an error status (4xx, 5xx)
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Parse the JSON body that Express sends back
    const posts = await response.json();

    renderFeed(posts);

  } catch (err) {
    // Network error or server down
    showToast('Failed to load posts. Is the server running?', 'error');
    console.error('loadPosts error:', err);

  } finally {
    showLoading(false);
  }
}

// ─── SUBMIT POST (POST /posts) ─────────────────────────────
/**
 * Reads the textarea value, sends it to POST /posts.
 * Express receives it, saves it, returns updated list.
 */
async function submitPost() {
  const input  = document.getElementById('postInput');
  const btn    = document.getElementById('postBtn');
  const content = input.value.trim();

  // Client-side validation — don't even hit the server if empty
  if (!content) {
    showToast('Write something first!', 'error');
    input.focus();
    return;
  }

  if (content.length > 280) {
    showToast('Post is too long (max 280 chars)', 'error');
    return;
  }

  // Disable button to prevent double-submit
  btn.disabled = true;
  btn.classList.add('loading');

  try {
    /**
     * POST /posts
     * We send JSON in the request body.
     * Express reads it via req.body.content (because of express.json() middleware)
     */
    const response = await fetch('/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'   // Tell Express we're sending JSON
      },
      body: JSON.stringify({ content })       // Convert JS object → JSON string
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // Clear the input
    input.value = '';
    document.getElementById('charCount').textContent = '0';

    // Re-render the feed with the new data from the server
    renderFeed(data.posts);

    showToast('Post shipped! 🚀', 'success');

  } catch (err) {
    showToast('Failed to post. Check the server.', 'error');
    console.error('submitPost error:', err);

  } finally {
    btn.disabled = false;
    btn.classList.remove('loading');
  }
}

// ─── CLEAR FEED (DELETE /posts) ────────────────────────────
async function clearFeed() {
  if (!confirm('Clear all posts? This cannot be undone.')) return;

  try {
    const response = await fetch('/posts', { method: 'DELETE' });
    if (!response.ok) throw new Error('Clear failed');

    renderFeed([]);
    showToast('Feed cleared', 'success');

  } catch (err) {
    showToast('Failed to clear feed', 'error');
  }
}

// ─── RENDER FEED ──────────────────────────────────────────
/**
 * Takes an array of post strings and builds HTML for each.
 * This runs entirely in the browser — pure DOM manipulation.
 */
function renderFeed(posts) {
  const container  = document.getElementById('feedContainer');
  const emptyState = document.getElementById('emptyState');
  const postCount  = document.getElementById('postCount');

  // Update post count
  postCount.textContent = `${posts.length} post${posts.length !== 1 ? 's' : ''}`;

  if (posts.length === 0) {
    emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');

  // Build HTML for each post (newest first)
  const postsHTML = [...posts].reverse().map((post, idx) => {
    const postIndex = posts.length - idx;          // Numbering for the badge
    const timeAgo   = formatTime(post.timestamp);  // Human-readable time
    const isLiked   = likedPosts.has(postIndex);

    return `
      <div class="post-card" data-index="${postIndex}">
        <div class="post-meta">
          <div class="post-avatar">DEV</div>
          <div class="post-author">
            <span class="post-username">@developer</span>
            <span class="post-time">${timeAgo}</span>
          </div>
          <span class="post-index">#${postIndex}</span>
        </div>

        <div class="post-content">${escapeHTML(post.content)}</div>

        <div class="post-footer">
          <button
            class="post-action ${isLiked ? 'liked' : ''}"
            onclick="toggleLike(${postIndex}, this)"
          >
            ${isLiked ? '♥' : '♡'} ${isLiked ? 'liked' : 'like'}
          </button>
          <button class="post-action" onclick="copyPost(this)" data-text="${escapeAttr(post.content)}">
            ⎘ copy
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = postsHTML.join('');
}

// ─── LIKE TOGGLE ──────────────────────────────────────────
function toggleLike(index, btn) {
  if (likedPosts.has(index)) {
    likedPosts.delete(index);
    btn.classList.remove('liked');
    btn.innerHTML = '♡ like';
  } else {
    likedPosts.add(index);
    btn.classList.add('liked');
    btn.innerHTML = '♥ liked';
  }
}

// ─── COPY POST ────────────────────────────────────────────
function copyPost(btn) {
  const text = btn.getAttribute('data-text');
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.innerHTML;
    btn.innerHTML = '✓ copied';
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  });
}

// ─── UTILITY: SHOW/HIDE LOADING ───────────────────────────
function showLoading(visible) {
  const el = document.getElementById('loadingState');
  el.classList.toggle('hidden', !visible);
}

// ─── UTILITY: TOAST NOTIFICATION ─────────────────────────
function showToast(message, type = 'success') {
  // Remove any existing toast
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : '✕'}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── UTILITY: FORMAT TIMESTAMP ────────────────────────────
function formatTime(timestamp) {
  if (!timestamp) return 'just now';

  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);

  if (seconds < 10)  return 'just now';
  if (seconds < 60)  return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── UTILITY: PREVENT XSS ─────────────────────────────────
/**
 * XSS = Cross-Site Scripting.
 * If a user posts "<script>alert('hacked')</script>",
 * we must NOT inject that raw HTML into the DOM.
 * escapeHTML converts < > & into safe HTML entities.
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
