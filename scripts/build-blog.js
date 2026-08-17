// scripts/build-blog.js
//
// Runs automatically on every Netlify deploy (see netlify.toml's build command).
// Reads every post in content/blog/*.md and generates a real, standalone static
// HTML page for it at /blog/<slug>.html - each with its own <title>, meta
// description, Open Graph tags, and Schema.org BlogPosting structured data.
//
// Why this matters: without this, every post shared the same generic
// blog.html page and title in search results and link previews. Real static
// pages with structured data are what Google's rich results and AI search
// engines (ChatGPT, Perplexity, Google AI Overviews) actually read to
// understand and cite content.
//
// No npm dependencies on purpose - this avoids the exact "dependency not
// installed" class of failure the price ticker function hit earlier.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'blog');
const OUTPUT_DIR = path.join(ROOT, 'blog');
const SITE_URL = 'https://www.thegoldstore.net';
const GA_ID = 'G-CZ5LGY4HMT';

// ---------- Frontmatter parsing (same format used by admin/config.yml) ----------
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
  return data;
}

// ---------- Minimal, dependency-free markdown -> HTML ----------
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function markdownToHtml(md) {
  const blocks = md.split(/\n\s*\n/);
  return blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    let m = block.match(/^(#{1,6})\s+(.*)$/);
    if (m) return `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
    if (/^[-*]\s+/.test(block)) {
      const items = block.split('\n').map(l => l.replace(/^[-*]\s+/, '').trim());
      return '<ul>' + items.map(i => `<li>${inline(i)}</li>`).join('') + '</ul>';
    }
    if (/^\d+\.\s+/.test(block)) {
      const items = block.split('\n').map(l => l.replace(/^\d+\.\s+/, '').trim());
      return '<ol>' + items.map(i => `<li>${inline(i)}</li>`).join('') + '</ol>';
    }
    return `<p>${inline(block.split('\n').join(' '))}</p>`;
  }).join('\n');
}

function plainTextExcerpt(md, maxLen) {
  const stripped = md.replace(/[#*_>\[\]()`-]/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.length > maxLen ? stripped.slice(0, maxLen).trim() + '…' : stripped;
}

function estimateReadTime(md) {
  const words = md.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200)) + ' min';
}

// ---------- Page template ----------
function buildPostPage(post) {
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.excerpt || plainTextExcerpt(post.body, 155));
  const url = `${SITE_URL}/blog/${post.slug}.html`;
  const rawImage = post.image || '/assets/logo.png';
  const image = rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
  const dateObj = new Date(post.date);
  const dateISO = isNaN(dateObj) ? '' : dateObj.toISOString();
  const dateDisplay = isNaN(dateObj) ? post.date : dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const readTime = post.readTime || estimateReadTime(post.body);
  const bodyHtml = markdownToHtml(post.body);
  const tag = escapeHtml(post.tag || 'update');

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || '',
    "image": image,
    "datePublished": dateISO,
    "author": { "@type": "Organization", "name": "The Gold Store" },
    "publisher": {
      "@type": "Organization",
      "name": "The Gold Store",
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/assets/logo.png` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": url }
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — The Gold Store Blog</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="icon" href="../favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="../assets/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="../assets/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="../assets/favicon-180.png">
<link rel="stylesheet" href="../assets/styles.css">
<script type="application/ld+json">${jsonLd}</script>

<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_ID}');
</script>
</head>
<body>
<div class="scroll-progress" id="scrollProgress"></div>

<div class="utility-bar">
  <div class="wrap">
    <div>
      <a href="tel:2525401367"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>(252) 540-1367</a>
      <a href="https://maps.google.com/?q=3006+E.+10th+Street+Greenville+NC" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>3006 E. 10th Street, Greenville, NC</a>
    </div>
    <div class="hours">Mon–Fri: 9AM–6PM &nbsp;|&nbsp; Sat: 10AM–2PM &nbsp;|&nbsp; Sun: Closed</div>
  </div>
</div>

<header class="site-header">
  <nav>
    <a href="../index.html#home" class="brand">
      <img class="brand-mark" src="../assets/logo.png" alt="The Gold Store logo">
      <span class="brand-name">The Gold Store<span>Precious Metals Buyer</span></span>
    </a>
    <ul class="nav-links">
      <li><a href="../index.html#home">Home</a></li>
      <li><a href="../index.html#about">About</a></li>
      <li><a href="../index.html#what-we-buy">What We Buy</a></li>
      <li><a href="../index.html#how-it-works">How It Works</a></li>
      <li><a href="../index.html#reviews">Reviews</a></li>
      <li><a href="../blog.html" style="color:var(--champagne);">Blog</a></li>
      <li><a href="../index.html#faq">FAQ</a></li>
      <li><a href="../index.html#contact">Contact</a></li>
    </ul>
    <a href="tel:2525401367" class="nav-cta">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      Call Now
    </a>
    <button class="menu-toggle" id="menuOpen" aria-label="Open menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
    </button>
  </nav>
</header>

<div class="mobile-nav" id="mobileNav">
  <button class="close-btn" id="menuClose">✕</button>
  <a href="../index.html#home">Home</a>
  <a href="../index.html#about">About</a>
  <a href="../index.html#what-we-buy">What We Buy</a>
  <a href="../index.html#how-it-works">How It Works</a>
  <a href="../index.html#reviews">Reviews</a>
  <a href="../blog.html">Blog</a>
  <a href="../index.html#faq">FAQ</a>
  <a href="../index.html#contact">Contact</a>
</div>

<section class="post-view">
  <div class="wrap" style="padding:0;">
    <a href="../blog.html" class="back">← Back to all posts</a>
    <span class="blog-tag">${tag}</span>
    <h1>${title}</h1>
    <div class="post-meta"><span>${dateDisplay}</span><span>&middot;</span><span>${readTime}</span></div>
    ${post.image ? `<img src="${post.image.startsWith('http') ? post.image : '..' + (post.image.startsWith('/') ? '' : '/') + post.image}" class="post-hero-image" alt="${title}">` : ''}
    <div class="post-body">${bodyHtml}</div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <img class="brand-mark footer-logo" src="../assets/logo.png" alt="The Gold Store">
        <div class="brand-name">The Gold Store<span>Precious Metals Buyer</span></div>
      </div>
      <div class="social-icons">
        <a href="https://www.facebook.com/61578571560617/" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z"/></svg></a>
        <a href="https://www.instagram.com/thegoldstoreofgreenville/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
      </div>
      <div class="footer-cols">
        <div class="footer-col">
          <h5>Explore</h5>
          <a href="../index.html#about">About</a>
          <a href="../index.html#what-we-buy">What We Buy</a>
          <a href="../index.html#how-it-works">How It Works</a>
          <a href="../blog.html">Blog</a>
        </div>
        <div class="footer-col">
          <h5>Visit</h5>
          <a href="tel:2525401367">(252) 540-1367</a>
          <a href="mailto:TheGoldStoreofGreenville@gmail.com">TheGoldStoreofGreenville@gmail.com</a>
          <a href="https://maps.google.com/?q=3006+E.+10th+Street+Greenville+NC" target="_blank" rel="noopener">3006 E. 10th Street, Greenville, NC</a>
        </div>
        <div class="footer-col">
          <h5>Legal</h5>
          <a href="../privacy.html">Privacy Policy</a>
          <a href="../terms.html">Terms &amp; Conditions</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span id="year"></span> The Gold Store. All rights reserved.</span>
      <span>Licensed &amp; Insured Precious Metals Buyer — Greenville, NC</span>
    </div>
  </div>
</footer>

<script src="../assets/main.js"></script>
</body>
</html>
`;
}

// ---------- Main ----------
function main() {
  const INDEX_PATH = path.join(ROOT, 'assets', 'posts-index.json');

  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No content/blog directory found - writing empty posts index.');
    fs.writeFileSync(INDEX_PATH, '[]\n');
    return;
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const posts = files.map(f => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
    return parseFrontmatter(raw, f.replace(/\.md$/, ''));
  }).filter(Boolean);

  posts.forEach(post => {
    const html = buildPostPage(post);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${post.slug}.html`), html);
  });

  // Regenerate sitemap.xml to include every post
  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/blog.html`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_URL}/privacy.html`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${SITE_URL}/terms.html`, changefreq: 'yearly', priority: '0.3' }
  ];
  const postUrls = posts.map(p => ({
    loc: `${SITE_URL}/blog/${p.slug}.html`,
    changefreq: 'monthly',
    priority: '0.7'
  }));
  const allUrls = staticUrls.concat(postUrls);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allUrls.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    `\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

  // Write a lightweight local index of all posts (title, tag, excerpt, image,
  // read time - no full body) that the browser can fetch directly as a normal
  // same-origin file. This replaces calling GitHub's API from every visitor's
  // browser, which is rate-limited to 60 requests/hour and was causing the
  // blog listing to silently fail under moderate testing/traffic.
  const indexEntries = posts
    .map(p => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      tag: p.tag || 'update',
      excerpt: p.excerpt || plainTextExcerpt(p.body, 140),
      image: p.image || null,
      readTime: p.readTime || estimateReadTime(p.body)
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(INDEX_PATH, JSON.stringify(indexEntries, null, 2) + '\n');

  console.log(`Built ${posts.length} blog post page(s), updated sitemap.xml, and wrote posts-index.json.`);
}

main();
