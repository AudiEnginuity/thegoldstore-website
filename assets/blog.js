// ---------------------------------------------------------------
// Once you connect the CMS to a GitHub repo (see SETUP.md), set
// GITHUB_REPO below (e.g. "yourusername/thegoldstore") and posts
// published from /admin will appear here automatically — no
// rebuild or redeploy step needed.
// ---------------------------------------------------------------
const GITHUB_REPO = "AudiEnginuity/thegoldstore-website";
const POSTS_PATH = "content/blog";

async function fetchPostsFromGitHub() {
  if (!GITHUB_REPO) return null;
  try {
    const listRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${POSTS_PATH}`);
    if (!listRes.ok) return null;
    const files = await listRes.json();
    const mdFiles = files.filter(f => f.name.endsWith('.md'));
    const posts = await Promise.all(mdFiles.map(async f => {
      const raw = await (await fetch(f.download_url)).text();
      return parseFrontmatter(raw, f.name.replace(/\.md$/, ''));
    }));
    return posts.filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (e) {
    return null;
  }
}

// Minimal frontmatter parser for:
// ---
// title: "..."
// date: 2026-01-01
// tag: gold
// excerpt: "..."
// ---
// body markdown...
function parseFrontmatter(raw, slug) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  const [, fm, body] = match;
  const data = { slug, body: body.trim() };
  fm.split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    val = val.replace(/^["']|["']$/g, '');
    data[key] = val;
  });
  data.readTime = data.readTime || Math.max(1, Math.round(body.split(/\s+/).length / 200)) + ' min';
  return data;
}

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
    <a class="blog-card" href="blog.html?post=${p.slug}">
      <div class="blog-thumb"><img src="assets/logo.png" alt=""></div>
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
