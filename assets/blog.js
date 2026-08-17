// GITHUB_REPO, fetchPostsFromGitHub(), and parseFrontmatter() now live in
// blog-data.js so both this page and the homepage teaser can share them.

let ALL_POSTS = [];
let ACTIVE_TAG = 'all';

function excerptFrom(post) {
  return post.excerpt || post.body.replace(/[#*_>\-]/g, '').slice(0, 140).trim() + '…';
}

function renderFilter() {
  const el = document.getElementById('blogFilter');
  if (!el) return;
  const tags = ['all', ...new Set(ALL_POSTS.map(p => p.tag).filter(Boolean))];
  el.innerHTML = tags.map(t =>
    `<button data-tag="${t}" class="${t === ACTIVE_TAG ? 'active' : ''}">${t === 'all' ? 'All Posts' : t[0].toUpperCase() + t.slice(1)}</button>`
  ).join('');
  el.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      ACTIVE_TAG = btn.dataset.tag;
      renderFilter();
      renderListing();
    });
  });
}

function renderListing() {
  const grid = document.getElementById('blogListing');
  if (!grid) return;
  const posts = ACTIVE_TAG === 'all' ? ALL_POSTS : ALL_POSTS.filter(p => p.tag === ACTIVE_TAG);
  if (!posts.length) {
    grid.innerHTML = `<div class="empty-state">No posts yet in this category — check back soon.</div>`;
    return;
  }
  grid.innerHTML = posts.map(p => `
    <a class="blog-card" href="blog/${p.slug}.html">
      <div class="blog-thumb">${p.image ? `<img src="${p.image}" alt="" class="blog-thumb-photo">` : `<img src="assets/logo.png" alt="">`}</div>
      <div class="blog-body">
        <span class="blog-tag">${p.tag || 'update'}</span>
        <h3>${p.title}</h3>
        <p>${excerptFrom(p)}</p>
        <div class="blog-meta"><span>${new Date(p.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &middot; ${p.readTime}</span><span>Read More →</span></div>
      </div>
    </a>
  `).join('');
}

function renderPost(slug) {
  const post = ALL_POSTS.find(p => p.slug === slug);
  document.getElementById('listingView').style.display = 'none';
  document.getElementById('postView').style.display = 'block';
  if (!post) {
    document.getElementById('postBody').innerHTML = `<div class="empty-state">That post couldn't be found. <a href="blog.html">Back to all posts.</a></div>`;
    return;
  }
  document.getElementById('postTag').textContent = post.tag || 'update';
  document.getElementById('postTitle').textContent = post.title;
  document.getElementById('postDate').textContent = new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  document.getElementById('postRead').textContent = post.readTime;
  const imageEl = document.getElementById('postImage');
  if (imageEl) {
    if (post.image) {
      imageEl.src = post.image;
      imageEl.style.display = 'block';
    } else {
      imageEl.style.display = 'none';
    }
  }
  document.getElementById('postBody').innerHTML = (typeof marked !== 'undefined')
    ? marked.parse(post.body)
    : post.body.split('\n\n').map(p => `<p>${p}</p>`).join('');
  document.title = `${post.title} — The Gold Store Blog`;
}

(async function init() {
  const fromGitHub = await fetchPostsFromGitHub();
  ALL_POSTS = fromGitHub && fromGitHub.length ? fromGitHub : (typeof SAMPLE_POSTS !== 'undefined' ? SAMPLE_POSTS : []);

  const params = new URLSearchParams(window.location.search);
  const postSlug = params.get('post');
  if (postSlug) {
    renderPost(postSlug);
  } else {
    renderFilter();
    renderListing();
  }
})();
