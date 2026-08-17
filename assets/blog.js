// fetchPostsIndex() lives in blog-data.js so both this page and the
// homepage teaser can share it.

let ALL_POSTS = [];
let ACTIVE_TAG = 'all';

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
        <p>${p.excerpt}</p>
        <div class="blog-meta"><span>${new Date(p.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &middot; ${p.readTime}</span><span>Read More →</span></div>
      </div>
    </a>
  `).join('');
}

(async function init() {
  // Old-style links (blog.html?post=slug) now redirect straight to the
  // real static page for that post, which has proper per-post SEO built in.
  const params = new URLSearchParams(window.location.search);
  const postSlug = params.get('post');
  if (postSlug) {
    window.location.replace(`blog/${postSlug}.html`);
    return;
  }

  const posts = await fetchPostsIndex();
  ALL_POSTS = posts || (typeof SAMPLE_POSTS !== 'undefined' ? SAMPLE_POSTS : []);

  renderFilter();
  renderListing();
})();
